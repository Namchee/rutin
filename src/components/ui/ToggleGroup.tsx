import { ToggleGroup as ToggleGroupPrimitive } from '@ark-ui/solid';
import type { VariantProps } from 'class-variance-authority';
import type { JSX } from 'solid-js';
import { createContext, splitProps, useContext } from 'solid-js';
import { toggleVariants } from '@/components/ui/Toggle';
import { cn } from '@/lib/css';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
});

export interface ToggleGroupRootProps
  extends ToggleGroupPrimitive.RootProps,
    VariantProps<typeof toggleVariants> {
  class?: string | undefined;
  children?: JSX.Element;
}

const ToggleGroup = (props: ToggleGroupRootProps) => {
  const [local, others] = splitProps(props, ['class', 'children', 'size', 'variant']);

  return (
    <ToggleGroupPrimitive.Root
      class={cn('flex items-center justify-center gap-1', local.class)}
      {...others}>
      <ToggleGroupContext.Provider
        value={{
          get size() {
            return local.size;
          },
          get variant() {
            return local.variant;
          },
        }}>
        {local.children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
};

export interface ToggleGroupItemProps
  extends ToggleGroupPrimitive.ItemProps,
    VariantProps<typeof toggleVariants> {
  class?: string | undefined;
}

const ToggleGroupItem = (props: ToggleGroupItemProps) => {
  const [local, others] = splitProps(props, ['class', 'size', 'variant']);
  const context = useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      class={cn(
        toggleVariants({
          size: context.size || local.size,
          variant: context.variant || local.variant,
        }),
        'cursor-pointer text-content-secondary hover:text-content-primary data-[state=on]:bg-surface data-[state=on]:text-content-primary',
        local.class,
      )}
      {...others}
    />
  );
};

export { ToggleGroup, ToggleGroupItem };
