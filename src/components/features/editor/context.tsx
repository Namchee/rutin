import { createContext, createSignal, type JSXElement, useContext } from 'solid-js';

import type { ScheduleFormat } from '@/types';

export type ScheduleState = 'valid' | 'invalid' | 'incomplete';

function createEditorContext() {
  const [format, setFormat] = createSignal<ScheduleFormat>('posix');

  const [state, setState] = createSignal<ScheduleState>('valid');
  const [tokens, setTokens] = createSignal<string[]>([]);

  return {
    format,
    setFormat,

    state,

    tokens,
  } as const;
}

export const EditorContext = createContext<ReturnType<typeof createEditorContext>>();

export function EditorContextProvider(props: { children: JSXElement }) {
  return (
    <EditorContext.Provider value={createEditorContext()}>{props.children}</EditorContext.Provider>
  );
}

export function useEditor() {
  const store = useContext(EditorContext);
  if (!store) {
    throw new Error('useEditor must be used within EditorContextProvider');
  }

  return store;
}
