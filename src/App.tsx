import { Tooltip } from '@kobalte/core/tooltip';
import { type Component, createComputed, createSignal, type JSX } from 'solid-js';

import { AlertIcon } from '@/components/icons/Alert';
import { BranchIcon } from '@/components/icons/Branch';
import { GithubIcon } from '@/components/icons/Github';
import { HeartIcon } from '@/components/icons/Heart';
import { NamcheeIcon } from '@/components/icons/Namchee';
import { SolidJsIcon } from '@/components/icons/Solid';
import { WrenchIcon } from '@/components/icons/Wrench';
import { ScheduleHint } from '@/components/ScheduleHint';
import { ScheduleNext } from '@/components/ScheduleNext';
import { ScheduleSyntax } from '@/components/ScheduleSyntax';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TextField, TextFieldInput } from '@/components/ui/TextField';
import { TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import type { ScheduleFormat } from '@/types';

const Placeholders = {
  unix: '* * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
};

const App: Component = () => {
  let input!: HTMLInputElement;

  const [format, setFormat] = createSignal<ScheduleFormat>('unix');
  const [isNonStandard, setNonStandard] = createSignal(true);
  const [value, setValue] = createSignal('');
  const [filled, setFilled] = createSignal<[number, number][]>([]);

  const [caret, setCaret] = createSignal(-1);

  const [descriptor, setDescriptor] = createSignal(
    'At minute 30 past every hour from 22 through 23 and every hour from 0 through 2 on every day-of-week from Monday through Friday.',
  );

  const updateFilledPosition = (value: string) => {
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

  const onInput: JSX.EventHandler<HTMLInputElement, InputEvent> = event => {
    setValue(event.currentTarget.value);
    updateFilledPosition(event.currentTarget.value);
    updateCaretIndex(event.currentTarget);
  };

  const onCaretMovement: JSX.EventHandler<HTMLInputElement, Event> = event => {
    updateCaretIndex(event.currentTarget);
  };

  const onHintSelect = (idx: number) => {
    const pos = [];
  };

  return (
    <div class="flex-1 max-w-3xl font-sans w-full mx-auto pt-16 md:pt-24 pb-8 flex flex-col items-center rounded-md p-4">
      <Tabs value={format()} onChange={setFormat} class="flex flex-col w-full flex-1">
        <TabsList class="relative rounded-full mx-auto">
          <TabsTrigger value="unix" class="rounded-full cursor-pointer">
            UNIX
          </TabsTrigger>
          <TabsTrigger value="quartz" class="rounded-full cursor-pointer">
            Quartz
          </TabsTrigger>
          <TabsTrigger value="systemd" class="rounded-full cursor-pointer">
            Systemd
          </TabsTrigger>
          <TabsTrigger value="human" class="rounded-full cursor-pointer hidden">
            Human*
          </TabsTrigger>
        </TabsList>

        <div style={{ 'margin-top': '32px' }}>
          <div class="text-xl grid place-items-center mb-4 text-balance line-clamp-2 h-[56px]">
            <p class="text-center">{descriptor()}</p>
          </div>

          <TextField class="w-full relative">
            <TextFieldInput
              class="font-mono text-2xl h-16 w-full text-center"
              value={value()}
              onInput={onInput}
              onSelect={onCaretMovement}
              onKeyUp={onCaretMovement}
              onClick={onCaretMovement}
              onBlur={() => setCaret(-1)}
              spellcheck={false}
              placeholder={Placeholders[format()]}
              autocomplete="off"
            />

            {isNonStandard() && (
              <Tooltip placement="top" gutter={4}>
                <TooltipTrigger class="w-fit absolute top-4 right-4">
                  <AlertIcon class="w-8 h-8 text-foreground/25" />
                </TooltipTrigger>

                <TooltipContent class="max-w-md">
                  Macros detected. Click 🔧 to normalize.
                </TooltipContent>
              </Tooltip>
            )}
          </TextField>

          <div class="w-full mt-2 relative">
            <ScheduleHint
              format={format()}
              index={caret()}
              filled={filled().map((_, idx) => idx)}
              onHintSelect={onHintSelect}
            />

            <Button
              size="icon"
              disabled={isNonStandard()}
              variant="ghost"
              class="ml-auto rounded-sm w-5 h-5 absolute right-0 top-0 ">
              <WrenchIcon class="w-3! h-3!" />
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 mt-8 gap-8">
            <ScheduleSyntax format={format()} index={caret()} />

            <ScheduleNext />
          </div>
        </div>
      </Tabs>

      <footer
        class="flex flex-col gap-2 items-center w-full mt-auto text-gray-400 text-sm"
        style={{ 'margin-top': '32px' }}>
        <div class="flex items-center">
          Made in 2026 with <HeartIcon class="mx-1 w-4 h-4" /> and{' '}
          <a href="https://www.solidjs.com/" target="_blank" rel="noopener noreferrer">
            <SolidJsIcon class="mx-1 w-4 h-4 opacity-80 transition-opacity hover:opacity-100" />
          </a>
          by{' '}
          <a href="https://www.namchee.dev" target="_blank" rel="noopener noreferrer">
            <NamcheeIcon class="mt-[2px] ml-[1px] w-6 h-6 text-gray-400 transition-colors hover:text-gray-500" />
          </a>
        </div>

        <div class="flex items-center gap-2">
          <span class="font-mono flex items-center gap-1 text-gray-400 hover:text-gray-500 transition-colors">
            <BranchIcon class="w-4 h-4" />
            ffac537
          </span>
          •
          <a
            href="https://github.com/Namchee/rutin"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-gray-500 transition-colors">
            <GithubIcon class="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
