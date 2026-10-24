/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#07111a",
          2: "#0c1b27",
          3: "#102533",
        },
        mint: {
          DEFAULT: "#2ee6a6",
          dim: "#18c48c",
        },
        coral: "#ff7a45",
        warn: "#f5c14a",
        sky: "#4cc3ff",
        fog: "#8aa3b3",
        cream: "#eaf4f8",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Syne", "Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 24px 60px rgba(0,0,0,0.35)",
        mint: "0 10px 24px rgba(46,230,166,0.28)",
      },
    },
  },
  plugins: [],
};
