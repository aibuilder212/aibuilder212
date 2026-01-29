/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0e14',
          900: '#111827',
          850: '#151b26',
          800: '#1f2937',
          700: '#374151',
        },
        brand: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      boxShadow: {
        card: '0 20px 40px -30px rgba(15, 23, 42, 0.8)',
      },
    },
  },
  plugins: [],
}
