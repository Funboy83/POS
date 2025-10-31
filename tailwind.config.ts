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
        ios: {
          blue: "#007AFF",
          gray: "#F2F2F7",
          white: "#FFFFFF",
          border: "#E5E5EA",
          text: {
            primary: "#000000",
            secondary: "#8E8E93",
          }
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "San Francisco",
          "SF Pro Display",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        ios: "0 2px 10px rgba(0, 0, 0, 0.1)",
        "ios-card": "0 1px 3px rgba(0, 0, 0, 0.1)",
      },
      backdropBlur: {
        ios: "20px",
      },
    },
  },
  plugins: [],
};

export default config;