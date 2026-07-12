import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#06060E",
        surface: "#0A0A18",
        surfaceHigh: "#0F0F22",
        border: "#1A1A32",
        borderHigh: "#2A2A48",
        accent: "#E8FF00",
        accentDim: "#E8FF0033",
        accentH: "#F5FF55",
        text: "#F0F0FA",
        muted: "#4A4A6A",
        mutedHigh: "#7070A0",
        ok: "#00E87A",
        okDim: "#00E87A22",
        err: "#FF3355",
        errDim: "#FF335522",
        warn: "#FF9900",
        warnDim: "#FF990022",
        info: "#00AAFF",
        infoDim: "#00AAFF22",
        purple: "#9B5CFF",
      },
      fontFamily: {
        mono: ["var(--font-ibm-plex-mono)", "Courier New", "monospace"],
        display: ["var(--font-bebas-neue)", "Impact", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        cursive1: ["var(--font-dancing-script)", "cursive"],
        cursive2: ["var(--font-pacifico)", "cursive"],
        cursive3: ["var(--font-caveat)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
