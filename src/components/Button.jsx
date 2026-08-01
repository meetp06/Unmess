const VARIANTS = {
  primary:
    'bg-ink text-base border-ink hover:bg-white disabled:bg-raised disabled:text-ink-faint disabled:border-line',
  secondary:
    'bg-raised text-ink border-line-strong hover:bg-hover disabled:text-ink-faint disabled:hover:bg-raised',
  ghost:
    'bg-transparent text-ink-dim border-transparent hover:bg-raised hover:text-ink disabled:text-ink-faint',
  danger:
    'bg-bad-soft text-bad border-bad/40 hover:bg-bad/20 disabled:text-ink-faint',
}

const SIZES = {
  sm: 'h-7 px-2.5 text-2xs',
  md: 'h-8 px-3 text-xs',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border font-medium transition-colors',
        SIZES[size],
        VARIANTS[variant],
        // Without this, a disabled button swallows the hover events its own
        // tooltip needs in order to explain why it is disabled.
        disabled ? 'pointer-events-none cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
