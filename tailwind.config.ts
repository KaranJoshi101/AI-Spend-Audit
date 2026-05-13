import type { Config } from 'tailwindcss';
import formPlugin from '@tailwindcss/forms';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gradient-start': '#0f172a',
        'gradient-end': '#1e293b',
      },
      spacing: {
        '128': '32rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [formPlugin],
};

export default config;
