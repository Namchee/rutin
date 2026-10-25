import { createContext, createSignal, type JSX, useContext } from 'solid-js';
import type { ScheduleFormat } from '@/types/schedule';

export type DisplayType = 'grid' | 'list';

function createLibraryContext() {
  const [format, setFormat] = createSignal<ScheduleFormat>('unix');
  const [display, setDisplay] = createSignal<DisplayType>('grid');
  const [tags, setTags] = createSignal<string[]>(['all']);

  return {
    display,

    format,
    setDisplay,
    setFormat,
    setTags,

    tags,
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
