import type { Config } from "tailwindcss";

/**
 * ReelKaro design system — premium, dark-first, with a saffron→pink→violet
 * aurora. Tweak tokens here to re-theme the whole product.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Deep plum-black canvas
        base: "#080510",
        surface: "#0f0a1a",
        surface2: "#161021",
        line: "rgba(255,255,255,0.08)",
        brand: {
          50: "#fff1f0",
          100: "#ffe0dc",
          200: "#ffc2ba",
          300: "#ff9a8c",
          400: "#ff6b54",
          500: "#f4452a",
          600: "#e02f17",
          700: "#bb2210",
          800: "#9a2013",
          900: "#7f2016",
        },
        pink: { 400: "#ff5fa2", 500: "#ff2d83", 600: "#e01f6e" },
        violet: { 400: "#a368f0", 500: "#8b3df0", 600: "#7320d6" },
        gold: { 400: "#ffcb45", 500: "#f5b316" },
        cream: "#fff8f1",
        ink: { DEFAULT: "#0d0a12", soft: "#3d3530", muted: "#8b8194" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem", "3xl": "2rem", "4xl": "2.5rem" },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(244,69,42,0.25)",
        card: "0 24px 70px -28px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -24px rgba(244,69,42,0.55)",
        "glow-pink": "0 24px 90px -24px rgba(255,45,131,0.55)",
        "glow-violet": "0 24px 90px -24px rgba(139,61,240,0.55)",
        inner: "inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        aurora: {
          "0%,100%": { transform: "translate(0,0) scale(1)", opacity: "0.9" },
          "33%": { transform: "translate(6%,-8%) scale(1.15)", opacity: "1" },
          "66%": { transform: "translate(-6%,6%) scale(1.05)", opacity: "0.8" },
        },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        "float-slow": { "0%,100%": { transform: "translateY(0) rotate(-6deg)" }, "50%": { transform: "translateY(-18px) rotate(-6deg)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        gradient: { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(244,69,42,0.45)" },
          "50%": { boxShadow: "0 0 0 16px rgba(244,69,42,0)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        aurora: "aurora 18s ease-in-out infinite",
        marquee: "marquee 36s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        gradient: "gradient 6s ease infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
