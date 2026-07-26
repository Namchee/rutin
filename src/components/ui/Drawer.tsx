import { Drawer as DrawerPrimitive } from '@ark-ui/solid';
import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';
import { Portal } from 'solid-js/web';

import { cn } from '@/lib/css';

const Drawer = DrawerPrimitive.Root;

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerClose = DrawerPrimitive.CloseTrigger;

type DrawerOverlayProps<T extends ValidComponent = 'div'> = DrawerPrimitive.BackdropProps & {
  as?: T;
  class?: string;
};

const DrawerOverlay = <T extends ValidComponent = 'div'>(props: DrawerOverlayProps<T>) => {
  const [, rest] = splitProps(props as DrawerOverlayProps, ['class']);

  return (
    <DrawerPrimitive.Backdrop
      class={cn('fixed inset-0 z-50 transition-colors', props.class)}
      {...rest}
    />
  );
};

type DrawerContentProps<T extends ValidComponent = 'div'> = DrawerPrimitive.ContentProps & {
  as?: T;
  class?: string;
  children?: JSX.Element;
  showX?: boolean;
};

const DrawerContent = <T extends ValidComponent = 'div'>(props: DrawerContentProps<T>) => {
  const [, rest] = splitProps(props as DrawerContentProps, ['class', 'children']);

  return (
    <Portal>
      <DrawerOverlay />

      <DrawerPrimitive.Context>
        {api => {
          const isLeft = api().swipeDirection === 'start';

          return (
            <DrawerPrimitive.Positioner class="fixed inset-0 z-50 flex items-end justify-center">
              <DrawerPrimitive.Content
                class={cn(
                  'fixed inset-x-0 z-50 flex flex-col bg-background transition-transform md:select-none',
                  props.class,
                  {
                    'bottom-0 mt-24 h-auto rounded-t-[10px]': !isLeft,
                    'left-0 h-screen rounded-r-[10px]': isLeft,
                  },
                )}
                {...rest}>
                <Show when={!isLeft}>
                  <DrawerPrimitive.Grabber class="flex w-full cursor-gray touch-none select-none justify-center p-2 active:cursor-grabbing">
                    <DrawerPrimitive.GrabberIndicator class="h-2 w-12 rounded-full bg-content-tertiary/15 transition-colors hover:bg-content-tertiary/25" />
                  </DrawerPrimitive.Grabber>
                </Show>

                {props.children}

                <Show when={props.showX}>
                  <DrawerPrimitive.CloseTrigger class='absolute top-3 right-3 w-fit text-content-primary'>
                    <div class="i-lucide-x size-3" />
                  </DrawerPrimitive.CloseTrigger>
                </Show>
              </DrawerPrimitive.Content>
            </DrawerPrimitive.Positioner>
          );
        }}
      </DrawerPrimitive.Context>
    </Portal>
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

type DrawerTitleProps<T extends ValidComponent = 'h2'> = DrawerPrimitive.TitleProps & {
  as?: T;
  class?: string;
};

const DrawerTitle = <T extends ValidComponent = 'h2'>(props: DrawerTitleProps<T>) => {
  const [, rest] = splitProps(props as DrawerTitleProps, ['class']);
  return (
    <DrawerPrimitive.Title
      class={cn('font-semibold text-lg leading-none tracking-tight', props.class)}
      {...rest}
    />
  );
};

type DrawerDescriptionProps<T extends ValidComponent = 'p'> = DrawerPrimitive.DescriptionProps & {
  as?: T;
  class?: string;
};

const DrawerDescription = <T extends ValidComponent = 'p'>(props: DrawerDescriptionProps<T>) => {
  const [, rest] = splitProps(props as DrawerDescriptionProps, ['class']);
  return (
    <DrawerPrimitive.Description
      class={cn('text-muted-foreground text-sm', props.class)}
      {...rest}
    />
  );
};

export {
  Drawer,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
