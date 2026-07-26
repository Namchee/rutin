import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/css';
import type { ScheduleFormat } from '@/types';

import { useEditorContext } from './context';

const Hints: Record<ScheduleFormat, string[]> = {
  amazon: ['Minute', 'Hour', 'Date', 'Month', 'Day', 'Year'],
  'cf-workers': ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  node: ['[Second]', 'Minute', 'Hour', 'Date', 'Month', 'Day'],
  posix: ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  quartz: ['[Second]', 'Minute', 'Hour', 'Date', 'Month', 'Day', '[Year]'],
  systemd: ['Day', 'Year-Month-Day', 'Hour:Minute:Second'],
};

export function ScheduleHint() {
  const { format, caret, tokens, errors, onHintSelect } = useEditorContext();

  return (
    <div class="scrollbar-none flex w-full max-w-full gap-2 overflow-x-auto px-4">
      {Hints[format()].map((hint, index) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={tokens().length <= index}
          class={cn(
            'flex h-fit min-w-[21%] flex-shrink-0 flex-col items-center justify-center gap-0 py-1.5 font-mono font-normal lg:min-w-0 lg:flex-1',
            {
              'bg-danger text-danger-foreground dark:bg-danger/50': errors().includes(index),
              'bg-surface-hover': caret() === index,
              'text-content-secondary': !errors().includes(index),
            },
          )}
          data-hint
          onClick={() => onHintSelect(index)}>
          <span
            class={cn('font-medium font-mono text-lg leading-normal', {
              'text-content-primary': !errors().includes(index),
              'text-danger-foreground': errors().includes(index),
            })}>
            {tokens().length <= index ? '-' : tokens()[index]}
          </span>

          <span>{hint}</span>
        </Button>
      ))}
    </div>
  );
}
