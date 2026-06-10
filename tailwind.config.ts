import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        outside: {
          50: "#F8F0EB",
          100: "#EDDED4",
          200: "#DCC2B0",
          300: "#CAA088",
          400: "#BA8465",
          500: "#B07654",
          600: "#9A6243",
          700: "#7D4E35",
          800: "#633C29",
          900: "#4A2C1E",
          950: "#2B1810",
        },
        accent: {
          DEFAULT: "#C4A35A",
          50: "#FAF5EB",
          100: "#F2E6C8",
          200: "#E8D39A",
          300: "#DBBC6E",
          400: "#CFA94B",
          500: "#C4A35A",
          600: "#A88845",
          700: "#8A6E36",
          800: "#6D5529",
          900: "#4F3D1E",
        },
        neon: {
          rust: "#B07654",
          ochre: "#C4A35A",
          glow: "#B07654",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#0A0A0F",
          card: "#12121A",
          border: "#1E1E2D",
          muted: "#8A8A9A",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backgroundImage: {
        "gradient-outside": "linear-gradient(135deg, #B07654 0%, #C4A35A 100%)",
        "gradient-outside-dark": "linear-gradient(135deg, #7D4E35 0%, #A88845 100%)",
        "gradient-hero": "linear-gradient(180deg, #F8F0EB 0%, #FFFFFF 100%)",
        "gradient-hero-dark": "linear-gradient(180deg, #1A1410 0%, #0A0A0F 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(176, 118, 84, 0.3)",
        "glow-accent": "0 0 20px rgba(196, 163, 90, 0.3)",
        "glow-lg": "0 0 40px rgba(176, 118, 84, 0.4)",
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.12)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%": { boxShadow: "0 0 20px rgba(176, 118, 84, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(196, 163, 90, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
