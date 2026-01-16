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
          50: '#fef1f7',
          100: '#fee5f0',
          200: '#ffcce3',
          300: '#ffa3cb',
          400: '#ff69aa',
          500: '#ff3d8b',
          600: '#ef1566',
          700: '#d1074b',
          800: '#ad0a3e',
          900: '#8f0d37',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'product': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'product-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
