from __future__ import annotations

import json
import os
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path
from typing import Callable

import pandas as pd
from fastapi import HTTPException, status
from google import genai
from google.genai import errors, types
from pydantic import BaseModel
from rapidfuzz import fuzz

from .models import ExtractedReceipt, ReconciliationResult, Transaction
from .store import ReconciliationSession, StoredReceipt

REQUIRED_CSV_COLUMNS = {"Transaction_ID", "Date", "Vendor", "Amount_USD"}
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png"}
MAX_CSV_SIZE = 5 * 1024 * 1024
MAX_RECEIPT_SIZE = 10 * 1024 * 1024
MAX_RECEIPTS_PER_SESSION = 25
VENDOR_MATCH_THRESHOLD = 70.0
AMOUNT_TOLERANCE = Decimal("0.01")
SYSTEM_PROMPT = (
    "You are an expert accountant. Examine this image of a receipt or invoice. "
    "Extract the Vendor Name, the Date, and the Total Amount. You must return your "
    "response as STRICT, valid JSON only, with no markdown formatting. The JSON keys "
    "must be: vendor, date, and amount."
)


class ReceiptVisionPayload(BaseModel):
    vendor: str
    date: str
    amount: float


def parse_amount(value: object, field_name: str = "Amount_USD") -> Decimal:
    raw = str(value).strip().replace("$", "").replace(",", "")
    try:
        amount = Decimal(raw).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid dollar amount.") from exc
    if not amount.is_finite():
        raise ValueError(f"{field_name} must be finite.")
    return amount


def parse_iso_date(value: object, field_name: str = "Date") -> str:
    try:
        parsed = pd.to_datetime(str(value), errors="raise")
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid date.") from exc
    return parsed.date().isoformat()


def parse_bank_statement(contents: bytes) -> list[Transaction]:
    if not contents:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CSV file is empty.")
    if len(contents) > MAX_CSV_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="CSV exceeds the 5 MB limit.")

    try:
        frame = pd.read_csv(BytesIO(contents), dtype=str, keep_default_na=False)
    except (UnicodeDecodeError, pd.errors.ParserError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unable to parse CSV.") from exc

    frame.columns = [str(column).strip() for column in frame.columns]
    missing = REQUIRED_CSV_COLUMNS.difference(frame.columns)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CSV is missing required columns: {', '.join(sorted(missing))}.",
        )
    if frame.empty:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CSV has no transactions.")
    if len(frame) > 1_000:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CSV may contain at most 1,000 transactions.")

    transactions: list[Transaction] = []
    seen_ids: set[str] = set()
    for row_number, row in frame.iterrows():
        row_label = f"Row {row_number + 2}"
        transaction_id = str(row["Transaction_ID"]).strip()
        vendor = str(row["Vendor"]).strip()
        if not transaction_id or not vendor:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{row_label}: Transaction_ID and Vendor are required.",
            )
        if transaction_id in seen_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{row_label}: duplicate Transaction_ID '{transaction_id}'.",
            )
        try:
            transaction = Transaction(
                transaction_id=transaction_id,
                date=parse_iso_date(row["Date"], f"{row_label} Date"),
                vendor=vendor,
                amount=parse_amount(row["Amount_USD"], f"{row_label} Amount_USD"),
            )
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
        seen_ids.add(transaction_id)
        transactions.append(transaction)
    return transactions


def validate_receipt_upload(file_name: str, content_type: str | None, contents: bytes) -> str:
    suffix = Path(file_name).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"'{file_name}' is not a JPG or PNG image.")
    if not contents:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"'{file_name}' is empty.")
    if len(contents) > MAX_RECEIPT_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"'{file_name}' exceeds the 10 MB limit.")
    if suffix == ".png" and not contents.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"'{file_name}' is not a valid PNG file.")
    if suffix in {".jpg", ".jpeg"} and not contents.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"'{file_name}' is not a valid JPG file.")
    supported_content_types = {"image/jpeg", "image/png", "image/jpg", "application/octet-stream"}
    if content_type and content_type not in supported_content_types:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"'{file_name}' has unsupported media type '{content_type}'.")
    return suffix


def vendor_match_score(csv_vendor: str, receipt_vendor: str) -> float:
    """Score raw names and a conservative normalized form for everyday suffix variants."""

    def normalize(value: str) -> str:
        cleaned = re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()
        words = [word for word in cleaned.split() if word not in {"inc", "llc", "ltd", "corp", "co", "company"}]
        normalized_words = []
        for word in words:
            if len(word) > 4 and word.endswith("ies"):
                normalized_words.append(f"{word[:-3]}y")
            elif len(word) > 4 and word.endswith("s"):
                normalized_words.append(word[:-1])
            else:
                normalized_words.append(word)
        return " ".join(normalized_words)

    return max(
        float(fuzz.token_set_ratio(csv_vendor, receipt_vendor)),
        float(fuzz.token_set_ratio(normalize(csv_vendor), normalize(receipt_vendor))),
    )


def _gemini_client() -> tuple[genai.Client, str]:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_VISION_MODEL")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GEMINI_API_KEY is not configured.")
    if not model:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GEMINI_VISION_MODEL is not configured.")
    return genai.Client(api_key=api_key), model


