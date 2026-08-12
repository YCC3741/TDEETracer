import type { ReactNode } from 'react'

interface SaoGlassBandsProps {
  actions?: ReactNode
  children?: ReactNode
  description?: ReactNode
  descriptionHidden?: boolean
  eyebrow?: ReactNode
  heading: ReactNode
}

export function SaoGlassBands({
  actions,
  children,
  description,
  descriptionHidden = false,
  eyebrow,
  heading,
}: SaoGlassBandsProps) {
  const descriptionOnly = Boolean(
    description && !descriptionHidden && !children,
  )

  return (
    <>
      <header className="sao-glass-head">
        {eyebrow ? <span className="sao-glass-eyebrow">{eyebrow}</span> : null}
        {heading}
      </header>
      <div
        className="sao-glass-content"
        data-content-layout={descriptionOnly ? 'description' : undefined}
      >
        {description ? (
          <div
            className={
              descriptionHidden
                ? 'sao-glass-description sr-only'
                : 'sao-glass-description'
            }
          >
            {description}
          </div>
        ) : null}
        {children}
      </div>
      {actions ? (
        <footer className="sao-glass-actions">{actions}</footer>
      ) : null}
    </>
  )
}
