from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .models import (
    BankStatementUploadResponse,
    ExtractReceiptsRequest,
    ExtractReceiptsResponse,
    ReceiptMetadata,
    ReceiptsUploadResponse,
    ReconcileRequest,
    ReconcileResponse,
)
from .services import (
    MAX_RECEIPTS_PER_SESSION,
    extract_receipts,
    parse_bank_statement,
    reconcile,
    validate_receipt_upload,
)
from .store import TemporarySessionStore

load_dotenv()
store = TemporarySessionStore()


@asynccontextmanager
async def lifespan(_: FastAPI):
    store.cleanup_expired()
    yield
    # Uploaded receipts live only for the app's lifetime or the 24-hour session TTL.
    store.cleanup_all()


app = FastAPI(
    title="Messy Ops Reconciler API",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/upload/bank-statement", response_model=BankStatementUploadResponse)
async def upload_bank_statement(file: UploadFile = File(...)) -> BankStatementUploadResponse:
    if Path(file.filename or "").suffix.lower() != ".csv":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Bank statement must be a CSV file.",
        )
    contents = await file.read()
    transactions = parse_bank_statement(contents)
    session = store.create(transactions)
    return BankStatementUploadResponse(
        session_id=session.session_id,
        transactions=transactions,
        message=f"Validated {len(transactions)} bank transactions.",
    )


@app.post("/api/upload/receipts", response_model=ReceiptsUploadResponse)
async def upload_receipts(
    request: Request,
    session_id: str = Form(...),
    files: list[UploadFile] = File(...),
) -> ReceiptsUploadResponse:
    session = store.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session was not found or has expired.",
        )
    if not files:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upload at least one receipt image.",
        )
    if len(session.receipts) + len(files) > MAX_RECEIPTS_PER_SESSION:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"A session may contain at most {MAX_RECEIPTS_PER_SESSION} receipts.",
        )

    pending: list[tuple[UploadFile, bytes, str]] = []
    for file in files:
        file_name = Path(file.filename or "receipt").name
        contents = await file.read()
        suffix = validate_receipt_upload(file_name, file.content_type, contents)
        pending.append((file, contents, suffix))

    metadata: list[ReceiptMetadata] = []
    for file, contents, suffix in pending:
        file_name = Path(file.filename or "receipt").name
        receipt = store.add_receipt(
            session,
            file_name,
            file.content_type or "application/octet-stream",
            contents,
            suffix,
        )
        metadata.append(
            ReceiptMetadata(
                receipt_id=receipt.receipt_id,
                file_name=receipt.original_name,
                content_type=receipt.content_type,
                size=receipt.size,
                image_url=str(
                    request.url_for(
                        "get_receipt_image",
                        session_id=session.session_id,
                        receipt_id=receipt.receipt_id,
                    )
                ),
            )
        )
    return ReceiptsUploadResponse(
        session_id=session.session_id,
        receipts=metadata,
        message=f"Stored {len(metadata)} receipt image(s).",
    )


@app.get("/api/receipts/{session_id}/{receipt_id}/image", name="get_receipt_image")
def get_receipt_image(session_id: str, receipt_id: str) -> FileResponse:
    receipt = store.find_receipt(session_id, receipt_id)
    if receipt is None or not receipt.path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt image was not found.",
        )
    return FileResponse(
        receipt.path,
        media_type=receipt.content_type,
        filename=receipt.original_name,
    )


@app.post("/api/extract-receipts", response_model=ExtractReceiptsResponse)
def extract_uploaded_receipts(
    payload: ExtractReceiptsRequest, request: Request
) -> ExtractReceiptsResponse:
    session = store.get(payload.session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session was not found or has expired.",
        )
    receipts = extract_receipts(
        session,
        lambda receipt_id: str(
            request.url_for(
                "get_receipt_image",
                session_id=session.session_id,
                receipt_id=receipt_id,
            )
        ),
    )
    return ExtractReceiptsResponse(session_id=session.session_id, receipts=receipts)


@app.post("/api/reconcile", response_model=ReconcileResponse)
def reconcile_receipts(payload: ReconcileRequest) -> ReconcileResponse:
    session = store.get(payload.session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session was not found or has expired.",
        )
    return ReconcileResponse(session_id=session.session_id, results=reconcile(session))
