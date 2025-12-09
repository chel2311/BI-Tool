/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0f7',
          100: '#cce1ef',
          200: '#99c3df',
          300: '#66a5cf',
          400: '#3387bf',
          500: '#005BAB',
          600: '#004989',
          700: '#003767',
          800: '#002444',
          900: '#001222',
        },
        accent: {
          50: '#fff5eb',
          100: '#ffebd6',
          200: '#ffd7ad',
          300: '#ffc385',
          400: '#ffaf5c',
          500: '#FF961C',
          600: '#cc7816',
          700: '#995a11',
          800: '#663c0b',
          900: '#331e06',
        }
      },
      fontFamily: {
        sans: ['Meiryo', 'メイリオ', 'Hiragino Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
