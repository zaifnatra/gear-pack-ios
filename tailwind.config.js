/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Ported from the web app's globals.css design tokens. Values are driven
      // by CSS variables in src/global.css so light/dark follows the system
      // color scheme, exactly like the web (#fff/#171717 light, #0a0a0a/#ededed dark).
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
