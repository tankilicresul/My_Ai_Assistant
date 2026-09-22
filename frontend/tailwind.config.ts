import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "#ff6b00",
          foreground: "#ffffff",
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        tancore: {
          orange: "#ff6b00",
          amber: "#ffa000",
          darkOrange: "#ff4800",
          lightPeach: "#fff8f2",
          borderPeach: "#ffe2cc",
          lightYellow: "#fffdf0",
          borderYellow: "#fff3b8",
          lightMint: "#f0fdf8",
          borderMint: "#ccfbf1",
        },
        accent: {
          DEFAULT: "#f97316",
          pink: "#f43f5e",
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
