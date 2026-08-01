const IMAGE_EXT = /\.(jpe?g|png)$/i
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export function isReceiptImage(file) {
  if (!file) return false
  if (IMAGE_TYPES.includes(file.type)) return true
  return IMAGE_EXT.test(file.name ?? '')
}

/** A short, human description of what a file actually is, for reject messages. */
export function describeFileType(file) {
  const name = file?.name ?? ''
  const dot = name.lastIndexOf('.')
  if (dot > 0 && dot < name.length - 1) return name.slice(dot + 1).toUpperCase()
  if (file?.type) return file.type
  return 'unknown type'
}

/**
 * Splits a drop into what we can use and what we cannot, keeping the reason
 * attached to each rejected file so the UI can name the problem file rather
 * than failing silently.
 */
export function partitionFiles(files, accept) {
  const accepted = []
  const rejected = []

  for (const file of Array.from(files ?? [])) {
    if (accept(file)) accepted.push(file)
    else rejected.push({ file, type: describeFileType(file) })
  }

  return { accepted, rejected }
}
