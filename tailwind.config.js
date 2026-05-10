/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        base: {
          bg: "#F5F3EF",
          card: "#EDEAE4",
          text: "#6B6560",
          muted: "#A89F95",
          accent: "#C4A882",
          border: "#D9D4CC",
          hover: "#E0DBD3",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "pulse-ring-delay": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) 0.4s infinite",
        "pulse-ring-delay2": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) 0.8s infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "wave-bar": "wave-bar 0.8s ease-in-out infinite alternate",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "wave-bar": {
          "0%": { height: "4px" },
          "100%": { height: "24px" },
        },
      },
    },
  },
  plugins: [],
};
