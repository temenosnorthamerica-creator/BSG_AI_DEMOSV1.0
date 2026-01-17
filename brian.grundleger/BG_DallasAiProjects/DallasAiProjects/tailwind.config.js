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
        },
        primary: {
          DEFAULT: '#283054',
          dark: '#1e2438',
          light: '#0066CC',
        },
        sidebar: {
          bg: '#283054',
          hover: '#1e2438',
        }
      }
    },
  },
  plugins: [],
}
