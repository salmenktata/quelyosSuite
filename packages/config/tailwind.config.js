/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        // Shared color palette
        brand: {
          primary: "#6366f1", // indigo-500
          secondary: "#8b5cf6", // violet-500
        },
      },
    },
  },
  plugins: [],
};
