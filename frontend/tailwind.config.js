/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // YouTube Kids 风格配色
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        'accent-dark': '#FFA94D',
      },
    },
  },
  plugins: [],
}
