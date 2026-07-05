import fs from 'node:fs/promises';

import icons from '@unocss/preset-icons';

import { defineConfig, presetWind4 } from 'unocss';

import { presetAnimations } from 'unocss-preset-animations';

export default defineConfig({
  presets: [
    presetWind4(),
    // @ts-expect-error
    presetAnimations(),
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
  rules: [
    [
      'no-scrollbar',
      { '-ms-overflow-style': 'none', '::-webkit-scrollbar': 'hidden', 'scrollbar-width': 'none' },
    ],
  ],
  theme: {
    animation: {
      durations: {
        'accordion-down': '0.2s',
        'accordion-up': '0.2s',
        'content-hide': '0.2s',
        'content-show': '0.2s',
      },
      keyframes: {
        'accordion-down':
          '{ from { height: 0 } to { height: var(--kb-accordion-content-height) } }',
        'accordion-up': '{ from { height: var(--kb-accordion-content-height) } to { height: 0 } }',
        'content-hide':
          '{ from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(0.96) } }',
        'content-show':
          '{ from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }',
      },
      timingFns: {
        'accordion-down': 'ease-out',
        'accordion-up': 'ease-out',
        'content-hide': 'ease-out',
        'content-show': 'ease-out',
      },
    },
    colors: {
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      background: 'hsl(var(--background))',
      border: 'hsl(var(--border))',
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      error: {
        DEFAULT: 'hsl(var(--error))',
        foreground: 'hsl(var(--error-foreground))',
      },
      foreground: 'hsl(var(--foreground))',
      info: {
        DEFAULT: 'hsl(var(--info))',
        foreground: 'hsl(var(--info-foreground))',
      },
      input: 'hsl(var(--input))',
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      ring: 'hsl(var(--ring))',
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      success: {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))',
      },
      warning: {
        DEFAULT: 'hsl(var(--warning))',
        foreground: 'hsl(var(--warning-foreground))',
      },
    },
    font: {
      mono: '"Geist Mono"',
      sans: '"Geist"',
    },
    radius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
      xl: 'calc(var(--radius) + 4px)',
    },
  },
  variants: [
    matcher => {
      if (!matcher.startsWith('dark:')) return matcher;
      return {
        matcher: matcher.slice(5),
        selector: s => `.dark ${s}, [data-kb-theme="dark"] ${s}`,
      };
    },
  ],
});
