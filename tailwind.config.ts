import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#d4a017",
          600: "#b8860b",
          700: "#92700c",
          800: "#6b5210",
          900: "#3d2e09",
        },
        cinema: {
          950: "#0a0a0f",
          900: "#111118",
          800: "#1a1a24",
          700: "#252530",
          600: "#35354a",
          500: "#4a4a6a",
          400: "#6b6b8a",
          300: "#9090a8",
          200: "#b8b8cc",
          100: "#dcdce8",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        "ticker-scroll": "ticker-scroll 30s linear infinite",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px rgba(212, 160, 23, 0.3), 0 0 20px rgba(212, 160, 23, 0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 16px rgba(212, 160, 23, 0.5), 0 0 40px rgba(212, 160, 23, 0.2)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
