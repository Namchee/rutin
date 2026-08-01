import type { Temporal } from '@js-temporal/polyfill';
import { createContext, createSignal, type JSXElement, useContext } from 'solid-js';
import { Parsers } from '@/lib/parsers';
import type { ScheduleFormat } from '@/types';

export type ScheduleState = 'valid' | 'invalid' | 'incomplete';
export type ScheduleType = 'macro' | 'normal';

const ScheduleLabel: Record<Exclude<ScheduleState, 'valid'>, string> = {
  incomplete: 'Schedule is not complete',
  invalid: 'There are error(s) in your schedule syntax',
};

interface Macro {
  label: string;
  alias: string;
}

export const Macros: Record<ScheduleFormat, Record<string, Macro>> = {
  amazon: {},
  'cf-workers': {},
  node: {
    '@annually': { alias: '0 0 1 1 *', label: 'Every year' },
    '@daily': { alias: '0 0 * * *', label: 'Every day' },
    '@hourly': { alias: '0 * * * *', label: 'Every hour' },
    '@midnight': { alias: '0 0 * * *', label: 'Every day on midnight' },
    '@monthly': { alias: '0 0 1 * *', label: 'Every month' },
    '@weekly': { alias: '0 0 * * 0', label: 'Every week' },
    '@yearly': { alias: '0 0 1 1 *', label: 'Every year' },
  },
  quartz: {},
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  systemd: {
    minutely: { alias: '*-*-* *:*:00', label: 'Every minute' },
    hourly: { alias: '*-*-* *:00:00', label: 'Every hour' },
    daily: { alias: '*-*-* 00:00:00', label: 'Every day' },
    weekly: { alias: 'Mon *-*-* 00:00:00', label: 'Every week on Mondays' },
    monthly: { alias: '*-*-01 00:00:00', label: 'Every month on 1st day' },
    yearly: { alias: '*-01-01 00:00:00', label: 'Every year on 1st date' },
    quarterly: { alias: '*-01,04,07,10-01 00:00:00', label: 'Every quarter year' },
    semianually: { alias: '*-01,07-01 00:00:00', label: 'Twice per year' },
  },
  unix: {
    '@annually': { alias: '0 0 1 1 *', label: 'Every year' },
    '@daily': { alias: '0 0 * * *', label: 'Every day' },
    '@hourly': { alias: '0 * * * *', label: 'Every hour' },
    '@midnight': { alias: '0 0 * * *', label: 'Every day on midnight' },
    '@monthly': { alias: '0 0 1 * *', label: 'Every month' },
    '@weekly': { alias: '0 0 * * 0', label: 'Every week' },
    '@yearly': { alias: '0 0 1 1 *', label: 'Every year' },
  },
};

function createEditorContext() {
  let input: HTMLInputElement | undefined;

  function ref(el: HTMLInputElement) {
    input = el;
  }

  const [format, setFormat] = createSignal<ScheduleFormat>('unix');

  const [state, setState] = createSignal<ScheduleState>('incomplete');
  const [tokens, setTokens] = createSignal<string[]>([]);
  const [descriptor, setDescriptor] = createSignal<string>(ScheduleLabel.incomplete);
  const [normal, setNormal] = createSignal<boolean>(true);
  const [errors, setErrors] = createSignal<number[]>([]);
  const [generator, setGenerator] =
    createSignal<Generator<Temporal.PlainDateTime, unknown, unknown>>();

  const [caret, setCaret] = createSignal<number>(-1);
  const [value, setValue] = createSignal<string>('');

  function updateCaret() {
    if (!input) {
      return;
    }

    const { selectionStart } = input;
    const val = value();
    const trimmed = val.trim();

    if (selectionStart === null) {
      return;
    }

    if (trimmed.length === 0 || (trimmed.startsWith('@') && Object.keys(Macros[format()]).length > 0)) {
      setCaret(-1);
      return;
    }

    const textBeforeCaret = val.slice(0, selectionStart);
    const tokensBefore = textBeforeCaret.match(/\S+/g) || [];
    const isAtTrailingSpace = /\s$/.test(textBeforeCaret);

    const currentSectionIdx = isAtTrailingSpace
      ? tokensBefore.length
      : Math.max(0, tokensBefore.length - 1);

    setCaret(currentSectionIdx);
  }

  function onInput(val: string) {
    setValue(val);

    updateCaret();

    const result = Parsers[format()].validate(val);
    setState(result.status);
    setNormal(result.normal);
    setTokens(result.tokens);

    setDescriptor(result.status === 'valid' ? result.descriptor : ScheduleLabel[result.status]);
    setErrors(result.status !== 'valid' ? result.error : []);
    setGenerator(result.status === 'valid' ? result.generator : undefined);
  }

  function onBlur(event: FocusEvent) {
    const target = event.relatedTarget;

    if (!target || !(target instanceof HTMLElement) || !target.dataset.hint) {
      setCaret(-1);
    }
  }

  function onHintSelect(index: number) {
    const matcher = value().matchAll(/\S+/g);
    const tokens = Array.from(matcher, match => ({
      endIndex: match.index + match[0].length,
      startIndex: match.index,
      token: match[0],
    }));

    if (tokens.length <= index || !input) {
      return;
    }

    input.focus();
    input.setSelectionRange(tokens[index].startIndex, tokens[index].endIndex);
  }

  function normalize() {
    const normalized = Parsers[format()].normalize(value());

    setValue(normalized);
    setTokens(normalized.split(' '));
  }

  function updateFormat(format: ScheduleFormat) {
    setFormat(format);

    const result = Parsers[format].validate(value());
    setState(result.status);
    setNormal(result.normal);
    setTokens(result.tokens);

    setDescriptor(result.status === 'valid' ? result.descriptor : ScheduleLabel[result.status]);
    setErrors(result.status !== 'valid' ? result.error : []);
    setGenerator(result.status === 'valid' ? result.generator : undefined);
  }

  return {
    caret,
    descriptor,
    errors,
    format,
    generator,
    normal,
    normalize,
    onBlur,
    onCaretMovement: updateCaret,
    onHintSelect,

    onInput,
    ref,

    setFormat: updateFormat,
    setValue,
    state,
    tokens,

    value,
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
