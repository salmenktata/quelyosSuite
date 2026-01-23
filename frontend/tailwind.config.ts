import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#01613a',
          dark: '#004d2e',
          light: '#028a52',
        },
        secondary: {
          DEFAULT: '#c9c18f',
          dark: '#b4ac7a',
          light: '#ddd5a4',
        },
        accent: {
          red: '#dc2626',
          gold: '#f59e0b',
        },
      },
      borderRadius: {
        'xl': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
