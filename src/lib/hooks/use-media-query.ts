import { createSignal, onCleanup, onMount } from 'solid-js';

export function useMediaQuery(query: string) {
  const [value, setValue] = createSignal(false);

  function getValue() {
    if (!window) {
      return false;
    }

    return window.matchMedia(query).matches;
  }

  function handleChange() {
    setValue(getValue());
  }

  onMount(() => {
    const matchMedia = window.matchMedia(query);
    handleChange();

    matchMedia.addEventListener('change', handleChange);
  });

  onCleanup(() => {
    const matchMedia = window.matchMedia(query);

    matchMedia.removeEventListener('change', handleChange);
  });

  return value;
}
