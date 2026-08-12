import { useTheme } from '../features/theme/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="夜間模式"
      aria-pressed={isDark}
      title={isDark ? '切換至白天模式' : '切換至夜晚模式'}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-stars">
          <i />
          <i />
          <i />
        </span>
        <span className="theme-toggle-clouds">
          <i />
          <i />
        </span>
        <span className="theme-toggle-orb">
          <span className="theme-toggle-sun-rays" />
          <span className="theme-toggle-moon-craters">
            <i />
            <i />
            <i />
          </span>
        </span>
      </span>
    </button>
  )
}
