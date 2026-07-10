import type { HTMLArkProps } from '@ark-ui/solid';
import { Tooltip as TooltipPrimitive } from '@ark-ui/solid';

import { type Component, splitProps } from 'solid-js';
import { cn } from '@/lib/css';

const Tooltip: Component<TooltipPrimitive.RootProps> = props => {
  const mergedPositioning = () => ({
    gutter: 4,
    ...props.positioning,
  });

  return <TooltipPrimitive.Root {...props} positioning={mergedPositioning()} />;
};

const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = HTMLArkProps<'div'> & { class?: string | undefined };

const TooltipContent: Component<TooltipContentProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <TooltipPrimitive.Positioner>
      <TooltipPrimitive.Content
        class={cn(
          'relative z-50 rounded-lg bg-content-primary px-2 py-1 text-background text-xs shadow-md',
          local.class,
        )}
        {...others}>
        <TooltipPrimitive.Arrow class="[--arrow-background:var(--content-primary)] [--arrow-size:8px]">
          <TooltipPrimitive.ArrowTip />
        </TooltipPrimitive.Arrow>

        {local.children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Positioner>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent };
