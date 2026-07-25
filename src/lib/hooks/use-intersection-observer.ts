import { createEffect, createSignal, onCleanup } from "solid-js";

export function useIntersectionObserver(el: HTMLElement, onIntersect: () => void) {
  const [observer, setObserver] = createSignal<IntersectionObserver | null>(null);

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
        root: el,
      },
    );

    setObserver(observer);

    observer.observe(el);
  });

  onCleanup(() => {
    const activeObserver = observer();

    if (activeObserver) {
      activeObserver.disconnect();
    }
  });
}
