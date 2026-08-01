/**
 * Ugly bank descriptor ↔ clean OCR'd name.
 *
 * The whole point of these fixtures: `csv.vendor` is what a bank actually puts
 * on a statement — truncated mid-word, all caps, processor prefixes, store
 * numbers, city/state tails, phone numbers — while `receipt.vendor` is the
 * human name printed on the paper. If the two sides matched on a simple string
 * compare, the matching problem would not exist and the UI would be lying about
 * how hard the backend's job is.
 *
 * `receipt` names an SVG in /public/mock/receipts. Five images cover ~20 vendors,
 * which is also true of real fixture sets.
 */
export const VENDORS = [
  { raw: 'SQ *BLUE BOTTLE COFFE', clean: 'Blue Bottle Coffee', receipt: 'IMG_4482.svg', lo: 4, hi: 26 },
  { raw: "TST* MAMA'S KITCH", clean: "Mama's Kitchen", receipt: 'IMG_4482.svg', lo: 18, hi: 96 },
  { raw: 'AMZN MKTP US*2K4L9', clean: 'Amazon Marketplace', receipt: 'IMG_4471.svg', lo: 9, hi: 340 },
  { raw: 'PAYPAL *UBER TRIP HELP.UB', clean: 'Uber', receipt: 'IMG_4503.svg', lo: 7, hi: 68 },
  { raw: 'POS DEBIT WHOLEFDS MKT #10259 SEATTLE WA', clean: 'Whole Foods Market', receipt: 'IMG_4482.svg', lo: 22, hi: 214 },
  { raw: 'SP DEEL* PAYROLL SVC', clean: 'Deel', receipt: 'IMG_4519.svg', lo: 480, hi: 2400 },
  { raw: 'ACH DEBIT ADOBE INC ADOBE  800-833-6687', clean: 'Adobe', receipt: 'IMG_4519.svg', lo: 19, hi: 89 },
  { raw: 'WM SUPERCENTER #2841 T', clean: 'Walmart', receipt: 'IMG_4471.svg', lo: 12, hi: 187 },
  { raw: 'SQ *TARTINE BAKERY & CA', clean: 'Tartine Bakery & Cafe', receipt: 'IMG_4482.svg', lo: 6, hi: 42 },
  { raw: 'TST* THE PURPLE ONION S', clean: 'The Purple Onion', receipt: 'IMG_4482.svg', lo: 24, hi: 128 },
  { raw: 'GOOGLE *CLOUD BXK2299', clean: 'Google Cloud', receipt: 'IMG_4519.svg', lo: 41, hi: 780 },
  { raw: 'PY *STAPLES 00119338', clean: 'Staples', receipt: 'IMG_4527.svg', lo: 8, hi: 264 },
  { raw: 'DD *DOORDASH LUNCHBOX', clean: 'DoorDash', receipt: 'IMG_4503.svg', lo: 14, hi: 82 },
  { raw: 'IN *NORTHSIDE PRINT CO', clean: 'Northside Print Co.', receipt: 'IMG_4527.svg', lo: 35, hi: 410 },
  { raw: 'SHELL OIL 57443298104', clean: 'Shell', receipt: 'IMG_4503.svg', lo: 28, hi: 96 },
  { raw: 'COSTCO WHSE #0417 KIRKLAND', clean: 'Costco Wholesale', receipt: 'IMG_4471.svg', lo: 44, hi: 620 },
  { raw: 'SQ *ROASTED & TOASTED L', clean: 'Roasted & Toasted', receipt: 'IMG_4482.svg', lo: 5, hi: 31 },
  { raw: 'ACH DEBIT SLACK TECHNOLOG SLACK', clean: 'Slack Technologies', receipt: 'IMG_4519.svg', lo: 87, hi: 640 },
  { raw: 'LYFT   *RIDE THU 4PM', clean: 'Lyft', receipt: 'IMG_4503.svg', lo: 9, hi: 74 },
  { raw: 'OFFICE DEPOT #5512 BELLEVUE WA', clean: 'Office Depot', receipt: 'IMG_4527.svg', lo: 16, hi: 233 },
  { raw: 'UPS*000000E4471X9', clean: 'UPS Store', receipt: 'IMG_4527.svg', lo: 11, hi: 148 },
  { raw: 'SQ *EL PATRON TAQUERI', clean: 'El Patron Taqueria', receipt: 'IMG_4482.svg', lo: 13, hi: 78 },
]

/** All receipt images referenced above, for preloading and for the sample set. */
export const RECEIPT_IMAGES = [
  'IMG_4471.svg',
  'IMG_4482.svg',
  'IMG_4503.svg',
  'IMG_4519.svg',
  'IMG_4527.svg',
]

export const RECEIPT_DIR = '/mock/receipts'

export function receiptUrl(filename) {
  return `${RECEIPT_DIR}/${filename}`
}

/** Line items plausible for a given vendor, so the drawer is not obviously fake. */
export const LINE_ITEM_POOL = {
  'Blue Bottle Coffee': ['Drip coffee', 'Oat cortado', 'Almond croissant'],
  "Mama's Kitchen": ['Chicken plate', 'Side salad', 'Iced tea', 'Bread basket'],
  'Amazon Marketplace': ['USB-C cable', 'HDMI adapter', 'Label maker tape', 'AA batteries'],
  Uber: ['Trip fare', 'Booking fee', 'Tip'],
  'Whole Foods Market': ['Cold brew 32oz', 'Bananas', 'Sourdough loaf', 'Oat milk'],
  Deel: ['Contractor payout', 'Platform fee'],
  Adobe: ['Creative Cloud — 1 seat'],
  Walmart: ['Paper towels', 'Dish soap', 'Trash bags'],
  'Tartine Bakery & Cafe': ['Morning bun', 'Cappuccino'],
  'The Purple Onion': ['Lunch special', 'Sparkling water'],
  'Google Cloud': ['Compute Engine', 'Cloud Storage', 'Egress'],
  Staples: ['Copy paper 5-ream', 'Binder clips', 'Toner cartridge'],
  DoorDash: ['Order subtotal', 'Delivery fee', 'Service fee'],
  'Northside Print Co.': ['Business cards ×500', 'Setup fee'],
  Shell: ['Unleaded 87 — 14.2 gal'],
  'Costco Wholesale': ['Coffee 3lb', 'Paper plates', 'Bottled water ×40'],
  'Roasted & Toasted': ['House blend', 'Bagel'],
  'Slack Technologies': ['Business+ — 12 seats'],
  Lyft: ['Ride fare', 'Service fee'],
  'Office Depot': ['Desk organizer', 'Pens ×24'],
  'UPS Store': ['Ground shipping', 'Packing materials'],
  'El Patron Taqueria': ['Al pastor tacos ×3', 'Horchata'],
}

const GENERIC_ITEMS = ['Item', 'Service charge', 'Tax']

export function lineItemsFor(cleanVendor) {
  return LINE_ITEM_POOL[cleanVendor] ?? GENERIC_ITEMS
}
