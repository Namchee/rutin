import { createContext, createSignal, type JSXElement, useContext } from 'solid-js';

import { Parsers, type ValidationResult } from '@/lib/parser/base';
import type { ScheduleFormat } from '@/types';

export type ScheduleState = 'valid' | 'invalid' | 'incomplete';
export type ScheduleType = 'macro' | 'normal';

function createEditorContext() {
  const [format, setFormat] = createSignal<ScheduleFormat>('posix');
  const [result, setResult] = createSignal<ValidationResult>(Parsers.posix.validate(''));

  const [caret, setCaret] = createSignal<number>(-1);

  function updateCaret(el: HTMLInputElement) {
    const { value, selectionStart } = el;
    const trimmed = value.trim();

    if (selectionStart === null) {
      return;
    }

    if (trimmed.length === 0 || (value.startsWith('@') && Parsers[format()].hasMacro)) {
      setCaret(-1);
      return;
    }

    const textBeforeCaret = value.slice(0, selectionStart);
    const tokensBefore = textBeforeCaret.match(/\S+/g) || [];
    const isAtTrailingSpace = /\s$/.test(textBeforeCaret);

    const currentSectionIdx = isAtTrailingSpace
      ? tokensBefore.length
      : Math.max(0, tokensBefore.length - 1);

    setCaret(currentSectionIdx);
  }

  function onInput(el: HTMLInputElement) {
    updateCaret(el);

    setResult(Parsers[format()].validate(el.value));
  }

  function onBlur(event: FocusEvent) {
    const target = event.relatedTarget;

    if (!target || !(target instanceof HTMLElement) || !target.classList.contains('active-hint')) {
      setCaret(-1);
    }
  }

  return {
    caret,
    format,
    onBlur,

    onInput,

    result,
    setFormat,
  } as const;
}

export const EditorContext = createContext<ReturnType<typeof createEditorContext>>();

export function EditorContextProvider(props: { children: JSXElement }) {
  return (
    <EditorContext.Provider value={createEditorContext()}>{props.children}</EditorContext.Provider>
  );
}

export function useEditorContext() {
  const store = useContext(EditorContext);
  if (!store) {
    throw new Error('useEditorContext must be used within EditorContextProvider');
  }

  return store;
}
