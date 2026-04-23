/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        secondary: '#8b5cf6',
        background: {
          dark: '#0f172a',
          card: '#1e293b',
          input: '#334155',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
        },
        border: '#475569',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        thinking: '#06b6d4',
      }
    },
  },
  plugins: [],
}
