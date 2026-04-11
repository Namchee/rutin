import { createContext, createSignal, type JSXElement, useContext } from 'solid-js';

import type { ScheduleFormat } from './types';

function createRutinContext() {
  const [format, setFormat] = createSignal<ScheduleFormat>('posix');

  return [{ format }, { setFormat }] as const;
}

export const RutinContext = createContext<ReturnType<typeof createRutinContext>>();

export function RutinContextProvider(props: { children: JSXElement }) {
  return (
    <RutinContext.Provider value={createRutinContext()}>{props.children}</RutinContext.Provider>
  );
}

export function useRutinContext() {
  const store = useContext(RutinContext);
  if (!store) {
    throw new Error('useRutinContext must be used within RutinContextProvider');
  }

  return store;
}
