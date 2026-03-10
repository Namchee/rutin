import { type Component, createSignal } from 'solid-js';

import { BranchIcon } from '@/components/icons/Branch';
import { GithubIcon } from '@/components/icons/Github';
import { HeartIcon } from '@/components/icons/Heart';
import { NamcheeIcon } from '@/components/icons/Namchee';
import { SolidJsIcon } from '@/components/icons/Solid';
import { ScheduleHint } from '@/components/ScheduleHint';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TextField, TextFieldInput } from '@/components/ui/TextField';
import type { ScheduleFormat } from '@/types';
import { TriangleAlertIcon } from './components/icons/TriangleAlert';
import { Tooltip, TooltipContent, TooltipTrigger } from './components/ui/Tooltip';

const Placeholders = {
  cron: '* * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
};

const App: Component = () => {
  const [format, setFormat] = createSignal<ScheduleFormat>('cron');
  const [isNonStandard, setNonStandard] = createSignal(true);
  const [value, setValue] = createSignal('');

  return (
    <div class="flex-1 max-w-3xl font-sans w-full mx-auto pt-24 pb-8 flex flex-col items-center rounded-md p-4">
      <Tabs value={format()} onChange={setFormat} class="flex flex-col justify-center w-full">
        <TabsList class="relative rounded-full mx-auto">
          <TabsTrigger value="cron" class="rounded-full cursor-pointer">
            CRON
          </TabsTrigger>
          <TabsTrigger value="quartz" class="rounded-full cursor-pointer">
            Quartz
          </TabsTrigger>
          <TabsTrigger value="systemd" class="rounded-full cursor-pointer">
            Systemd
          </TabsTrigger>
        </TabsList>

        <TextField class="mt-8 w-full relative ">
          <TextFieldInput
            class="font-mono text-2xl h-16 w-full text-center"
            value={value()}
            onInput={e => setValue(e.currentTarget.value)}
            spellcheck={false}
            placeholder={Placeholders[format()]}
            autocomplete="off"
          />

          {isNonStandard() && (
            <Tooltip>
              <TooltipTrigger>
                <TriangleAlertIcon class="absolute right-4 top-4 w-8 h-8 text-yellow-500" />
              </TooltipTrigger>

              <TooltipContent>
                <p>This scheduling value contains a non-standard syntax. Use with caution</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TextField>

        <ScheduleHint format={format()} index={0} />
      </Tabs>

      <footer class="flex flex-col gap-2 items-center w-full mt-auto text-gray-400 text-sm">
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
