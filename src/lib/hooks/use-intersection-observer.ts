import { type Accessor, createEffect, onCleanup } from 'solid-js';

type IntersectionOptions = {
  root?: Accessor<Element | undefined>;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useIntersectionObserver(
  target: Accessor<Element | undefined>,
  onIntersect: () => void,
  options: IntersectionOptions = {},
) {
  createEffect(() => {
    const el = target();
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onIntersect();
          }
        });
      },
      {
        root: options.root?.(),
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      },
    );

    observer.observe(el);

    onCleanup(() => {
      observer.disconnect();
    });
  });
}
