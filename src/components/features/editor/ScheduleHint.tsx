import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/css';
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
  const { result, format } = useEditorContext();

  const r = result();
  const errors = r.status === 'invalid' ? r.error : [];

  return (
    <div class="scrollbar-none flex w-full max-w-full gap-2 overflow-x-auto px-4">
      {Hints[format()].map((hint, index) => (
        <Button
          variant="ghost"
          size="sm"
          class={cn(
            'flex h-fit min-w-[21%] flex-shrink-0 flex-col items-center justify-center gap-0 py-1.5 font-mono font-normal lg:min-w-0 lg:flex-1',
            {
              'bg-danger text-danger-foreground dark:bg-danger/50': errors.includes(index),
              'text-content-secondary': !errors.includes(index),
            },
          )}>
          <span class={cn("font-medium font-mono text-lg leading-normal", {
            'text-content-primary': !errors.includes(index),
            'text-danger-foreground': errors.includes(index),
          })}>
            30
          </span>

          <span>{hint}</span>
        </Button>
      ))
      }
    </div>
  );
}
