import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
  presets: [presetWind4()],
  variants: [
    matcher => {
      if (!matcher.startsWith('dark:')) return matcher;
      return {
        matcher: matcher.slice(5),
        selector: s => `.dark ${s}, [data-kb-theme="dark"] ${s}`,
      };
    },
  ],
  theme: {
    font: {
      sans: '"Geist"',
      mono: '"Geist Mono"',
    },
    colors: {
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      info: {
        DEFAULT: 'hsl(var(--info))',
        foreground: 'hsl(var(--info-foreground))',
      },
      success: {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))',
      },
      warning: {
        DEFAULT: 'hsl(var(--warning))',
        foreground: 'hsl(var(--warning-foreground))',
      },
      error: {
        DEFAULT: 'hsl(var(--error))',
        foreground: 'hsl(var(--error-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
    },
    radius: {
      xl: 'calc(var(--radius) + 4px)',
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    animation: {
      keyframes: {
        'accordion-down':
          '{ from { height: 0 } to { height: var(--kb-accordion-content-height) } }',
        'accordion-up': '{ from { height: var(--kb-accordion-content-height) } to { height: 0 } }',
        'content-show':
          '{ from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }',
        'content-hide':
          '{ from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(0.96) } }',
      },
      durations: {
        'accordion-down': '0.2s',
        'accordion-up': '0.2s',
        'content-show': '0.2s',
        'content-hide': '0.2s',
      },
      timingFns: {
        'accordion-down': 'ease-out',
        'accordion-up': 'ease-out',
        'content-show': 'ease-out',
        'content-hide': 'ease-out',
      },
    },
  },
});
