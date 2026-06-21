/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf9f1',
          100: '#f5f0db',
          200: '#eadab4',
          300: '#dfbe83',
          400: '#d5a156',
          500: '#cd8736',
          600: '#bf702a',
          700: '#9f5624',
          800: '#834524',
          900: '#693820',
          950: '#3c1d0e',
        },
      },
    },
  },
  plugins: [],
}
