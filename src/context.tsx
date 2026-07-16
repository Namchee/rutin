import { createContext, createSignal, type JSXElement, useContext } from 'solid-js';

import type { ScheduleFormat } from './types';

const Parser: Record<ScheduleFormat, any> = {};

function createRutinContext() {
  const [format, setFormat] = createSignal<ScheduleFormat>('posix');
  const [tokens, setTokens] = createSignal<string[]>([]);

  return {
    format,
    setFormat,

    tokens,
  } as const;
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
