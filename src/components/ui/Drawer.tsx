import { Dialog as DialogPrimitive, useDialogContext } from '@ark-ui/solid';
import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '@/lib/css';

const Drawer = DialogPrimitive.Root;

const DrawerTrigger = DialogPrimitive.Trigger;

const DrawerPortal = DialogPrimitive.Portal;

const DrawerClose = DialogPrimitive.CloseTrigger;

type DrawerOverlayProps<T extends ValidComponent = 'div'> = DialogPrimitive.BackdropProps & {
  as?: T;
  class?: string;
};

const DrawerOverlay = <T extends ValidComponent = 'div'>(props: DrawerOverlayProps<T>) => {
  const [, rest] = splitProps(props as DrawerOverlayProps, ['class']);
  const dialog = useDialogContext();

  return (
    <DialogPrimitive.Backdrop
      class={cn('fixed inset-0 z-50 transition-colors duration-300', props.class)}
      style={{
        // Ark UI maps overlay states dynamically using custom properties
        // or through context state signals like dialog().open
        'background-color': dialog().open ? 'rgb(0 0 0 / 0.8)' : 'rgb(0 0 0 / 0)',
      }}
      {...rest}
    />
  );
};

type DrawerContentProps<T extends ValidComponent = 'div'> = DialogPrimitive.ContentProps & {
  as?: T;
  class?: string;
  children?: JSX.Element;
};

const DrawerContent = <T extends ValidComponent = 'div'>(props: DrawerContentProps<T>) => {
  const [, rest] = splitProps(props as DrawerContentProps, ['class', 'children']);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      {/* Ark UI uses Positioner to handle layout alignment and layer stack management */}
      <DialogPrimitive.Positioner class="fixed inset-0 z-50 flex items-end justify-center">
        <DialogPrimitive.Content
          class={cn(
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background transition-transform duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in md:select-none',
            props.class,
          )}
          {...rest}>
          <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          {props.children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Positioner>
    </DrawerPortal>
  );
};

const DrawerHeader: Component<ComponentProps<'div'>> = props => {
  const [, rest] = splitProps(props, ['class']);
  return <div class={cn('grid gap-1.5 p-4 text-center sm:text-left', props.class)} {...rest} />;
};

const DrawerFooter: Component<ComponentProps<'div'>> = props => {
  const [, rest] = splitProps(props, ['class']);
  return <div class={cn('mt-auto flex flex-col gap-2 p-4', props.class)} {...rest} />;
};

type DrawerTitleProps<T extends ValidComponent = 'h2'> = DialogPrimitive.TitleProps & {
  as?: T;
  class?: string;
};

const DrawerTitle = <T extends ValidComponent = 'h2'>(props: DrawerTitleProps<T>) => {
  const [, rest] = splitProps(props as DrawerTitleProps, ['class']);
  return (
    <DialogPrimitive.Title
      class={cn('font-semibold text-lg leading-none tracking-tight', props.class)}
      {...rest}
    />
  );
};

type DrawerDescriptionProps<T extends ValidComponent = 'p'> = DialogPrimitive.DescriptionProps & {
  as?: T;
  class?: string;
};

const DrawerDescription = <T extends ValidComponent = 'p'>(props: DrawerDescriptionProps<T>) => {
  const [, rest] = splitProps(props as DrawerDescriptionProps, ['class']);
  return (
    <DialogPrimitive.Description
      class={cn('text-muted-foreground text-sm', props.class)}
      {...rest}
    />
  );
};

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
