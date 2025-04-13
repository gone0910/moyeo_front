/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx}', './components/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
