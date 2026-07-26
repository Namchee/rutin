import type { Temporal } from '@js-temporal/polyfill';
import { createContext, createSignal, type JSXElement, useContext } from 'solid-js';
import { Parsers } from '@/lib/parser/base';
import type { ScheduleFormat } from '@/types';

export type ScheduleState = 'valid' | 'invalid' | 'incomplete';
export type ScheduleType = 'macro' | 'normal';

const ScheduleLabel: Record<Exclude<ScheduleState, 'valid'>, string> = {
  incomplete: 'Schedule is not complete',
  invalid: 'There are error(s) in your schedule syntax',
};

function createEditorContext() {
  let ref!: HTMLInputElement;

  const [format, setFormat] = createSignal<ScheduleFormat>('posix');

  const [state, setState] = createSignal<ScheduleState>('incomplete');
  const [tokens, setTokens] = createSignal<string[]>([]);
  const [descriptor, setDescriptor] = createSignal<string>(ScheduleLabel.incomplete);
  const [normal, setNormal] = createSignal<boolean>(true);
  const [errors, setErrors] = createSignal<number[]>([]);
  const [generator, setGenerator] =
    createSignal<Generator<Temporal.PlainDateTime, unknown, unknown>>();

  const [caret, setCaret] = createSignal<number>(-1);

  function updateCaret() {
    if (!ref) {
      return;
    }

    const { value, selectionStart } = ref;
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

  function onInput() {
    if (!ref) {
      return;
    }

    updateCaret();

    const result = Parsers[format()].validate(ref.value);
    setState(result.status);
    setNormal(result.normal);
    setTokens(result.tokens);

    setDescriptor(result.status === 'valid' ? result.descriptor : ScheduleLabel[result.status]);
    setErrors(result.status === 'invalid' ? result.error : []);
    setGenerator(result.status === 'valid' ? result.generator : undefined);
  }

  function onBlur(event: FocusEvent) {
    const target = event.relatedTarget;

    if (!target || !(target instanceof HTMLElement) || !target.dataset.hint) {
      setCaret(-1);
    }
  }

  function onHintSelect(index: number) {
    const token = tokens()?.[index];
    if (!token || !ref) {
      return;
    }

    const tokenIdx = ref.value.indexOf(token);
    if (tokenIdx === -1) {
      return;
    }

    ref.focus();
    ref.setSelectionRange(tokenIdx, token.length);
  }

  function onCaretMovement() {
    if (ref) {
      updateCaret();
    }
  }

  return {
    caret,
    descriptor,
    errors,
    format,
    generator,
    normal,
    onBlur,
    onCaretMovement,
    onHintSelect,

    onInput,
    ref,

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

export function useEditorContext() {
  const store = useContext(EditorContext);
  if (!store) {
    throw new Error('useEditorContext must be used within EditorContextProvider');
  }

  return store;
}
