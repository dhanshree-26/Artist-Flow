import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../context/useTheme'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <MoonStar size={17} /> : <SunMedium size={17} />}
      <span>{theme === 'light' ? 'Dark' : 'Light'} mode</span>
    </button>
  )
}
