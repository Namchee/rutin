import { useSearchParams } from '@solidjs/router';

import type { Accessor } from 'solid-js';

interface QueryStateOptions<T> {
  default: T;
  parser?: (value: string | string[]) => T;
}

export function integerParser() {
  return (v: string | string[]) => Number(v);
}

export function booleanParser() {
  return (v: string | string[]) => Boolean(v) || v === '';
}

export function useQueryState<T = string>(key: string, options: QueryStateOptions<T>): [Accessor<T>, (val: T | null) => void] {
  const [params, setParams] = useSearchParams();

  function accessor() {
    if (options.parser) {
      return options.parser(params[key] ?? '');
    }

    return params[key] as T ?? options.default;
  }

  function setter(val: T | null) {
    if (val == null) {
      setParams({ [key]: null });
    } else {
      setParams({ [key]: String(val) });
    }
  }

  return [accessor, setter];
}
