import type { Config } from "tailwindcss";

// Stripe-light design system — locked with the board (Draplin: restraint; Friedman: standards).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ink scale — Stripe-inspired blue-tinted neutrals
        ink: {
          900: "#0A2540",
          800: "#16324F",
          700: "#1F3A5F",
          600: "#425466",
          500: "#5B6B7B",
          400: "#8792A2",
          300: "#AEB8C4",
          200: "#E3E8EE",
          100: "#EFF2F6",
          50: "#F6F9FC",
        },
        // Brand accent = the Traxxr logo blue (#2587DE) and its shades.
        accent: {
          DEFAULT: "#2587DE",
          hover: "#1C6FBE",
          soft: "#E9F2FC",
          ring: "#62A8E8",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,37,64,0.04), 0 4px 12px rgba(10,37,64,0.06)",
        cardHover: "0 2px 4px rgba(10,37,64,0.06), 0 8px 24px rgba(10,37,64,0.10)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
