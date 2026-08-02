import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm parchment neutrals
        parchment: "#F5F0E8",
        ink: "#1C1917",
        // Muted civic accent colors
        "yes-color": "#3B6E52",      // forest green
        "no-color": "#8B3A2A",       // terracotta
        "yes-light": "#EBF3EE",
        "no-light": "#F5EAE7",
        "yes-dark": "#2A5040",
        "no-dark": "#6B2D20",
        // State badge colors
        active: "#A67C52",           // warm amber
        "active-bg": "#FDF6EC",
        "active-dark-bg": "#2A2015",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
