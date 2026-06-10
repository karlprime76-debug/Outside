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
          50: "#FFF8F0",
          100: "#FFEED9",
          200: "#FFD9A6",
          300: "#FFBE66",
          400: "#FFA333",
          500: "#FF8A00",
          600: "#E07A00",
          700: "#B86300",
          800: "#8F4C00",
          900: "#663600",
          950: "#3D1F00",
        },
        accent: {
          DEFAULT: "#FF5A5F",
          50: "#FFF0F0",
          100: "#FFD9DB",
          200: "#FFB3B7",
          300: "#FF8A90",
          400: "#FF6B71",
          500: "#FF5A5F",
          600: "#E04A4F",
          700: "#B83A3E",
          800: "#8F2B2E",
          900: "#661C1E",
        },
        neon: {
          orange: "#FF8A00",
          rose: "#FF5A5F",
          pink: "#FF2FA3",
          magenta: "#FF0DAE",
          glow: "#FF8A00",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#0B0B0D",
          card: "#111114",
          border: "#1C1C21",
          muted: "#A1A1AA",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-outside": "linear-gradient(135deg, #FF8A00 0%, #FF2FA3 50%, #FF0DAE 100%)",
        "gradient-primary": "linear-gradient(135deg, #FF8A00 0%, #FF5A5F 100%)",
        "gradient-pink": "linear-gradient(135deg, #FF5A5F 0%, #FF2FA3 100%)",
        "gradient-magenta": "linear-gradient(135deg, #FF2FA3 0%, #FF0DAE 100%)",
        "gradient-card": "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
        "gradient-hero": "linear-gradient(180deg, #FF8A00 0%, #FF0DAE 100%)",
        "gradient-hero-dark": "linear-gradient(180deg, #1A0A00 0%, #0B0B0D 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 138, 0, 0.3)",
        "glow-accent": "0 0 20px rgba(255, 90, 95, 0.3)",
        "glow-lg": "0 0 40px rgba(255, 138, 0, 0.4)",
        "glow-pink": "0 0 20px rgba(255, 47, 163, 0.3)",
        "glow-magenta": "0 0 20px rgba(255, 13, 174, 0.3)",
        "glow-xl": "0 0 60px rgba(255, 138, 0, 0.25), 0 0 120px rgba(255, 47, 163, 0.15)",
        "card": "0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.4)",
        "neon": "0 0 4px rgba(255, 138, 0, 0.3), 0 0 20px rgba(255, 138, 0, 0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        "neon-pulse": "neonPulse 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%": { boxShadow: "0 0 20px rgba(255, 138, 0, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(255, 47, 163, 0.4)" },
        },
        neonPulse: {
          "0%": { boxShadow: "0 0 4px rgba(255, 138, 0, 0.3), 0 0 20px rgba(255, 138, 0, 0.15)" },
          "100%": { boxShadow: "0 0 6px rgba(255, 47, 163, 0.4), 0 0 30px rgba(255, 47, 163, 0.2)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
