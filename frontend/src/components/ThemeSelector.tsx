import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTheme, type Theme } from '@/lib/usePreference'

const options: Array<{ value: Theme; label: string; icon: typeof Moon }> = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Clear', icon: Sun },
]

export function ThemeSelector() {
  const [theme, setTheme] = useTheme()
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface/70 p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
            theme === value ? 'bg-elevated text-fg shadow-panel' : 'text-muted hover:text-fg',
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  )
}
