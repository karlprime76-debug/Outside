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
          50: "#FFF5F0",
          100: "#FFE8DB",
          200: "#FFD0B8",
          300: "#FFAD85",
          400: "#FF8552",
          500: "#FF6B35",
          600: "#F05A28",
          700: "#D44A1E",
          800: "#B33D18",
          900: "#8C2F12",
          950: "#4A1809",
        },
        accent: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        neon: {
          orange: "#FF6B35",
          amber: "#F59E0B",
          glow: "#FF6B35",
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
        "gradient-outside": "linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)",
        "gradient-outside-dark": "linear-gradient(135deg, #FF9500 0%, #F59E0B 100%)",
        "gradient-hero": "linear-gradient(180deg, #FFF5F0 0%, #FFFFFF 100%)",
        "gradient-hero-dark": "linear-gradient(180deg, #1A0A10 0%, #0A0A0F 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 107, 53, 0.3)",
        "glow-accent": "0 0 20px rgba(245, 158, 11, 0.3)",
        "glow-lg": "0 0 40px rgba(255, 107, 53, 0.4)",
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
          "0%": { boxShadow: "0 0 20px rgba(255, 107, 53, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(245, 158, 11, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
