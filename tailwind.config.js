/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Class strategy so the Settings theme toggle (nativewind colorScheme.set)
  // works on native and web; 'media' breaks css-interop's web runtime.
  darkMode: 'class',
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
      // Web parity: font-heading = Outfit, body = Inter. React Native needs one
      // family name per weight, hence the per-weight utilities.
      fontFamily: {
        heading: ['Outfit_700Bold'],
        'heading-semibold': ['Outfit_600SemiBold'],
        'heading-black': ['Outfit_800ExtraBold'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
