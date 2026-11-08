import { useSearchParams } from '@solidjs/router';
import { type Accessor, createEffect, createSignal, onCleanup, untrack } from 'solid-js';

interface QueryStateOptions<T> {
  debounce?: number;
  default: T;
  parser?: (value: string | string[]) => T;
}

const DEFAULT_DEBOUNCE = 300;
const REMOVED = '\u0000removed';

export function integerParser() {
  return (v: string | string[]) => Number(v);
}

export function booleanParser() {
  return (v: string | string[]) => Boolean(v) || v === '';
}

export function useQueryState<T = string>(
  key: string,
  options: QueryStateOptions<T>,
): [Accessor<T>, (val: T | null) => void] {
  const [params, setParams] = useSearchParams();
  const delay = options.debounce ?? DEFAULT_DEBOUNCE;

  const parse = (value: string | string[] | undefined): T => {
    if (options.parser) {
      return options.parser(value ?? '');
    }

    return (value as T) ?? options.default;
  };

  const [state, setState] = createSignal<T>(parse(params[key]));

  const echoes = new Set<string>();

  let timer: ReturnType<typeof setTimeout> | undefined;

  const serialize = (value: T | null) => (value == null ? null : String(value));
  const echoKey = (value: string | null) => value ?? REMOVED;

  function clearTimer() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  createEffect(() => {
    const raw = params[key];
    const written = echoKey(raw === undefined ? null : String(raw));

    if (echoes.has(written)) {
      echoes.delete(written);
      return;
    }

    echoes.clear();

    const next = parse(raw);

    if (!Object.is(untrack(state), next)) {
      clearTimer();
      setState(() => next);
    }
  });

  function setter(value: T | null) {
    setState(() => (value ?? options.default) as T);
    clearTimer();

    timer = setTimeout(() => {
      timer = undefined;

      const raw = params[key];
      const current = raw === undefined ? null : String(raw);
      const next = serialize(value);

      if (current === next) {
        return;
      }

      echoes.add(echoKey(next));

      setParams({ [key]: next });
    }, delay);
  }

  onCleanup(clearTimer);

  return [state, setter];
}
