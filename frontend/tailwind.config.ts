import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable class-based dark mode for ThemeProvider
  theme: {
    extend: {
      // Colors are defined in globals.css via @theme inline for Tailwind 4
      borderRadius: {
        'xl': '20px',
        'button': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-in-right': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-out-right': {
          '0%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-down': {
          '0%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        'pulse-slow': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.6',
          },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-in',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
        'marquee-fast': 'marquee 15s linear infinite',
        'progress': 'progress 5s linear',
        'scale-in': 'scale-in 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [typography],
};

export default config;
