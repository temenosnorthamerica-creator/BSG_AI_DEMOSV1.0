/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SECU Brand Colors
        primary: {
          DEFAULT: '#003366',
          dark: '#002244',
          light: '#004488',
        },
        accent: {
          DEFAULT: '#0066CC',
          light: '#3388DD',
        },
        success: {
          DEFAULT: '#28A745',
          light: '#34CE57',
        },
        warning: {
          DEFAULT: '#FFC107',
        },
        error: {
          DEFAULT: '#DC3545',
        },
        orange: {
          DEFAULT: '#f7941d',
          dark: '#e5850f',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Roboto', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-secu': 'linear-gradient(135deg, #003366, #004488)',
        'gradient-offer': 'linear-gradient(135deg, #003366, #0066CC)',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 20px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
      },
    },
  },
  plugins: [],
}
