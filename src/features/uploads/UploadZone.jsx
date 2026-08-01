import { useId, useRef } from 'react'

/**
 * The drop surface. Click-to-browse is a real fallback, not decoration: the
 * whole zone is a <button>, so it works from the keyboard and with a screen
 * reader, and the hidden <input type=file> is what actually opens the picker.
 */
export default function UploadZone({
  title,
  hint,
  accept,
  multiple = false,
  dragging,
  dragProps,
  onPick,
  disabled = false,
  children,
}) {
  const inputRef = useRef(null)
  const id = useId()

  return (
    <div
      {...dragProps}
      className={[
        'flex min-h-[168px] flex-col rounded-sm border transition-colors',
        dragging
          ? 'border-solid border-focus bg-focus/[0.07]'
          : 'border-dashed border-line-strong bg-surface hover:border-ink-faint',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-6 text-center disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          className={[
            'flex h-8 w-8 items-center justify-center rounded-sm border text-sm transition-colors',
            dragging ? 'border-focus text-focus' : 'border-line-strong text-ink-faint',
          ].join(' ')}
        >
          ↓
        </span>
        <span className="text-xs font-medium text-ink">
          {dragging ? 'Release to add' : title}
        </span>
        <span id={`${id}-hint`} className="text-2xs text-ink-faint">
          {hint}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files)
          // Reset so picking the same file twice still fires a change event.
          e.target.value = ''
        }}
      />

      {children}
    </div>
  )
}
