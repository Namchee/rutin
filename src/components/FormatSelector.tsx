import { For } from 'solid-js';
import type { ScheduleFormat } from '@/types';
import { ChevronRight } from './icons/ChevronRight';
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
    <div class="max-w-full relative">
      <div class="relative  overflow-x-auto mx-auto px-8 no-scrollbar [mask-image:linear-gradient(to_right,black_calc(100%-80px),transparent_100%)]">
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

      <div class="h-full absolute flex items-center justify-end top-0 right-0 w-20">
        <ChevronRight class="w-4 h-4 mr-2" />
      </div>
    </div>
  );
}
