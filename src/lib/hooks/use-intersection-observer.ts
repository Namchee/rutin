import { type Accessor, createEffect, onCleanup } from 'solid-js';

type IntersectionOptions = {
  root?: Accessor<Element | undefined>;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useIntersectionObserver(
  onIntersect: () => void,
  options: IntersectionOptions = {},
) {
  function ref(elem: HTMLElement) {
    createEffect(() => {
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

      observer.observe(elem);

      onCleanup(() => {
        observer.disconnect();
      });
    });
  }

  return { ref };
}
