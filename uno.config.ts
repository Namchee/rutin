import fs from 'node:fs/promises';

import icons from '@unocss/preset-icons';

import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind4(),
    // @ts-expect-error
    icons({
      collections: {
        me: {
          github: () => fs.readFile('./src/assets/icons/github.svg', 'utf-8'),
          logo: () => fs.readFile('./src/assets/icons/logo.svg', 'utf-8'),
          namchee: () => fs.readFile('./src/assets/icons/namchee.svg', 'utf-8'),
          solid: () => fs.readFile('./src/assets/icons/solid.svg', 'utf-8'),
          mcp: () => fs.readFile('./src/assets/icons/mcp.svg', 'utf-8'),
        },
      },
    }),
  ],
  theme: {
    colors: {
      background: {
        DEFAULT: 'var(--background)',
        hover: 'var(--background-hover)',
      },
      surface: {
        DEFAULT: 'var(--surface)',
        hover: 'var(--surface-hover)',
      },
      content: {
        primary: 'var(--content-primary)',
        secondary: 'var(--content-secondary)',
        tertiary: 'var(--content-tertiary)',
      },
      separator: 'var(--separator)',
      brand: {
        DEFAULT: 'var(--brand)',
        foreground: 'var(--brand-foreground)',
        hover:         'var(--brand-hover)',
      }
    },
    font: {
      mono: '"Geist Mono"',
      sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    },
    text: {
      '2xs': {
        fontSize: '0.625rem',
        lineHeight: '1.6',
      },
      xs: {
        fontSize: '0.75rem',
        lineHeight: '1.5',
      },
      sm: {
        fontSize: '0.875rem',
        lineHeight: '1.25',
      },
      base: {
        fontSize: '1rem',
        lineHeight: '1.5',
      },
      lg: {
        fontSize: '1.125rem',
        lineHeight: '1.75',
      },
      xl: {
        fontSize: '1.25rem',
        lineHeight: '2',
      },
      '2xl': {
        fontSize: '1.5rem',
        lineHeight: '2.25',
      },
    },
  },
});
