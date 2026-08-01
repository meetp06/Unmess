from __future__ import annotations

import shutil
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from uuid import uuid4

from .models import ExtractedReceipt, Transaction


@dataclass
class StoredReceipt:
    receipt_id: str
    original_name: str
    content_type: str
    size: int
    path: Path


@dataclass
class ReconciliationSession:
    session_id: str
    directory: Path
    created_at: float = field(default_factory=time.time)
    transactions: list[Transaction] = field(default_factory=list)
    receipts: list[StoredReceipt] = field(default_factory=list)
    extracted_receipts: list[ExtractedReceipt] = field(default_factory=list)


class TemporarySessionStore:
    """In-memory session index backed by per-session temporary directories."""

    def __init__(self, ttl_seconds: int = 60 * 60 * 24) -> None:
        self.ttl_seconds = ttl_seconds
        self.root = Path(tempfile.gettempdir()) / "messy-ops-reconciler"
        self.root.mkdir(parents=True, exist_ok=True)
        self._sessions: dict[str, ReconciliationSession] = {}

    def create(self, transactions: list[Transaction]) -> ReconciliationSession:
        session_id = uuid4().hex
        directory = self.root / session_id
        directory.mkdir(parents=True, exist_ok=False)
        session = ReconciliationSession(
            session_id=session_id, directory=directory, transactions=transactions
        )
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> ReconciliationSession | None:
        self.cleanup_expired()
        return self._sessions.get(session_id)

    def add_receipt(
        self,
        session: ReconciliationSession,
        original_name: str,
        content_type: str,
        contents: bytes,
        suffix: str,
    ) -> StoredReceipt:
        receipt_id = uuid4().hex
        path = session.directory / f"{receipt_id}{suffix}"
        path.write_bytes(contents)
        receipt = StoredReceipt(
            receipt_id=receipt_id,
            original_name=original_name,
            content_type=content_type,
            size=len(contents),
            path=path,
        )
        session.receipts.append(receipt)
        # A newer upload changes the source set, so prior extraction is no longer valid.
        session.extracted_receipts = []
        return receipt

    def find_receipt(self, session_id: str, receipt_id: str) -> StoredReceipt | None:
        session = self.get(session_id)
        if session is None:
            return None
        return next((item for item in session.receipts if item.receipt_id == receipt_id), None)

    def cleanup_expired(self) -> None:
        cutoff = time.time() - self.ttl_seconds
        expired = [sid for sid, item in self._sessions.items() if item.created_at < cutoff]
        for session_id in expired:
            self.remove(session_id)

    def remove(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if session:
            shutil.rmtree(session.directory, ignore_errors=True)

    def cleanup_all(self) -> None:
        for session_id in list(self._sessions):
            self.remove(session_id)
