import fs from 'node:fs/promises';

import icons from '@unocss/preset-icons';
import compiler from '@unocss/transformer-compile-class';

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
        },
      },
    }),
  ],
  theme: {
    colors: {
      background: 'oklch(from var(--background) l c h / <alpha>)',
      surface: 'oklch(from var(--surface) l c h / <alpha>)',
      text: {
        primary: 'oklch(from var(--text-primary) l c h / <alpha>)',
        secondary: 'oklch(from var(--text-secondary) l c h / <alpha>)',
        tertiary: 'oklch(from var(--text-tertiary) l c h / <alpha>)',
      },
      separator: {
        primary: 'oklch(from var(--separator-primary) l c h / <alpha>)',
        secondary: 'oklch(from var(--separator-secondary) l c h / <alpha>)',
      },
    },
    font: {
      mono: '"Geist Mono"',
      sans: '"Geist"',
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
  // @ts-expect-error
  transformers: [compiler()],
});
