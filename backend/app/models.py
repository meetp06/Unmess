from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class Transaction(BaseModel):
    transaction_id: str
    date: str
    vendor: str
    amount: Decimal


class BankStatementUploadResponse(BaseModel):
    session_id: str
    transactions: list[Transaction]
    message: str


class ReceiptMetadata(BaseModel):
    receipt_id: str
    file_name: str
    content_type: str
    size: int
    image_url: str


class ReceiptsUploadResponse(BaseModel):
    session_id: str
    receipts: list[ReceiptMetadata]
    message: str


class ExtractReceiptsRequest(BaseModel):
    session_id: str = Field(min_length=1)


class ExtractedReceipt(BaseModel):
    receipt_id: str
    file_name: str
    vendor: str
    date: str
    amount: Decimal
    image_url: str


class ExtractReceiptsResponse(BaseModel):
    session_id: str
    receipts: list[ExtractedReceipt]


class ReconcileRequest(BaseModel):
    session_id: str = Field(min_length=1)


class ReconciliationResult(BaseModel):
    transaction_id: str
    date: str
    csv_vendor: str
    receipt_vendor: str | None = None
    csv_amount: Decimal
    receipt_amount: Decimal | None = None
    status: Literal["matched", "amount_discrepancy", "missing_receipt"]
    confidence: float = Field(ge=0, le=100)
    receipt_image: str | None = None


class ReconcileResponse(BaseModel):
    session_id: str
    results: list[ReconciliationResult]
