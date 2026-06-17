import { useCallback, useEffect, useState } from 'react'

function storageKey(screen: string, name: string) {
  return `pref:${screen}:${name}`
}

function read<T>(screen: string, name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(screen, name))
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Local-only preference hook. The shipped design system reconciles against a
 * server preference store; this app has none, so it persists to localStorage
 * synchronously (no first-paint flicker) and never round-trips.
 */
export function usePreference<T>(
  screen: string,
  name: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => read(screen, name, defaultValue))

  const set = useCallback(
    (next: T) => {
      setValue(next)
      try {
        localStorage.setItem(storageKey(screen, name), JSON.stringify(next))
      } catch {
        /* ignore quota / unavailable storage */
      }
    },
    [screen, name],
  )

  return [value, set]
}

export type Theme = 'dark' | 'light'

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = usePreference<Theme>('appShell', 'theme', 'dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  return [theme, setTheme]
}
