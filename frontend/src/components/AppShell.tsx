import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  ClipboardPaste,
  GitCompareArrows,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
  Settings,
  Telescope,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { usePreference } from '@/lib/usePreference'
import { ThemeSelector } from '@/components/ThemeSelector'
import { HealthIndicator } from '@/components/HealthIndicator'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/paste', label: 'Paste analyzer', icon: ClipboardPaste },
  { to: '/kafka', label: 'Kafka browser', icon: Activity },
  { to: '/replay', label: 'Replay', icon: Repeat },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Topbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-surface/80 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
      <NavLink to="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Telescope className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-fg">OTLP Viewer</span>
      </NavLink>
      <div className="ml-auto flex items-center gap-2">
        <HealthIndicator />
        <ThemeSelector />
      </div>
    </header>
  )
}

function LeftBar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        'sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-border/70 bg-surface/40 p-3 transition-[width] duration-200 md:block',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-elevated text-fg' : 'text-muted hover:bg-elevated/60 hover:text-fg',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

function StatusStrip() {
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-surface/40 px-4 py-2 text-[11px] text-muted">
      <span>OTLP Viewer — inspect, validate, decode, replay OpenTelemetry payloads.</span>
      <span className="chip font-mono">v1</span>
    </footer>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = usePreference<boolean>('appShell', 'sidebarCollapsed', false)

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1">
        <LeftBar collapsed={collapsed} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</div>
        </main>
      </div>
      <StatusStrip />
    </div>
  )
}
