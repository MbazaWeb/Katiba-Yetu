/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './expo-entry.js',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Tanzania national palette
        green: {
          50:  '#E8F5EE',
          100: '#C6E6D4',
          200: '#8FCFAA',
          300: '#52B47F',
          400: '#1F9456',
          500: '#0D7A3F',
          600: '#0A6233',
          700: '#074A27',
          800: '#04321A',
          900: '#021A0D',
        },
        gold: {
          50:  '#FDF8E7',
          100: '#FAF0C5',
          200: '#F4DC80',
          300: '#ECC63C',
          400: '#D4A80A',
          500: '#B08D07',
          600: '#8C7005',
          700: '#685304',
          800: '#443602',
          900: '#221B01',
        },
        blue: {
          50:  '#E6F0FB',
          100: '#C2D9F6',
          200: '#85B3EC',
          300: '#4A8EE0',
          400: '#1A6DCF',
          500: '#1457A8',
          600: '#0F4284',
          700: '#0A2E60',
          800: '#061B3C',
          900: '#030D1E',
        },
        surface: {
          base:    '#0A0A0A',
          raised:  '#141414',
          overlay: '#1C1C1C',
          border:  '#2A2A2A',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans:  ['System'],
        mono:  ['Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};
