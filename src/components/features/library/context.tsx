import { createContext, createMemo, type JSX, useContext } from 'solid-js';
import Templates from '@/assets/library.json';
import { useQueryState } from '@/lib/hooks/use-query-state';
import type { ScheduleFormat } from '@/types/schedule';

function createLibraryContext() {
  const [query, setQuery] = useQueryState('q', { default: '' });
  const [format, setFormat] = useQueryState<ScheduleFormat>('dialect', { default: 'unix' });

  const templates = createMemo(() => {
    const q = query().toLowerCase().trim();

    return Templates.filter(template => {
      return template.syntax.toLowerCase().match(q) || template.label.toLowerCase().match(q) || template.description.toLowerCase().match(q);
    });
  });

  return {
    format,
    query,
    setFormat,
    setQuery,

    templates
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
