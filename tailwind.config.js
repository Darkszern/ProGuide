/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Akzentfarbe: kraeftiges Violett/Indigo
        brand: {
          50: '#f1f0fe',
          100: '#e6e3fd',
          200: '#cfcafb',
          300: '#ada3f7',
          400: '#8c7df2',
          500: '#6d5ef6', // Hauptakzent
          600: '#5a47e8',
          700: '#4a37c8',
          800: '#3e30a2',
          900: '#352c80',
        },
        // Sehr helle, neutrale Flaechen
        canvas: '#f7f8fb',
        surface: '#ffffff',
        ink: {
          DEFAULT: '#1f2430',
          soft: '#5b6172',
          muted: '#8b91a1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06)',
        soft: '0 1px 3px rgba(16, 24, 40, 0.06)',
        pop: '0 12px 32px rgba(80, 70, 200, 0.18)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6d5ef6 0%, #4f8bf6 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
