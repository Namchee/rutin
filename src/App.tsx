import { type Component, createSignal } from 'solid-js';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TextField, TextFieldInput } from '@/components/ui/TextField';
import { GithubIcon } from './components/icons/Github';
import { HeartIcon } from './components/icons/Heart';
import { NamcheeIcon } from './components/icons/Namchee';
import { SolidJsIcon } from './components/icons/Solid';
import { ScheduleHint } from './components/ScheduleHint';
import type { ScheduleFormat } from './types';

const Placeholders = {
  cron: '* * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
};

const App: Component = () => {
  const [format, setFormat] = createSignal<ScheduleFormat>('cron');
  const [value, setValue] = createSignal('');

  return (
    <div class="flex-1 max-w-3xl font-sans w-full mx-auto pt-24 flex flex-col items-center rounded-md p-4">
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

        <TextField class="mt-8 w-full">
          <TextFieldInput
            class="font-mono text-2xl text-center h-16 w-full"
            value={value()}
            onInput={e => setValue(e.currentTarget.value)}
            placeholder={Placeholders[format()]}
          />
        </TextField>

        <ScheduleHint format={format()} index={0} />
      </Tabs>

      <footer class="flex justify-between pt-4 border-t border-border w-full mt-auto text-gray-400 text-sm">
        <div class="flex items-center">
          Made in 2026 with <HeartIcon class="mx-1 w-4 h-4" /> and{' '}
          <a href="https://www.solidjs.com/" target="_blank" rel="noopener noreferrer">
            <SolidJsIcon class="mx-1 w-4 h-4" />
          </a>
          by{' '}
          <a href="https://www.namchee.dev" target="_blank" rel="noopener noreferrer">
            <NamcheeIcon class="mt-[2px] ml-[1px] w-6 h-6 text-gray-500" />
          </a>
        </div>

        <div class="flex items-center">
          <a href="https://www.github.com" target="_blank" rel="noopener noreferrer">
            <GithubIcon class="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
