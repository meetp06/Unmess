import { useId, useState } from 'react'

/**
 * Minimal tooltip. Listeners live on the wrapper, not the trigger, because the
 * most important thing this tooltip explains is a *disabled* button — and a
 * disabled button fires no pointer events of its own.
 */
export default function Tooltip({
  content,
  children,
  placement = 'bottom',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  if (!content) return children

  const position =
    placement === 'bottom'
      ? 'top-full mt-2 right-0'
      : placement === 'top'
        ? 'bottom-full mb-2 right-0'
        : 'left-full ml-2 top-1/2 -translate-y-1/2'

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`pointer-events-none absolute z-50 w-max max-w-[16rem] rounded-sm border border-line-strong bg-raised px-2.5 py-1.5 text-2xs leading-relaxed text-ink shadow-sm ${position}`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