def _parse_vision_response(output: str, receipt: StoredReceipt, image_url: str) -> ExtractedReceipt:
    try:
        data = json.loads(output)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini returned invalid JSON for '{receipt.original_name}'.",
        ) from exc
    if not isinstance(data, dict) or set(data) != {"vendor", "date", "amount"}:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini returned an unexpected receipt schema for '{receipt.original_name}'.",
        )
    vendor = str(data["vendor"]).strip()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Gemini did not return a vendor for '{receipt.original_name}'.")
    try:
        return ExtractedReceipt(
            receipt_id=receipt.receipt_id,
            file_name=receipt.original_name,
            vendor=vendor,
            date=parse_iso_date(data["date"], "Receipt date"),
            amount=parse_amount(data["amount"], "Receipt amount"),
            image_url=image_url,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini returned invalid receipt fields for '{receipt.original_name}': {exc}",
        ) from exc


def extract_receipts(
    session: ReconciliationSession, image_url_builder: Callable[[str], str]
) -> list[ExtractedReceipt]:
    if not session.receipts:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Upload at least one receipt before extraction.")
    client, model = _gemini_client()
    extracted: list[ExtractedReceipt] = []
    for receipt in session.receipts:
        try:
            response = client.models.generate_content(
                model=model,
                contents=[
                    SYSTEM_PROMPT,
                    types.Part.from_bytes(
                        data=receipt.path.read_bytes(),
                        mime_type=receipt.content_type,
                    ),
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ReceiptVisionPayload,
                ),
            )
        except errors.APIError as exc:
            http_status = int(getattr(exc, "code", status.HTTP_502_BAD_GATEWAY))
            if http_status == status.HTTP_401_UNAUTHORIZED:
                detail = "Gemini rejected the configured API key."
            elif http_status == status.HTTP_403_FORBIDDEN:
                detail = f"Gemini denied access to model '{model}'. Check the API key's project and model access."
            elif http_status == status.HTTP_429_TOO_MANY_REQUESTS:
                detail = "Gemini vision is currently rate limited or out of quota."
            else:
                provider_message = " ".join(str(exc).split())[:300]
                detail = f"Gemini could not extract '{receipt.original_name}': {provider_message or 'provider request failed.'}"
            raise HTTPException(
                status_code=http_status,
                detail=detail,
            ) from exc
        extracted.append(_parse_vision_response(response.text, receipt, image_url_builder(receipt.receipt_id)))
    session.extracted_receipts = extracted
    return extracted


def _days_apart(first: str, second: str) -> int:
    try:
        return abs((date.fromisoformat(first) - date.fromisoformat(second)).days)
    except ValueError:
        return 31


def _confidence(vendor_score: float, amount_difference: Decimal, csv_date: str, receipt_date: str) -> float:
    amount_score = 100.0 if amount_difference <= AMOUNT_TOLERANCE else max(0.0, 100.0 - float(amount_difference) * 10)
    day_gap = _days_apart(csv_date, receipt_date)
    date_score = 100.0 if day_gap == 0 else max(0.0, 100.0 - day_gap * 10)
    return round((vendor_score * 0.7) + (amount_score * 0.2) + (date_score * 0.1), 1)


def reconcile(session: ReconciliationSession) -> list[ReconciliationResult]:
    if not session.extracted_receipts:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Run /api/extract-receipts before reconciliation.")

    candidates: list[tuple[float, int, int, Decimal]] = []
    for tx_index, transaction in enumerate(session.transactions):
        for receipt_index, receipt in enumerate(session.extracted_receipts):
            vendor_score = vendor_match_score(transaction.vendor, receipt.vendor)
            if vendor_score < VENDOR_MATCH_THRESHOLD:
                continue
            amount_difference = abs(transaction.amount - receipt.amount)
            candidates.append((vendor_score, tx_index, receipt_index, amount_difference))

    assigned: dict[int, int] = {}
    used_receipts: set[int] = set()
    for vendor_score, tx_index, receipt_index, amount_difference in sorted(
        candidates,
        key=lambda item: (item[3] <= AMOUNT_TOLERANCE, item[0], -float(item[3])),
        reverse=True,
    ):
        if tx_index not in assigned and receipt_index not in used_receipts:
            assigned[tx_index] = receipt_index
            used_receipts.add(receipt_index)

    results: list[ReconciliationResult] = []
    for tx_index, transaction in enumerate(session.transactions):
        receipt_index = assigned.get(tx_index)
        if receipt_index is None:
            results.append(
                ReconciliationResult(
                    transaction_id=transaction.transaction_id,
                    date=transaction.date,
                    csv_vendor=transaction.vendor,
                    csv_amount=transaction.amount,
                    status="missing_receipt",
                    confidence=0,
                )
            )
            continue
        receipt = session.extracted_receipts[receipt_index]
        difference = abs(transaction.amount - receipt.amount)
        status_value = "matched" if difference <= AMOUNT_TOLERANCE else "amount_discrepancy"
        results.append(
            ReconciliationResult(
                transaction_id=transaction.transaction_id,
                date=transaction.date,
                csv_vendor=transaction.vendor,
                receipt_vendor=receipt.vendor,
                csv_amount=transaction.amount,
                receipt_amount=receipt.amount,
                status=status_value,
                confidence=_confidence(
                    vendor_match_score(transaction.vendor, receipt.vendor),
                    difference,
                    transaction.date,
                    receipt.date,
                ),
                receipt_image=receipt.image_url,
            )
        )
    return results
