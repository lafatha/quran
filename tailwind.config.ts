import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F9F9F9",
        foreground: "#000000",
        "flame-orange": "#FF9800",
        "done-green": "#22C55E",
        "card-bg": "#FFFFFF",
        "text-secondary": "#6B7280",
      },
    },
  },
  plugins: [],
};
export default config;
