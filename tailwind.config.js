/***** Tailwind config with maroon/gold theme and dark mode *****/
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Leo District 306 D7 Brand Colors
        petal: { // #F7B1C8
          DEFAULT: '#F7B1C8'
        },
        rose: { // #702C91
          DEFAULT: '#702C91'
        },
        fuchsia: { // #702C91
          DEFAULT: '#702C91'
        },
        crimson: { // #702C91
          DEFAULT: '#702C91'
        },
        burgundy: { // #710F38
          DEFAULT: '#710F38'
        },
        maroon: { // #710F38 (alias for burgundy)
          DEFAULT: '#710F38',
          700: '#5a0c2d'
        },
        sand: { // #F7EAC1
          DEFAULT: '#F7EAC1'
        },
        gold: { // #E1AD36
          DEFAULT: '#E1AD36'
        },
        amberD7: { // #E1AD36 (alias for gold)
          DEFAULT: '#E1AD36'
        },
        bronze: { // #B2722A
          DEFAULT: '#B2722A'
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
      }
    }
  },
  plugins: []
};