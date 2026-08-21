/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#213C51',
          steel: '#6594B1',
          orchid: '#DDAED3',
          light: '#EEEEEE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -4px rgba(33, 60, 81, 0.35)',
      },
    },
  },
  plugins: [],
};
