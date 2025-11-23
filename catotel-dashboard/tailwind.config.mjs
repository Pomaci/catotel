/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FDF8F2",
          100: "#FBF3EA",
          200: "#F4E5D4",
        },
        clay: {
          200: "#EBDCCD",
          300: "#DCC7B2",
        },
        lagoon: {
          100: "#E1F4F2",
          300: "#B4E3DD",
          400: "#7FDAD0",
          500: "#4BB1A1",
          600: "#2F8B7E",
        },
        cocoa: {
          600: "#4B3C32",
          700: "#2F251F",
        },
        blush: {
          200: "#FFE1D4",
          300: "#FFC7B2",
        },
        peach: {
          50: "#FFF5ED",
          100: "#FFE1CC",
          200: "#FFC8A2",
          300: "#FFB673",
          400: "#FF9A45",
          500: "#FF7F1F",
        },
      },
      fontFamily: {
        sans: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 25px 60px -20px rgba(31, 42, 55, 0.25)",
        glow: "0 20px 70px -35px rgba(75, 177, 161, 0.8)",
      },
      container: {
        center: true,
        padding: "1.5rem",
      },
    },
  },
  plugins: [],
};
