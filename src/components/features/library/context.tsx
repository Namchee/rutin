import { createContext, createSignal, type JSX, useContext } from 'solid-js';
import { useQueryState } from '@/lib/hooks/use-query-state';
import type { ScheduleFormat } from '@/types/schedule';

export type DisplayType = 'grid' | 'list';

function createLibraryContext() {
  const [query, setQuery] = useQueryState('q', { default: '' });
  const [format, setFormat] = useQueryState<ScheduleFormat>('dialect', { default: 'unix' });

  return {
    format,
    query,
    setFormat,
    setQuery,
  };
}

export const LibraryContext = createContext<ReturnType<typeof createLibraryContext>>();

export function LibraryContextProvider(props: { children: JSX.Element }) {
  return (
    <LibraryContext.Provider value={createLibraryContext()}>
      {props.children}
    </LibraryContext.Provider>
  );
}

export function useLibraryContext() {
  const store = useContext(LibraryContext);
  if (!store) {
    throw new Error('useLibraryContext must be used within LibraryContextProvider');
  }

  return store;
}
