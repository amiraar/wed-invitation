import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // rgb(... / <alpha-value>) lets opacity modifiers work; plain var() colors silently produce no CSS.
        bg: {
          primary: 'rgb(var(--bg-primary-rgb) / <alpha-value>)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)'
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)'
        },
        border: 'var(--border)',
        hero: {
          bg: 'var(--hero-bg)',
          text: 'rgb(var(--hero-text-rgb) / <alpha-value>)'
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      }
    }
  },
  plugins: []
};

export default config;
