import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { cn } from '@/lib/css';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-brand text-brand-foreground [a]:hover:bg-brand/80',
        ghost: 'hover:bg-background hover:text-content-primary dark:hover:bg-surface/50',
        outline: 'border-separator text-content-primary [a]:hover:bg-surface',
      },
    },
  },
);

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  as?: any;
}

function Badge(props: BadgeProps) {
  const [local, variantProps, rest] = splitProps(props, ['class', 'as'], ['variant']);

  return (
    <Dynamic
      component={local.as || 'span'}
      class={cn(badgeVariants({ variant: variantProps.variant }), local.class)}
      {...rest}
    />
  );
}

export { Badge, badgeVariants };
