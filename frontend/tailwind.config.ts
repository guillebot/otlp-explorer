import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1536px' } },
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        panel: 'hsl(var(--panel) / <alpha-value>)',
        elevated: 'hsl(var(--elevated) / <alpha-value>)',
        fg: 'hsl(var(--fg) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-fg': 'hsl(var(--accent-fg) / <alpha-value>)',
        ok: 'hsl(var(--ok) / <alpha-value>)',
        warn: 'hsl(var(--warn) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
        updating: 'hsl(var(--updating) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['InterVariable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 hsl(0 0% 100% / 0.03) inset, 0 1px 2px hsl(0 0% 0% / 0.4)',
        elevated: '0 1px 0 0 hsl(0 0% 100% / 0.05) inset, 0 10px 40px -12px hsl(220 60% 4% / 0.75)',
        glow: '0 0 0 1px hsl(var(--ring) / 0.6), 0 0 20px 2px hsl(var(--ring) / 0.2)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)',
        radial: 'radial-gradient(ellipse at top, hsl(220 60% 18% / 0.6), transparent 60%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--ring) / 0.4)' },
          '50%': { boxShadow: '0 0 0 6px hsl(var(--ring) / 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'flash-ok': { '0%': { backgroundColor: 'hsl(var(--ok) / 0.25)' }, '100%': { backgroundColor: 'transparent' } },
        'flash-info': { '0%': { backgroundColor: 'hsl(var(--info) / 0.25)' }, '100%': { backgroundColor: 'transparent' } },
        'flash-danger': { '0%': { backgroundColor: 'hsl(var(--danger) / 0.25)' }, '100%': { backgroundColor: 'transparent' } },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'slide-in-right': 'slide-in-right 200ms ease-out',
        'flash-ok': 'flash-ok 1.6s ease-out',
        'flash-info': 'flash-info 1.6s ease-out',
        'flash-danger': 'flash-danger 1.6s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config
