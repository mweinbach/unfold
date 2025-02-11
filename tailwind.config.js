/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f5f7fa',
          100: '#eaeef4',
          500: '#1a365d',
          600: '#0f2a4a',
          700: '#0a1f3f',
        },
        maroon: {
          50: '#fdf2f2',
          100: '#fde8e8',
          500: '#9b2c2c',
          600: '#822727',
          700: '#63171b',
        },
      },
    },
  },
  plugins: [],
};
