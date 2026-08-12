import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from '../../src/components/BrandMark'

describe('BrandMark', () => {
  it('renders the monochrome compass journey geometry', () => {
    const { container } = render(<BrandMark className="test-mark" />)
    const mark = container.querySelector('svg')

    expect(mark).toHaveClass('test-mark')
    expect(mark).toHaveAttribute('viewBox', '0 0 32 32')
    expect(
      mark?.querySelector('[data-logo-part="compass"]'),
    ).toBeInTheDocument()
    expect(mark?.querySelector('[data-logo-part="start"]')).toBeInTheDocument()
    expect(mark?.querySelector('[data-logo-part="route"]')).toBeInTheDocument()
    expect(mark?.querySelector('[data-logo-part="goal"]')).toBeInTheDocument()
  })
})
