/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        temenos: {
          blue: '#003366',
          lightBlue: '#0066CC',
          accent: '#00A3E0',
        }
      }
    },
  },
  plugins: [],
}

