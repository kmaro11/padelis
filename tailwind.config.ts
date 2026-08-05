import type { Config } from "tailwindcss";

/**
 * Design tokens from the Padel Tournament App handoff.
 * Everything visual lives here — components use utility classes only.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b0b0c",
        gold: {
          DEFAULT: "#b49058",
          hover: "#8f7043",
          soft: "rgba(180,144,88,.12)",
        },
        fill: "#f4f3f1",
        hair: "rgba(0,0,0,.08)",
        dim: "rgba(0,0,0,.45)",
        glyph: "rgba(0,0,0,.3)",
        faint: "rgba(0,0,0,.2)",
        "on-ink": "rgba(255,255,255,.55)",
        "on-ink-dim": "rgba(255,255,255,.5)",
        "on-ink-track": "rgba(255,255,255,.16)",
        surface: "#f7f6f4",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "SF Pro Text",
          "system-ui",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "3xs": ["9px", "1"],
        "2xs": ["11px", "1.2"],
        xs: ["12px", "1.2"],
        "xs-plus": ["12.5px", "1.2"],
        sm: ["13px", "1.4"],
        base: ["15px", "1.4"],
        "base-plus": ["14.5px", "1.6"],
        md: ["16px", "1.3"],
        lg: ["17px", "1"],
        xl: ["18px", "1"],
        "2xl": ["21px", "1.3"],
        "3xl": ["22px", "1.25"],
        "4xl": ["26px", "1"],
        "5xl": ["34px", "1.1"],
      },
      letterSpacing: {
        display: "-0.03em",
        heading: "-0.02em",
        snug: "-0.01em",
        label: "0.09em",
        badge: "0.08em",
        caption: "0.06em",
      },
      borderRadius: {
        chip: "8px",
        seg: "9px",
        field: "12px",
        "badge-sm": "13px",
        badge: "16px",
        tile: "18px",
        card: "22px",
        "card-lg": "26px",
        nav: "34px",
        sheet: "32px",
        frame: "42px",
      },
      boxShadow: {
        frame: "0 18px 50px rgba(0,0,0,.13)",
        card: "0 2px 8px rgba(0,0,0,.03)",
        seg: "0 1px 3px rgba(0,0,0,.12)",
        nav: "0 14px 30px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.06)",
        gold: "0 8px 20px rgba(180,144,88,.32)",
        "gold-sm": "0 6px 14px rgba(180,144,88,.38)",
        fab: "0 12px 26px rgba(180,144,88,.42)",
      },
      spacing: {
        desktop: "560px",
        nav: "100px",
        tab: "44px",
        "tab-active": "52px",
        fab: "60px",
      },
      transitionTimingFunction: {
        ios: "cubic-bezier(.32,.72,0,1)",
      },
    },
  },
  plugins: [],
};

export default config;
