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
          accent: '#00A3E0'
        },
        primary: {
          DEFAULT: '#283054',
          dark: '#1e2438',
          light: '#3a4570'
        },
        surface: {
          light: '#F8FAFC',
          dark: '#0f172a',
          card: {
            light: '#FFFFFF',
            dark: '#1e293b'
          }
        },
        text: {
          primary: {
            light: '#2D3748',
            dark: '#E2E8F0'
          },
          secondary: {
            light: '#4A5568',
            dark: '#9ca3af'
          }
        },
        crm: {
          lead: '#3B82F6',
          opportunity: '#10B981',
          contact: '#8B5CF6',
          account: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    },
  },
  plugins: [],
}
