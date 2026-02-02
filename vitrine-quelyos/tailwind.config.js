/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // UI package via node_modules (résolu par workspace)
    "./node_modules/@quelyos/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
      },
      keyframes: {
        'chatbot-in': {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'msg-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'btn-in': {
          from: { opacity: '0', transform: 'scale(0) rotate(-180deg)' },
          to: { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'badge-in': {
          from: { transform: 'scale(0)' },
          to: { transform: 'scale(1)' },
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0.5' },
        },
        'tooltip-in': {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'chatbot-in': 'chatbot-in 0.25s ease-out',
        'msg-in': 'msg-in 0.2s ease-out both',
        'btn-in': 'btn-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
        'badge-in': 'badge-in 0.2s ease-out',
        'pulse-scale': 'pulse-scale 2s infinite',
        'ping-slow': 'ping-slow 2s infinite',
        'tooltip-in': 'tooltip-in 0.3s ease-out 1s both',
      },
    },
  },
  plugins: [],
};
