import type { Config } from 'tailwindcss'

export default {
  darkMode: ['selector', '[data-mode="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {},
  plugins: []
} satisfies Config
