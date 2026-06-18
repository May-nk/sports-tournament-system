/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
  theme: {
    extend: {
      colors: {
        sports: {
          bg: '#07111F',
          card: '#0F1B2E',
          border: '#1B2A41',
          accent: '#F59E0B',
          accentHover: '#D97706',
          text: '#F8FAFC',
          muted: '#94A3B8',
        }
      }
    },
  },
  plugins: [],
}
