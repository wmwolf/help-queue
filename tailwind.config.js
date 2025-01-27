/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#06233D',
        'brand-royal': '#232C99',
        'brand-bright-blue': '#0160F2',
        'brand-sky': '#26B1ED',
        'brand-gold': '#EDAC1A',
        'brand-old-gold': '#B28114',
        'brand-earth': '#725E49',
        'brand-warm-gray': '#DBD8D1'
      },
      fontFamily: {
        'display': ['grad', 'serf'],
        'body': ['neue-haas-grotesk-text', 'sans-serif'],
        'heading': ['vinila-extended', 'serif']
      }
    },
  },
  plugins: [],
}