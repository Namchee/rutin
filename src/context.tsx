import { createContext, type JSX, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import type { ScheduleFormat } from './types';

const INITIAL_CONTEXT_VALUE = {
  format: 'posix',
};

export const ScheduleContext = createContext();

export function ScheduleContextProvider(props: { children: JSX.Element }) {
  const [value, setValue] = createStore(INITIAL_CONTEXT_VALUE);

  const store = [
    value,
    {
      setFormat(format: ScheduleFormat) {
        setValue('format', format);
      },
    },
  ];

  return <ScheduleContext.Provider value={store}>{props.children}</ScheduleContext.Provider>;
}

export function useScheduleStore() {
  const store = useContext(ScheduleContext);
  if (!store) {
    throw new Error('useScheduleStore must be used within ScheduleContext');
  }

  return store;
}
