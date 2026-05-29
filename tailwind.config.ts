import type { Config } from "tailwindcss";

/**
 * ReelKaro design tokens — premium, vibrant-but-trustworthy, festive Indian accents.
 * Tweak these to re-theme the whole product (per plan A5.1: flexible/themeable).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f0",
          100: "#ffe0dc",
          200: "#ffc2ba",
          300: "#ff9a8c",
          400: "#ff6b54",
          500: "#f4452a", // primary — confident festive saffron-red
          600: "#e02f17",
          700: "#bb2210",
          800: "#9a2013",
          900: "#7f2016",
        },
        gold: {
          400: "#ffcb45",
          500: "#f5b316",
        },
        ink: {
          DEFAULT: "#15110f",
          soft: "#3d3530",
          muted: "#6b615a",
        },
        cream: "#fffaf5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 8px 30px -8px rgba(244, 69, 42, 0.18)",
        card: "0 12px 40px -12px rgba(21, 17, 15, 0.18)",
        glow: "0 0 0 1px rgba(244,69,42,0.1), 0 20px 60px -20px rgba(244,69,42,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 6s ease-in-out infinite",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(1200px 600px at 50% -10%, rgba(244,69,42,0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
