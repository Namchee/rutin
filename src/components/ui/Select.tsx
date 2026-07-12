import { Select as SelectPrimitive } from '@ark-ui/solid';
import { cva } from 'class-variance-authority';
import type { JSX, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '@/lib/css';

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.ValueText;
const SelectHiddenSelect = SelectPrimitive.HiddenSelect;

type SelectTriggerProps<T extends ValidComponent = 'button'> = SelectPrimitive.TriggerProps & {
  as?: T;
  class?: string | undefined;
  children?: JSX.Element;
};

const SelectTrigger = <T extends ValidComponent = 'button'>(props: SelectTriggerProps<T>) => {
  const [local, others] = splitProps(props as SelectTriggerProps, ['class', 'children']);
  return (
    <SelectPrimitive.Trigger
      class={cn(
        'flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-separator bg-transparent p-2 text-left text-sm ring-offset-background transition-colors transition-shadow placeholder:text-muted-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-content-tertiary/25 disabled:cursor-not-allowed disabled:opacity-50',
        local.class,
      )}
      {...others}>
      {local.children}
      <div class="i-lucide-chevron-down size-[14px] shrink-0 text-muted-foreground" />
    </SelectPrimitive.Trigger>
  );
};

type SelectContentProps<T extends ValidComponent = 'div'> = SelectPrimitive.ContentProps & {
  as?: T;
  class?: string | undefined;
  children?: JSX.Element;
};

const SelectContent = <T extends ValidComponent = 'div'>(props: SelectContentProps<T>) => {
  const [local, others] = splitProps(props as SelectContentProps, ['class', 'children']);
  return (
    <SelectPrimitive.Positioner>
      <SelectPrimitive.Content
        class={cn(
          'relative z-50 m-0 min-w-32 list-none overflow-hidden rounded-md border border-separator bg-surface p-1 text-content-primary shadow-md focus:outline-none',
          local.class,
        )}
        {...others}>
        {local.children}
      </SelectPrimitive.Content>
    </SelectPrimitive.Positioner>
  );
};

type SelectItemProps<T extends ValidComponent = 'div'> = SelectPrimitive.ItemProps & {
  as?: T;
  class?: string | undefined;
  children?: JSX.Element;
};

const SelectItem = <T extends ValidComponent = 'div'>(props: SelectItemProps<T>) => {
  const [local, others] = splitProps(props as SelectItemProps, ['class', 'children']);
  return (
    <SelectPrimitive.Item
      class={cn(
        'relative mt-0 flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-10 pl-2 text-sm outline-none focus:bg-content-tertiary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        local.class,
      )}
      {...others}>
      <SelectPrimitive.ItemText>{local.children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator class="absolute right-2 flex size-3.5 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l5 5l10 -10" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
};

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    defaultVariants: {
      variant: 'label',
    },
    variants: {
      variant: {
        description: 'font-normal text-muted-foreground',
        error: 'text-xs text-destructive',
        label: 'data-[invalid]:text-destructive',
      },
    },
  },
);

type SelectLabelProps<T extends ValidComponent = 'label'> = SelectPrimitive.LabelProps & {
  as?: T;
  class?: string | undefined;
};

const SelectLabel = <T extends ValidComponent = 'label'>(props: SelectLabelProps<T>) => {
  const [local, others] = splitProps(props as SelectLabelProps, ['class']);
  return <SelectPrimitive.Label class={cn(labelVariants(), local.class)} {...others} />;
};

// Ark UI uses standard HTML/DOM properties for custom descriptors like description or error text
type SelectDescriptionProps<T extends ValidComponent = 'div'> = {
  as?: T;
  class?: string | undefined;
  children?: JSX.Element;
};

const SelectDescription = <T extends ValidComponent = 'div'>(props: SelectDescriptionProps<T>) => {
  const [local, others] = splitProps(props as SelectDescriptionProps, ['class']);
  return <div class={cn(labelVariants({ variant: 'description' }), local.class)} {...others} />;
};

const SelectErrorMessage = <T extends ValidComponent = 'div'>(props: SelectDescriptionProps<T>) => {
  const [local, others] = splitProps(props as SelectDescriptionProps, ['class']);
  return <div class={cn(labelVariants({ variant: 'error' }), local.class)} {...others} />;
};

export {
  Select,
  SelectValue,
  SelectHiddenSelect,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectDescription,
  SelectErrorMessage,
};
