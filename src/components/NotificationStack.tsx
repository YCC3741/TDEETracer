import { useEffect } from 'react'
import { useAppData } from '../app/AppDataContext'
import type { AppNotification } from '../domain/types'

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: AppNotification
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(notification.id), 10_000)
    return () => window.clearTimeout(timer)
  }, [notification.id, onDismiss])

  return (
    <button
      className={`toast ${notification.type}`}
      type="button"
      onClick={() => onDismiss(notification.id)}
    >
      <span>{notification.text}</span>
      <span aria-hidden="true">×</span>
    </button>
  )
}

export function NotificationStack() {
  const { notifications, dismissNotification } = useAppData()
  return (
    <aside className="notification-stack" aria-live="polite">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </aside>
  )
}
