import { type Component, createSignal, type JSX } from 'solid-js';

import { ScheduleHint } from '@/components/ScheduleHint';
import { ScheduleNext } from '@/components/ScheduleNext';

import { ScheduleSyntax } from '@/components/ScheduleSyntax';
import { TextField, TextFieldInput } from '@/components/ui/TextField';

import type { ScheduleFormat, ScheduleGenerator } from '@/types';
import { NavigationBar } from './components/NavigationBar';
import { ScheduleMenu } from './components/ScheduleMenu';
import { useRutinContext } from './context';
import { cn } from './lib/css';
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
  const [_isNonStandard, setNonStandard] = createSignal(false);
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

  const _normalizeSyntax = () => {
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
    <div class="text-foreground">
      <NavigationBar />

      <div class="flex">
        <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center rounded-md py-8 pt-16 font-sans md:pt-24 xl:pt-32">
          <div class="flex w-full flex-col gap-6 px-4 md:gap-8">
            <div
              class="grid h-[75px] place-items-center text-lg md:text-xl md:[90px]"
              title={descriptor()}>
              <p
                class={cn('line-clamp-3 w-full text-balance text-center', {
                  'text-muted-foreground': descriptor().length === 0 || errors().length > 0,
                })}>
                {descriptor() || <>Human-readable expression will be shown here</>}
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <TextField class="flex w-full items-center">
                <TextFieldInput
                  class="h-16 w-full text-center font-mono text-xl md:text-2xl"
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

            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ScheduleSyntax format={format()} index={caret()} />

              <ScheduleNext expr={expr()} format={format()} />
            </div>
          </div>

          <ScheduleMenu />
        </div>
      </div>
    </div>
  );
};

export default App;
