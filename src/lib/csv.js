/**
 * Client-side CSV inspection. Just enough to tell the user what they dropped —
 * parsing the statement is the backend's job, not this UI's.
 */

export function isCsvFile(file) {
  if (!file) return false
  const name = (file.name ?? '').toLowerCase()
  if (name.endsWith('.csv')) return true
  // Some browsers report no type for .csv; only trust the type when it is one
  // of the CSV spellings, never as a reason to reject a correctly-named file.
  return ['text/csv', 'application/csv', 'text/comma-separated-values'].includes(
    file.type,
  )
}

/**
 * Counts data rows, quote-aware: a newline inside "Smith, John\nInc" is part of
 * the field, not a row break. A naive split on \n reports the wrong count on
 * exactly the messy exports this app exists to handle.
 */
export function countCsvRows(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { rows: 0, columns: 0, header: [] }
  }

  let lines = 0
  let inQuotes = false
  let sawContent = false
  let firstLineEnd = -1

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]

    if (c === '"') {
      // "" inside a quoted field is an escaped quote, not a terminator.
      if (inQuotes && text[i + 1] === '"') {
        i += 1
        continue
      }
      inQuotes = !inQuotes
      sawContent = true
      continue
    }

    if (!inQuotes && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i += 1
      if (sawContent) {
        lines += 1
        if (firstLineEnd === -1) firstLineEnd = i
      }
      sawContent = false
      continue
    }

    if (c !== ' ' && c !== '\t') sawContent = true
  }
  if (sawContent) lines += 1

  const header = splitCsvLine(
    firstLineEnd === -1 ? text : text.slice(0, firstLineEnd),
  )

  return {
    // First line is the header, so data rows are one fewer.
    rows: Math.max(0, lines - 1),
    columns: header.length,
    header,
  }
}

/** Split a single CSV line, respecting quotes. Used only for the header preview. */
export function splitCsvLine(line) {
  const out = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (c === ',' && !inQuotes) {
      out.push(field.trim())
      field = ''
      continue
    }
    field += c
  }
  out.push(field.trim())

  return out.filter((_, i, arr) => !(arr.length === 1 && arr[0] === ''))
}

/** Reads a File as text. Rejects with a message worth showing on screen. */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () =>
      reject(new Error(`Could not read ${file.name}: ${reader.error?.message ?? 'unknown error'}`))
    reader.readAsText(file)
  })
}
