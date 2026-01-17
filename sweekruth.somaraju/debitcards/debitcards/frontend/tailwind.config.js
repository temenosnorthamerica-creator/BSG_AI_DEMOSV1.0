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
        primary: {
          DEFAULT: '#283054',
          light: '#0066CC',
          accent: '#00A3E0',
        },
        banking: {
          blue: '#003366',
          lightBlue: '#0066CC',
          accent: '#00A3E0',
        }
      },
    },
  },
  plugins: [],
}
