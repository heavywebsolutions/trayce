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
        accent: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF2FF",
          ring: "#6366F1",
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
