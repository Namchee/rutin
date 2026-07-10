import { Toggle as TogglePrimitive } from '@ark-ui/solid';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '@/lib/css';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-3',
        lg: 'h-10 px-3',
        sm: 'h-8 px-2',
      },
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent shadow-sm',
      },
    },
  },
);

type ToggleProps<T extends ValidComponent = 'button'> = TogglePrimitive.RootProps &
  VariantProps<typeof toggleVariants> & {
    as?: T;
    class?: string | undefined;
  };

const Toggle = <T extends ValidComponent = 'button'>(props: ToggleProps<T>) => {
  const [local, others] = splitProps(props as ToggleProps, ['class', 'variant', 'size']);

  return (
    <TogglePrimitive.Root
      class={cn(toggleVariants({ size: local.size, variant: local.variant }), local.class)}
      {...others}
    />
  );
};

export type { ToggleProps };
export { toggleVariants, Toggle };
