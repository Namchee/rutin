import { type Component, createSignal } from 'solid-js';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TextField, TextFieldInput } from '@/components/ui/TextField';
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
    <div class="max-w-3xl font-sans w-full mx-auto mt-24 flex flex-col items-center border border-border rounded-md p-4">
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
    </div>
  );
};

export default App;
