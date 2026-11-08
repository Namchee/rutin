import { Menu as MenuPrimitive } from '@ark-ui/solid';
import type { Component, ComponentProps, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { Portal } from 'solid-js/web';

import { cn } from '@/lib/css';

const DropdownMenuTrigger = MenuPrimitive.Trigger;
const DropdownMenuSub = MenuPrimitive.Root;
const DropdownMenuGroup = MenuPrimitive.ItemGroup;
const DropdownMenuRadioGroup = MenuPrimitive.RadioItemGroup;
const DropdownMenuPortal = Portal;

type DropdownMenuProps = MenuPrimitive.RootProps;

const DropdownMenu: Component<DropdownMenuProps> = props => {
  const mergedPositioning = () => ({
    gutter: 4,
    ...props.positioning,
  });

  return <MenuPrimitive.Root {...props} positioning={mergedPositioning()} />;
};

type DropdownMenuContentProps = MenuPrimitive.ContentProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const DropdownMenuContent: Component<DropdownMenuContentProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <Portal>
      <MenuPrimitive.Positioner>
        <MenuPrimitive.Content
          class={cn(
            'z-50 min-w-32 overflow-hidden rounded-md border border-separator bg-surface p-1 text-content-primary shadow-md focus:outline-none',
            local.class,
          )}
          {...others}>
          {local.children}
        </MenuPrimitive.Content>
      </MenuPrimitive.Positioner>
    </Portal>
  );
};

type DropdownMenuItemProps = MenuPrimitive.ItemProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const DropdownMenuItem: Component<DropdownMenuItemProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <MenuPrimitive.Item
      class={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-hover data-[highlighted]:text-content-primary data-[disabled]:opacity-50',
        local.class,
      )}
      {...others}>
      {local.children}
    </MenuPrimitive.Item>
  );
};

const DropdownMenuShortcut: Component<ComponentProps<'span'>> = props => {
  const [, rest] = splitProps(props, ['class']);
  return <span class={cn('ml-auto text-xs tracking-widest opacity-60', props.class)} {...rest} />;
};

const DropdownMenuLabel: Component<ComponentProps<'div'> & { inset?: boolean }> = props => {
  const [, rest] = splitProps(props, ['class', 'inset']);
  return (
    <div
      class={cn('px-2 py-1.5 font-semibold text-sm', props.inset && 'pl-8', props.class)}
      {...rest}
    />
  );
};

type DropdownMenuSeparatorProps = MenuPrimitive.SeparatorProps & {
  class?: string | undefined;
};

const DropdownMenuSeparator: Component<DropdownMenuSeparatorProps> = props => {
  const [local, others] = splitProps(props, ['class']);

  return (
    <MenuPrimitive.Separator class={cn('-mx-1 my-1 h-px bg-separator', local.class)} {...others} />
  );
};

type DropdownMenuSubTriggerProps = MenuPrimitive.TriggerItemProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const DropdownMenuSubTrigger: Component<DropdownMenuSubTriggerProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <MenuPrimitive.TriggerItem
      class={cn(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-surface-hover data-[state=open]:bg-surface-hover',
        local.class,
      )}
      {...others}>
      {local.children}
      <div class="i-lucide-chevron-right ml-auto size-4" />
    </MenuPrimitive.TriggerItem>
  );
};

type DropdownMenuSubContentProps = MenuPrimitive.ContentProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const DropdownMenuSubContent: Component<DropdownMenuSubContentProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <MenuPrimitive.Positioner>
      <MenuPrimitive.Content
        class={cn(
          'z-50 min-w-32 overflow-hidden rounded-md border border-separator bg-surface p-1 text-content-primary shadow-md focus:outline-none',
          local.class,
        )}
        {...others}>
        {local.children}
      </MenuPrimitive.Content>
    </MenuPrimitive.Positioner>
  );
};

type DropdownMenuCheckboxItemProps = MenuPrimitive.CheckboxItemProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const DropdownMenuCheckboxItem: Component<DropdownMenuCheckboxItemProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <MenuPrimitive.CheckboxItem
      class={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-hover data-[highlighted]:text-content-primary data-[disabled]:opacity-50',
        local.class,
      )}
      {...others}>
      <span class="absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <div class="i-lucide-check size-4" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </MenuPrimitive.CheckboxItem>
  );
};

type DropdownMenuGroupLabelProps = MenuPrimitive.ItemGroupLabelProps & {
  class?: string | undefined;
};

const DropdownMenuGroupLabel: Component<DropdownMenuGroupLabelProps> = props => {
  const [local, others] = splitProps(props, ['class']);

  return (
    <MenuPrimitive.ItemGroupLabel
      class={cn('px-2 py-1.5 font-semibold text-sm', local.class)}
      {...others}
    />
  );
};

type DropdownMenuRadioItemProps = MenuPrimitive.RadioItemProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const DropdownMenuRadioItem: Component<DropdownMenuRadioItemProps> = props => {
  const [local, others] = splitProps(props, ['class', 'children']);

  return (
    <MenuPrimitive.RadioItem
      class={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-hover data-[highlighted]:text-content-primary data-[disabled]:opacity-50',
        local.class,
      )}
      {...others}>
      <span class="absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <div class="size-2 rounded-full bg-current" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </MenuPrimitive.RadioItem>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
};
