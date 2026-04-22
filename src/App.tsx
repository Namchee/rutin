import { type Component, createSignal, type JSX } from 'solid-js';

import { Footer } from '@/components/Footer';
import { FormatSelector } from '@/components/FormatSelector';
import { ScheduleHint } from '@/components/ScheduleHint';
import { ScheduleNext } from '@/components/ScheduleNext';

import { ScheduleSyntax } from '@/components/ScheduleSyntax';
import { TextField, TextFieldInput } from '@/components/ui/TextField';
import { Toaster } from '@/components/ui/Toast';

import type { ScheduleFormat, ScheduleGenerator } from '@/types';
import { ScheduleTools } from './components/ScheduleTools';
import { useRutinContext } from './context';
import { POSIXCron } from './lib/parser/posix';

const Placeholders: Record<ScheduleFormat, string> = {
  posix: '* * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
  'cf-workers': '* * * * *',
  cloudwatch: '* * * * *',
};

const Parsers = {
  posix: POSIXCron,
  quartz: POSIXCron,
  systemd: POSIXCron,
  'cf-workers': POSIXCron,
  cloudwatch: POSIXCron,
};

const App: Component = () => {
  let input!: HTMLInputElement;

  const [{ format }] = useRutinContext();
  const [isNonStandard, setNonStandard] = createSignal(false);
  const [value, setValue] = createSignal('');
  const [filled, setFilled] = createSignal<[number, number][]>([]);

  const [caret, setCaret] = createSignal(-1);

  const [descriptor, setDescriptor] = createSignal('');
  const [expr, setExpr] = createSignal<ScheduleGenerator>();

  const [errors, setErrors] = createSignal<number[]>([]);

  const updateFilledPosition = (value: string) => {
    if (value.startsWith('@')) {
      return;
    }

    const tokens = value.split('');

    const filledTokens: [number, number][] = [];

    let flag = false;
    let start = -1;

    for (let i = 0; i < tokens.length; i++) {
      if (/\s/.test(tokens[i])) {
        if (flag) {
          filledTokens.push([start, i]);
          start = -1;
          flag = false;
        }
      } else {
        if (!flag) {
          flag = true;
          start = i;
        }
      }
    }

    if (flag) {
      filledTokens.push([start, tokens.length]);
    }

    setFilled(filledTokens);
  };

  const updateCaretIndex = (el: HTMLInputElement) => {
    const { value, selectionStart } = el;

    if (selectionStart === null) return;

    if (value.trim().length === 0) {
      setCaret(-1);
      return;
    }

    if (value.trim().startsWith('@')) {
      setCaret(-2);
      return;
    }

    const textBeforeCaret = value.slice(0, selectionStart);
    const tokensBefore = textBeforeCaret.match(/\S+/g) || [];
    const isAtTrailingSpace = /\s$/.test(textBeforeCaret);

    const currentSectionIdx = isAtTrailingSpace
      ? tokensBefore.length
      : Math.max(0, tokensBefore.length - 1);

    setCaret(currentSectionIdx);
  };

  const validateAndParseSchedule = (expr: string) => {
    setDescriptor('');
    setExpr(undefined);

    const parser = Parsers[format()];

    const { error, isComplete } = parser.validate(expr);
    setErrors(error);

    if (error.length > 0 || !isComplete) {
      return;
    }

    setNonStandard(parser.isNonStandard(expr));
    setDescriptor(parser.toString(expr));
    setExpr(parser.iterate(expr, new Date()));
  };

  const normalizeSyntax = () => {
    const parser = Parsers[format()];

    setValue(parser.normalize(value()));
    setNonStandard(false);
  };

  const onInput: JSX.EventHandler<HTMLInputElement, InputEvent> = event => {
    const value = event.currentTarget.value;

    setValue(value);
    updateFilledPosition(value);
    updateCaretIndex(event.currentTarget);

    validateAndParseSchedule(value);
  };

  const onCaretMovement: JSX.EventHandler<HTMLInputElement, Event> = event => {
    updateCaretIndex(event.currentTarget);
  };

  const onHintSelect = (idx: number) => {
    const segments = filled();

    if (idx >= segments.length) {
      return;
    }

    if (input) {
      input.focus();
      input.setSelectionRange(segments[idx][0], segments[idx][1]);
    }
  };

  const onBlur: JSX.EventHandler<HTMLInputElement, FocusEvent> = event => {
    const target = event.relatedTarget;

    if (!target || !(target instanceof HTMLElement) || !target.classList.contains('active-hint')) {
      setCaret(-1);
    }
  };

  return (
    <div class="flex-1 max-w-3xl font-sans w-full mx-auto pt-24 md:pt-32 pb-8 flex flex-col items-center rounded-md">
      <Toaster />

      <div class="w-full flex flex-col gap-8">
        <FormatSelector />

        <div class="flex flex-col gap-2 px-4">
          <div class="flex justify-between">
            <ScheduleTools />
          </div>

          <TextField class="w-full flex items-center">
            <TextFieldInput
              class="font-mono text-xl md:text-2xl h-16 w-full text-center"
              value={value()}
              onInput={onInput}
              onSelect={onCaretMovement}
              onKeyUp={onCaretMovement}
              onClick={onCaretMovement}
              onBlur={onBlur}
              spellcheck={false}
              placeholder={Placeholders[format()]}
              autocomplete="off"
              ref={input}
            />
          </TextField>

          <div class="w-full">
            <ScheduleHint
              format={format()}
              index={caret()}
              filled={filled().map((_, idx) => idx)}
              errors={errors()}
              onHintSelect={onHintSelect}
            />
          </div>
        </div>

        <div class="text-lg md:text-xl grid place-items-center h-[84px]" title={descriptor()}>
          <p class="text-center line-clamp-3 text-balance w-full">{descriptor()}</p>
        </div>

        <div class="md:grid grid-cols-1 md:grid-cols-2 hidden gap-8">
          <ScheduleSyntax format={format()} index={caret()} />

          <ScheduleNext expr={expr()} format={format()} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default App;
