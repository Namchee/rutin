import { For } from 'solid-js';
import type { ScheduleFormat } from '@/types';
import { TabsList, TabsTrigger } from './ui/Tabs';

const FormatLabel: Record<ScheduleFormat, string> = {
  posix: 'POSIX',
  quartz: 'Quartz',
  systemd: 'Systemd',
  'cf-workers': 'Workers',
  cloudwatch: 'Cloudwatch',
  human: 'Human*',
};

export function FormatSelector() {
  return (
    <div class="max-w-full overflow-x-auto mx-auto px-8 no-scrollbar">
      <TabsList class="rounded-full">
        <For each={Object.entries(FormatLabel)}>
          {([value, label]) => (
            <TabsTrigger value={value} class="rounded-full cursor-pointer">
              {label}
            </TabsTrigger>
          )}
        </For>
      </TabsList>
    </div>
  );
}
