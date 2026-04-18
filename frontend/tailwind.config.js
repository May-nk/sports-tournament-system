/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0B0F1A',
          card: '#111827',
          border: '#1F2937',
          accent: '#9333ea', // purple-600
          accentHover: '#a855f7', // purple-500
          muted: '#9ca3af', // gray-400
          faint: '#6b7280', // gray-500
        }
      }
    },
  },
  plugins: [],
}
