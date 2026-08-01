import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        muted: '#728078',
        leaf: '#3e8b67',
        mint: '#e9f7ee',
        cream: '#fffaf0',
      },
      boxShadow: {
        soft: '0 12px 32px rgba(27, 55, 39, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
