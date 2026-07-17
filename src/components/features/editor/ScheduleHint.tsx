import { Button } from '@/components/ui/Button';
import type { ScheduleFormat } from '@/types';

import { useEditorContext } from './context';

const Hints: Record<ScheduleFormat, string[]> = {
  amazon: ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  'cf-workers': ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  node: ['[Second]', 'Minute', 'Hour', 'Date', 'Day'],
  posix: ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  quartz: ['Second', 'Minute', 'Hour', 'Date', 'Month', 'Day', '[Year]'],
  systemd: ['Day', 'Year-Month-Day', 'Hour:Minute:Second'],
};

export function ScheduleHint() {
  const { tokens, format } = useEditorContext();

  return (
    <div class="flex w-full gap-2">
      {Hints[format()].map(hint => (
        <Button
          variant="ghost"
          size="sm"
          class="flex h-fit flex-1 flex-col items-center justify-center gap-0 py-1.5 font-mono font-normal text-content-tertiary">
          <span class="font-medium font-mono text-content-primary text-lg leading-normal">30</span>

          {hint}
        </Button>
      ))}
    </div>
  );
}
