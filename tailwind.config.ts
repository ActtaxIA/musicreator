import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Habilita el modo oscuro con clase 'dark'
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        'music-bar': {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
      },
      animation: {
        'music-bar': 'music-bar 0.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
