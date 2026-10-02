/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#fbfce8",
          100: "#f5f8c4",
          200: "#eef28c",
          300: "#e8ee79",
          400: "#e3ec4f",
          500: "#DFE82A",
          600: "#b9c117",
          700: "#8a9012",
          800: "#5f6410",
          900: "#3b3e0c",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          gold: "#D4AF37",
          goldLight: "#F3E5AB",
          rose: "#DFE82A",
          purple: "#7C3AED",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // text-primary vira grafite (limão só como fundo), ver --primary-text em index.css
      textColor: {
        primary: {
          DEFAULT: "hsl(var(--primary-text))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
      fontFamily: {
        sans: ["'Manrope'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
        serif: ["'PT Serif'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
}
