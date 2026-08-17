/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F17",
        surface: "#111827",
        card: "#1F2937",
        cardhover: "#374151",
        accent: "#6366F1",
        accenthover: "#4F46E5",
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(99,102,241,0.5)",
      },
    },
  },
  plugins: [],
}
