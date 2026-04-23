import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Big E — red
    'bg-red-600', 'bg-red-50', 'bg-red-100', 'text-red-600', 'text-red-700',
    'border-red-600', 'border-red-200', 'ring-red-600',
    // AO — teal
    'bg-teal-600', 'bg-teal-50', 'bg-teal-100', 'text-teal-600', 'text-teal-700',
    'border-teal-600', 'border-teal-200', 'ring-teal-600',
    // Sethy Boi — green
    'bg-green-600', 'bg-green-50', 'bg-green-100', 'text-green-600', 'text-green-700',
    'border-green-600', 'border-green-200', 'ring-green-600',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
