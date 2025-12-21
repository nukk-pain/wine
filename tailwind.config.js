/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          // Background gradients
          dark: '#1a0a0a',
          deep: '#2d1215',
          midnight: '#0a0506',

          // Accent colors
          gold: '#c9a050',
          goldDark: '#a68340',
          red: '#722f37',

          // Text colors
          cream: '#f5f0e6',
          creamDim: '#d4cfc5',
          creamDark: '#a39d92',

          // Glass effects
          glass: 'rgba(255, 255, 255, 0.05)',
          glassBorder: 'rgba(201, 160, 80, 0.2)',
          glassHover: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        wine: '0 10px 40px -10px rgba(114, 47, 55, 0.3)',
        'wine-lg': '0 20px 60px -15px rgba(114, 47, 55, 0.5)',
        'wine-selected': '0 0 0 2px rgba(201, 160, 80, 0.5), 0 10px 40px -10px rgba(201, 160, 80, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}