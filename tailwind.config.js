/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        purdueGold: "#CEB888",
        purdueBlack: "#000000",
      },
    },
  },
  plugins: [],
};
