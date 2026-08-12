interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        d="M5 23.5c4.2 0 5.2-6 9.4-6 3.2 0 3.8 2.7 6.8 2.7 2.2 0 3.6-1.4 5.8-4.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <circle
        cx="14.4"
        cy="17.5"
        r="3.1"
        fill="var(--surface)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M22.5 13.6V9.8a3.7 3.7 0 0 1 7.4 0v3.8M21.2 13.6h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}
