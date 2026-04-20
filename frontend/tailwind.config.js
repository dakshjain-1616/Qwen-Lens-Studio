/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#060913',
          900: '#0b1020',
          800: '#111831',
        },
      },
      animation: {
        'aurora-1': 'aurora1 18s ease-in-out infinite',
        'aurora-2': 'aurora2 22s ease-in-out infinite',
        'aurora-3': 'aurora3 26s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        aurora1: {
          '0%,100%': { transform: 'translate(-10%, -10%) scale(1)' },
          '50%': { transform: 'translate(20%, 10%) scale(1.2)' },
        },
        aurora2: {
          '0%,100%': { transform: 'translate(10%, 20%) scale(1.1)' },
          '50%': { transform: 'translate(-20%, -10%) scale(1)' },
        },
        aurora3: {
          '0%,100%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%': { transform: 'translate(15%, -15%) scale(1.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
