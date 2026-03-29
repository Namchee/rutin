import { type Component, createSignal, type JSX } from 'solid-js';

import { AlertIcon } from '@/components/icons/Alert';
import { WrenchIcon } from '@/components/icons/Wrench';
import { ScheduleHint } from '@/components/ScheduleHint';
import { ScheduleNext } from '@/components/ScheduleNext';
import { ScheduleSyntax } from '@/components/ScheduleSyntax';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TextField, TextFieldInput } from '@/components/ui/TextField';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import type { Dialect, ScheduleFormat, ScheduleGenerator } from '@/types';
import { CopyIcon } from './components/icons/Copy';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/Select';
import { POSIXCron } from './lib/parser/posix';

const DialectLabel: Record<Dialect, string> = {
  posix: 'POSIX',
  quartz: 'Quartz',
};

const Placeholders = {
  posix: '* * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
};

const Parsers = {
  posix: POSIXCron,
  quartz: POSIXCron,
  systemd: POSIXCron,
};

const App: Component = () => {
  let input!: HTMLInputElement;

  const [format, setFormat] = createSignal<ScheduleFormat>('posix');
  const [isNonStandard, setNonStandard] = createSignal(false);
  const [value, setValue] = createSignal('');
  const [filled, setFilled] = createSignal<[number, number][]>([]);

  const [caret, setCaret] = createSignal(-1);

  const [descriptor, setDescriptor] = createSignal('Every minute');
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

    if (value.startsWith('@')) {
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
    <div class="flex-1 max-w-3xl font-sans w-full mx-auto pt-16 md:pt-24 pb-8 flex flex-col items-center rounded-md p-4">
      <Tabs value={format()} onChange={setFormat} class="flex flex-col w-full flex-1">
        <TabsList class="relative rounded-full mx-auto">
          <TabsTrigger value="posix" class="rounded-full cursor-pointer">
            CRON
          </TabsTrigger>
          <TabsTrigger value="human" class="rounded-full cursor-pointer">
            Human*
          </TabsTrigger>
        </TabsList>

        <div class="mt-8 w-full flex justify-between items-center">
          <div class="text-sm flex items-center gap-2">
            <p>Dialect:</p>

            <Select<Dialect>
              value="posix"
              options={['posix', 'quartz']}
              itemComponent={props => (
                <SelectItem item={props.item}>{DialectLabel[props.item.rawValue]}</SelectItem>
              )}>
              <SelectTrigger aria-label="Dialect" class="w-40 h-8">
                <SelectValue<string>>
                  {state => DialectLabel[state.selectedOption() as Dialect]}
                </SelectValue>
              </SelectTrigger>

              <SelectContent />
            </Select>
          </div>

          <div class="flex gap-2 items-center">
            <Button size="icon" class="w-8 h-8" disabled>
              <CopyIcon />
            </Button>

            <Button size="icon" class="w-8 h-8">
              <WrenchIcon />
            </Button>
          </div>
        </div>

        <div class="mt-2">
          <TextField class="w-full relative">
            <TextFieldInput
              class="font-mono text-2xl h-16 w-full text-center"
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

            {isNonStandard() && (
              <Tooltip placement="top" gutter={4}>
                <TooltipTrigger class="w-fit absolute top-4 right-4" tabIndex={-1}>
                  <AlertIcon class="w-8 h-8 text-foreground/25" />
                </TooltipTrigger>

                <TooltipContent class="max-w-md">
                  Macros detected. Click 🔧 to normalize.
                </TooltipContent>
              </Tooltip>
            )}
          </TextField>

          <div class="w-full mt-2">
            <ScheduleHint
              format={format()}
              index={caret()}
              filled={filled().map((_, idx) => idx)}
              errors={errors()}
              onHintSelect={onHintSelect}
            />
          </div>

          <div class="text-xl grid place-items-center mt-8 h-[56px]">
            <p class="text-center line-clamp-2 text-balance">{descriptor()}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 mt-8 gap-8">
            <ScheduleSyntax format={format()} index={caret()} />

            <ScheduleNext expr={expr()} format={format()} />
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default App;
