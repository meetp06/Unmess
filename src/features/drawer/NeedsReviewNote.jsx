import { ratio } from '../../lib/format.js'
import { fieldDiffs } from '../../lib/row.js'

/**
 * The note that makes `needs_review` mean something.
 *
 * A discrepancy says "here is what is wrong". This says "here is what we could
 * not determine" — a different claim, and the drawer states it before showing
 * any numbers, so nobody reads an untrusted amount as a finding.
 *
 * Everything here is derived from fields the contract already defines
 * (reason, confidence, ocr_confidence, and the two sides of the comparison).
 * No extra field is invented to carry it.
 */
export default function NeedsReviewNote({ row }) {
  if (row.status !== 'needs_review') return null

  const r = row.receipt
  const diffs = fieldDiffs(row)

  const causes = []
  if (r && typeof r.ocr_confidence === 'number' && r.ocr_confidence < 0.65) {
    causes.push(
      `The scan read at ${ratio(r.ocr_confidence)} confidence, so the extracted vendor, amount and date may not be what the paper actually says.`,
    )
  }
  if (typeof row.confidence === 'number' && row.confidence < 0.65) {
    causes.push(
      `The match score is ${ratio(row.confidence)} — low enough that this receipt may belong to a different transaction entirely.`,
    )
  }
  if (!r) {
    causes.push('No receipt was attached, so there was nothing to verify against.')
  }
  if (diffs.vendor) {
    causes.push('The vendor on the receipt could not be tied to the statement descriptor.')
  }
  if (diffs.amount && diffs.date) {
    causes.push('Both the amount and the date disagree, which is not a typical single-cause error.')
  }
  if (causes.length === 0) {
    causes.push('The matcher returned this row without a confident verdict.')
  }

  return (
    <section
      className="rounded-sm border border-dashed border-warn/55 bg-warn-soft p-3"
      aria-labelledby="needs-review-heading"
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-warn font-mono text-2xs text-warn"
        >
          ?
        </span>
        <div className="min-w-0">
          <h3 id="needs-review-heading" className="text-xs font-medium text-warn">
            The system could not decide this one
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">
            This is not a finding. Nothing below has been confirmed — treat the
            extracted values as unverified until a person checks the scan.
          </p>

          <ul className="mt-2 space-y-1">
            {causes.map((cause, i) => (
              <li
                key={i}
                className="flex gap-1.5 text-xs leading-relaxed text-ink-dim"
              >
                <span className="text-warn" aria-hidden="true">
                  ·
                </span>
                <span className="min-w-0">{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
