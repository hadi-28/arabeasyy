import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        emerald: {
          25: "#f7fcf9",
          50: "#edf8f1",
          100: "#d9f0e2",
          500: "#0c9468",
          600: "#087f5b",
          700: "#06664a",
          800: "#064f3b",
          900: "#063d2f"
        },
        cream: "#faf7ef",
        ink: "#183128"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
        arabic: ["var(--font-amiri)", "serif"]
      },
      boxShadow: {
        soft: "0 12px 35px rgba(14, 55, 39, 0.07)"
      }
    }
  },
  plugins: []
};
export default config;
