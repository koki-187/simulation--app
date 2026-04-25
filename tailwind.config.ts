import type { Config } from 'tailwindcss';

// Tailwind v4: colors are defined via @theme in globals.css.
// This config is kept for IDE autocomplete and any v3-compat plugins.
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
