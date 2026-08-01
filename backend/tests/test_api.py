from fastapi.testclient import TestClient

from app.main import app
from app.models import ExtractedReceipt, Transaction
from app.services import reconcile
from app.store import ReconciliationSession


client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_bank_statement_upload_validates_and_returns_transactions():
    csv = "Transaction_ID,Date,Vendor,Amount_USD\nTX-101,2026-07-30,Acme Supplies,40.50\n"
    response = client.post(
        "/api/upload/bank-statement",
        files={"file": ("statement.csv", csv, "text/csv")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["transactions"] == [
        {
            "transaction_id": "TX-101",
            "date": "2026-07-30",
            "vendor": "Acme Supplies",
            "amount": "40.50",
        }
    ]
    assert payload["session_id"]


def test_bank_statement_rejects_missing_required_columns():
    csv = "Transaction_ID,Date,Vendor\nTX-101,2026-07-30,Acme Supplies\n"
    response = client.post(
        "/api/upload/bank-statement",
        files={"file": ("statement.csv", csv, "text/csv")},
    )
    assert response.status_code == 422
    assert "Amount_USD" in response.json()["detail"]


def test_receipt_upload_rejects_non_images():
    csv = "Transaction_ID,Date,Vendor,Amount_USD\nTX-101,2026-07-30,Acme Supplies,40.50\n"
    session_id = client.post(
        "/api/upload/bank-statement",
        files={"file": ("statement.csv", csv, "text/csv")},
    ).json()["session_id"]
    response = client.post(
        "/api/upload/receipts",
        data={"session_id": session_id},
        files=[("files", ("not-a-receipt.txt", b"not an image", "text/plain"))],
    )
    assert response.status_code == 415


def test_reconcile_marks_match_discrepancy_and_missing_without_reusing_receipts(tmp_path):
    session = ReconciliationSession(
        session_id="test-session",
        directory=tmp_path,
        transactions=[
            Transaction(transaction_id="TX-1", date="2026-07-30", vendor="Acme Supply", amount="40.50"),
            Transaction(transaction_id="TX-2", date="2026-07-30", vendor="North Star Coffee", amount="10.00"),
            Transaction(transaction_id="TX-3", date="2026-07-30", vendor="Metro Parking", amount="25.00"),
        ],
        extracted_receipts=[
            ExtractedReceipt(receipt_id="R-1", file_name="acme.png", vendor="ACME Supplies", date="2026-07-30", amount="40.50", image_url="/image/acme"),
            ExtractedReceipt(receipt_id="R-2", file_name="coffee.png", vendor="Northstar Coffee", date="2026-07-30", amount="12.00", image_url="/image/coffee"),
        ],
    )

    results = reconcile(session)

    assert [result.status for result in results] == ["matched", "amount_discrepancy", "missing_receipt"]
    assert results[0].receipt_image == "/image/acme"
    assert str(results[1].receipt_amount) == "12.00"
    assert results[2].receipt_vendor is None
