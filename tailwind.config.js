/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd1ff",
          300: "#8db1ff",
          400: "#5a89ff",
          500: "#3763f4",
          600: "#2545e0",
          700: "#1e37c4",
          800: "#1e319e",
          900: "#1e2f7d",
          950: "#141f5c",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(16,24,40,0.08), 0 1px 2px -1px rgba(16,24,40,0.08)",
        cardDark: "0 1px 3px 0 rgba(0,0,0,0.37), 0 1px 2px -1px rgba(0,0,0,0.37)",
      },
    },
  },
  plugins: [],
}

