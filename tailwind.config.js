/** @type {import('tailwindcss').Config} */
//
// Brand colors are sourced from CSS custom properties so utility classes
// (bg-brand, text-brand-dark, ring-brand) flip automatically with the
// active role theme. The variables are defined and switched in src/index.css —
// never hardcode brand hex values here. New tints belong as new CSS vars in
// index.css; mirror the name in this map if a Tailwind utility is desired.
//
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        "brand-light": "var(--brand-light)",
        "brand-tint": "var(--brand-tint)",
        "brand-tint-faint": "var(--brand-tint-faint)",
        "brand-tint-strong": "var(--brand-tint-strong)",
        "brand-tint-bold": "var(--brand-tint-bold)",
      },
      backgroundImage: {
        "brand-gradient": "var(--brand-gradient)",
      },
      boxShadow: {
        "brand-ring": "0 0 0 3px var(--brand-focus-ring)",
        "brand-soft": "0 6px 20px -8px var(--brand-shadow)",
      },
    },
  },
  plugins: [],
}
