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
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        accent: {
          DEFAULT: "#F43F5E",
          50: "#FFF1F2",
          100: "#FFE4E6",
          200: "#FECDD3",
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
          950: "#4C0519",
        },
        neon: {
          orange: "#F97316",
          rose: "#F43F5E",
          pink: "#D946EF",
          magenta: "#A855F7",
          glow: "#F97316",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#08080C",
          card: "#101016",
          border: "#181822",
          muted: "#8B8B9E",
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
        "gradient-outside": "linear-gradient(135deg, #F97316 0%, #D946EF 30%, #A855F7 100%)",
        "gradient-primary": "linear-gradient(135deg, #F97316 0%, #F43F5E 100%)",
        "gradient-pink": "linear-gradient(135deg, #F43F5E 0%, #D946EF 100%)",
        "gradient-magenta": "linear-gradient(135deg, #D946EF 0%, #A855F7 100%)",
        "gradient-amber": "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
        "gradient-rose": "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
        "gradient-violet": "linear-gradient(135deg, #A855F7 0%, #8B5CF6 100%)",
        "gradient-card": "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
        "gradient-premium": "linear-gradient(135deg, rgba(249,115,22,0.04) 0%, rgba(244,63,94,0.03) 50%, rgba(139,92,246,0.04) 100%)",
        "gradient-hero": "linear-gradient(180deg, #F97316 0%, #A855F7 100%)",
        "gradient-hero-dark": "linear-gradient(180deg, #1A0A00 0%, #08080C 100%)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(249, 115, 22, 0.25)",
        "glow-accent": "0 0 24px rgba(244, 63, 94, 0.25)",
        "glow-lg": "0 0 40px rgba(249, 115, 22, 0.3)",
        "glow-pink": "0 0 24px rgba(217, 70, 239, 0.25)",
        "glow-magenta": "0 0 24px rgba(168, 85, 247, 0.25)",
        "glow-violet": "0 0 24px rgba(139, 92, 246, 0.25)",
        "glow-xl": "0 0 60px rgba(249, 115, 22, 0.2), 0 0 120px rgba(244, 63, 94, 0.1)",
        "card": "0 0 0 1px rgba(255, 255, 255, 0.03), 0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 0 0 1px rgba(249, 115, 22, 0.25), 0 4px 12px rgba(0, 0, 0, 0.2), 0 24px 48px rgba(0, 0, 0, 0.4)",
        "neon": "0 0 4px rgba(249, 115, 22, 0.25), 0 0 20px rgba(249, 115, 22, 0.1)",
        "elevated": "0 0 0 1px rgba(255, 255, 255, 0.04), 0 4px 8px rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite alternate",
        "neon-pulse": "neonPulse 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fadeIn 0.45s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "shimmer-slow": "shimmer 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%": { boxShadow: "0 0 24px rgba(249, 115, 22, 0.2)" },
          "100%": { boxShadow: "0 0 48px rgba(244, 63, 94, 0.3)" },
        },
        neonPulse: {
          "0%": { boxShadow: "0 0 4px rgba(249, 115, 22, 0.25), 0 0 20px rgba(249, 115, 22, 0.1)" },
          "100%": { boxShadow: "0 0 6px rgba(244, 63, 94, 0.35), 0 0 30px rgba(244, 63, 94, 0.15)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
