/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'turquoise': '#009b9b',
        'reddarky': '#8B0000',
        'golden': '#FFD700',
        'deepblue': '#00008B',
      },
    },
  },
  darkMode: "class" // or 'media' or 'class'
  
}
