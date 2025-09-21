/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
         'purdue-gold': '#CFB991',
        // You could also add Purdue Black for convenience
        'purdue-black': '#000000',
        'purdue-clay': '#DDB945',
      },
      fontFamily: {
        sans: ['acumin-pro', 'sans-serif'],
      },
    },
  },
  plugins: [

  ],
}
