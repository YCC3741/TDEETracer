import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LayeredBranchBar } from '../../src/components/layered/LayeredBranchBar'
import { LayeredCircleNode } from '../../src/components/layered/LayeredCircleNode'
import { LayeredStatusNode } from '../../src/components/layered/LayeredStatusNode'

describe('layered shape primitives', () => {
  it('uses one status-node geometry with state expressed as data', () => {
    const { container } = render(<LayeredStatusNode state="active" />)
    const node = container.querySelector('.layered-status-node')

    expect(node).toHaveAttribute('data-state', 'active')
    expect(node).toHaveAttribute('aria-hidden', 'true')
    expect(
      container.querySelector('.layered-status-node-body'),
    ).toBeInTheDocument()
  })

  it('separates circle geometry from its size and tone parameters', () => {
    const { container } = render(
      <LayeredCircleNode
        hiddenFromAssistiveTechnology
        size="large"
        tone="active"
      >
        節點
      </LayeredCircleNode>,
    )
    const node = container.querySelector('.layered-circle-node')

    expect(node).toHaveAttribute('data-size', 'large')
    expect(node).toHaveAttribute('data-tone', 'active')
    expect(node).toHaveAttribute('aria-hidden', 'true')
    expect(
      container.querySelector('.layered-circle-node-body'),
    ).toHaveTextContent('節點')
  })

  it('expresses the connector direction without changing branch content', () => {
    render(
      <>
        <LayeredBranchBar connector="left" hiddenFromAssistiveTechnology>
          左側分支
        </LayeredBranchBar>
        <LayeredBranchBar as="span" connector="right">
          右側分支
        </LayeredBranchBar>
      </>,
    )

    expect(screen.getByText('左側分支')).toHaveAttribute(
      'data-connector',
      'left',
    )
    expect(screen.getByText('左側分支')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('右側分支')).toHaveAttribute(
      'data-connector',
      'right',
    )
  })
})
