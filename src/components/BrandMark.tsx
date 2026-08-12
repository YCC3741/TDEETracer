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
      <g data-logo-part="compass">
        <circle
          cx="16"
          cy="16"
          r="12"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16 1.5 17.3 4h-2.6ZM30.5 16 28 17.3v-2.6ZM16 30.5 14.7 28h2.6ZM1.5 16 4 14.7v2.6Z"
          fill="currentColor"
        />
      </g>
      <path
        data-logo-part="route"
        d="M12.8 20.7c2.7-1 1.7-3.8 4.4-6.1l1.6-1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <g data-logo-part="start">
        <circle
          cx="9.5"
          cy="22.2"
          r="4.7"
          fill="var(--surface)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="9.5" cy="22.2" r="2" fill="currentColor" />
      </g>
      <g data-logo-part="goal">
        <path
          d="m21 6.2 4.8 4.8-4.8 4.8-4.8-4.8Z"
          fill="var(--surface)"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path d="m21 8.6 2.4 2.4-2.4 2.4-2.4-2.4Z" fill="currentColor" />
      </g>
    </svg>
  )
}
