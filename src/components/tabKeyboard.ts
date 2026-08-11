import type { KeyboardEvent } from 'react'

export function handleTabListKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  count: number,
  activate: (index: number) => void,
): void {
  let nextIndex: number | null = null
  if (event.key === 'ArrowRight') nextIndex = (index + 1) % count
  if (event.key === 'ArrowLeft') nextIndex = (index - 1 + count) % count
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = count - 1
  if (nextIndex === null) return

  event.preventDefault()
  activate(nextIndex)
  const tabs = event.currentTarget
    .closest('[role="tablist"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  tabs?.[nextIndex]?.focus()
}
