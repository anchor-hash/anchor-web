import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0a1628',
        teal: '#4ecdc4',
        'heading': '#e8f4f8',
        'body': '#9ec8dc',
        'muted': '#5a8ea8',
        'navy-light': '#0e1f3d',
        'navy-card': '#0d1e38',
        'navy-border': '#1a3050',
      },
      fontFamily: {
        lora: ['var(--font-lora)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'radial-teal': 'radial-gradient(ellipse at center, rgba(78,205,196,0.15) 0%, transparent 70%)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulse_slow: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
