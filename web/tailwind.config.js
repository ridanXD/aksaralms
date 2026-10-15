module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Aksara Professional Red Palette
        brand: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626", // Primary Red
          700: "#B91C1C", // Dark Red
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
        },
        // Neutral Zinc Palette
        zinc: {
          50: "#FAFAFA",  // Background
          100: "#F4F4F5", // Light subtle background
          200: "#E4E4E7", // Border
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A", // Muted text
          600: "#52525B", // Secondary text
          700: "#3F3F46",
          800: "#27272A", // Primary text
          900: "#18181B", // Deep neutral
          950: "#09090B",
        },
        slate: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#09090B",
        },
        emerald: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#22C55E",
          600: "#16A34A", // Success
          700: "#15803D",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          500: "#F59E0B",
          600: "#D97706", // Warning
          700: "#B45309",
        },
        rose: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626", // Error / Critical
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        heading: ["var(--font-poppins)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        jakarta: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      boxShadow: {
        "2xs": "0 1px 1px 0 rgb(0 0 0 / 0.03)",
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "sm": "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "card": "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 18px 30px -6px rgba(0, 0, 0, 0.09), 0 10px 12px -6px rgba(0, 0, 0, 0.05)",
        "down": "0 12px 28px -4px rgba(0, 0, 0, 0.08), 0 6px 12px -4px rgba(0, 0, 0, 0.04)",
        "down-lg": "0 20px 35px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
        "brand-down": "0 10px 20px -3px rgba(220, 38, 38, 0.28)",
        "none": "none",
      },
      borderRadius: {
        "sm": "4px",
        "DEFAULT": "6px",
        "md": "8px",
        "lg": "8px",
        "xl": "10px",
        "2xl": "12px",
      },
    },
  },
  plugins: [],
}
