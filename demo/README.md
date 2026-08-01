# Demo upload pack

Use this folder to demonstrate the full reconciliation workflow. All receipts are fictional test assets.

## Quick demo (5 transactions)

1. Upload `bank-statement-demo.csv` as the bank statement.
2. Upload `acme-office-supply.png`, `north-star-coffee.png`, `cloudline-software.png`, and `union-market-sf.png` from `receipts/`.
3. Select **Run reconciliation**.

Expected outcome: three matched transactions, one amount discrepancy, and one missing receipt.

| Bank transaction | Receipt image | Expected status |
| --- | --- | --- |
| TX-80421 — Acme Office Supply — $184.50 | `receipts/acme-office-supply.png` | Matched |
| TX-80418 — Northstar Coffee — $42.80 | `receipts/north-star-coffee.png` — $47.80 | Amount discrepancy |
| TX-80411 — Metro Parking — $36.00 | No uploaded receipt | Missing receipt |
| TX-80407 — Cloudline Software — $249.00 | `receipts/cloudline-software.png` | Matched |
| TX-80399 — Union Market — $81.24 | `receipts/union-market-sf.png` | Matched |

## Expanded demo (12 transactions)

1. Upload `bank-statement-expanded-demo.csv` as the bank statement.
2. Upload all eight PNG files in `receipts/`.
3. Select **Run reconciliation**.

Expected outcome: six matched transactions, two amount discrepancies, and four missing receipts. This larger scenario includes intentionally varied vendor spelling, matched amounts, wrong amounts, and no-receipt cases.

| Transaction ID | Vendor | Expected status |
| --- | --- | --- |
| TX-80421 | Acme Office Supply | Matched |
| TX-80418 | Northstar Coffee | Amount discrepancy |
| TX-80411 | Metro Parking | Missing receipt |
| TX-80407 | Cloudline Software | Matched |
| TX-80399 | Union Market | Matched |
| TX-80429 | Harbor Hardware | Matched |
| TX-80434 | Pacific Paper Company | Matched |
| TX-80440 | Green Line Transit | Matched |
| TX-80444 | Redwood Print Laboratory | Amount discrepancy |
| TX-80449 | Bay City Internet | Missing receipt |
| TX-80453 | Summit Team Lunch | Missing receipt |
| TX-80456 | Apex Parcel Service | Missing receipt |

The receipt names intentionally vary slightly from the bank vendor names, so the demo also exercises fuzzy vendor matching.
