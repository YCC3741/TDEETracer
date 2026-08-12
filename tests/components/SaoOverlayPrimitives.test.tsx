import { Dialog } from '@base-ui/react/dialog'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SaoActionButton } from '../../src/components/sao/SaoActionButton'
import { SaoDialogPopup } from '../../src/components/sao/SaoDialogPopup'

describe('SAO overlay primitives', () => {
  it('separates the dialog into header, content, and action bands', () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Viewport>
            <SaoDialogPopup
              eyebrow="System decision"
              title="確認操作"
              description="這是確認內容"
              actions={<SaoActionButton label="確認" tone="primary" />}
            />
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>,
    )

    const dialog = screen.getByRole('dialog', { name: '確認操作' })
    expect(dialog).toHaveClass('sao-glass-popup')
    expect(dialog.querySelector('.sao-glass-head')).toHaveTextContent(
      'System decision',
    )
    const contentBand = dialog.querySelector('.sao-glass-content')
    expect(contentBand).toHaveTextContent('這是確認內容')
    expect(contentBand).toHaveAttribute('data-content-layout', 'description')
    expect(
      within(dialog).getByRole('button', { name: '確認' }),
    ).toHaveAttribute('data-tone', 'primary')
    expect(dialog.querySelector('.sao-glass-actions')).toBeInTheDocument()
  })

  it('expresses action meaning through reusable ring and mark parameters', () => {
    render(
      <>
        <SaoActionButton label="套用" tone="primary" />
        <SaoActionButton label="取消" mark="cancel" tone="cancel" />
        <SaoActionButton label="現在" mark="target" tone="neutral" />
      </>,
    )

    expect(screen.getByRole('button', { name: '套用' })).toHaveAttribute(
      'data-mark',
      'confirm',
    )
    expect(screen.getByRole('button', { name: '取消' })).toHaveAttribute(
      'data-mark',
      'cancel',
    )
    expect(screen.getByRole('button', { name: '現在' })).toHaveAttribute(
      'data-mark',
      'target',
    )
  })
})
