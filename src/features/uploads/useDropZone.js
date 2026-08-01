import { useCallback, useRef, useState } from 'react'
import { partitionFiles } from '../../lib/files.js'

/**
 * Drag-and-drop plumbing shared by both zones.
 *
 * The depth counter exists because dragenter/dragleave fire for every child
 * element the cursor crosses; counting them is what stops the drag-over
 * highlight from flickering as the pointer moves across the zone's contents.
 */
export function useDropZone({ accept, onFiles, multiple = false }) {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)

  const handle = useCallback(
    (fileList) => {
      const list = Array.from(fileList ?? [])
      if (list.length === 0) return

      const picked = multiple ? list : list.slice(0, 1)
      const { accepted, rejected } = partitionFiles(picked, accept)

      // Anything dropped past the first file in a single-file zone is a
      // rejection too — silently ignoring it would look like data loss.
      const extras = multiple
        ? []
        : list.slice(1).map((file) => ({ file, type: 'extra file', extra: true }))

      onFiles({ accepted, rejected: [...rejected, ...extras] })
    },
    [accept, multiple, onFiles],
  )

  const dragProps = {
    onDragEnter: (e) => {
      e.preventDefault()
      e.stopPropagation()
      depth.current += 1
      setDragging(true)
    },
    onDragOver: (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e) => {
      e.preventDefault()
      e.stopPropagation()
      depth.current -= 1
      if (depth.current <= 0) {
        depth.current = 0
        setDragging(false)
      }
    },
    onDrop: (e) => {
      e.preventDefault()
      e.stopPropagation()
      depth.current = 0
      setDragging(false)
      handle(e.dataTransfer?.files)
    },
  }

  return { dragging, dragProps, handleFiles: handle }
}
