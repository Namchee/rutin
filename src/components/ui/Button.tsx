import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps, JSX, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { cn } from '@/lib/css';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        icon: 'size-10',
        lg: 'h-10 px-8',
        sm: 'h-8 px-3 text-xs',
      },
      variant: {
        default: 'bg-brand text-brand-foreground hover:bg-brand-hover',
        ghost: 'hover:bg-surface hover:bg-surface-hover',
        outline: 'bg-surface hover:bg-surface-hover border border-separator',
      },
    },
  },
);

type ButtonProps<T extends ValidComponent = 'button'> = ComponentProps<T> &
  VariantProps<typeof buttonVariants> & {
    as?: T;
    class?: string | undefined;
    children?: JSX.Element;
  };

const Button = <T extends ValidComponent = 'button'>(
  props: ButtonProps<T>,
) => {
  const [local, others] = splitProps(props as ButtonProps, ['as', 'variant', 'size', 'class']);

  return (
    <Dynamic
      component={local.as ?? 'button'}
      class={cn(buttonVariants({ size: local.size, variant: local.variant }), local.class)}
      {...others}
    />
  );
};

export { Button, buttonVariants };
export type { ButtonProps };
