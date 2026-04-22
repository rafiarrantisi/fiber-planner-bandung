import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          soft: '#1f2937',
          muted: '#4b5563',
          subtle: '#6b7280',
        },
        paper: {
          DEFAULT: '#fafaf7',
          card: '#ffffff',
          sunken: '#f3f3ee',
        },
        line: {
          DEFAULT: '#e5e5e0',
          strong: '#d4d4cf',
        },
        brand: {
          DEFAULT: '#1d4ed8',
          soft: '#dbeafe',
        },
        signal: {
          fo: '#059669',
          nonfo: '#dc2626',
          fiber: '#f97316',
          supply: '#7c3aed',
          buffer: '#3b82f6',
        },
      },
      boxShadow: {
        editorial: '0 1px 2px rgba(10,10,10,0.04), 0 4px 12px rgba(10,10,10,0.04)',
        floatCard: '0 6px 24px rgba(10,10,10,0.08)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [animate],
}
