import { cn } from '@/lib/css';

import type { ScheduleFormat } from '@/types';

const Hints = {
  'cf-workers': ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  cloudwatch: ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  node: ['[Second]', 'Minute', 'Hour', 'Date', 'Day'],
  posix: ['Minute', 'Hour', 'Date', 'Month', 'Day'],
  quartz: ['Second', 'Minute', 'Hour', 'Date', 'Month', 'Day', '[Year]'],
  systemd: ['Day', 'Year-Month-Day', 'Hour:Minute:Second'],
};

interface ScheduleHintProps {
  format: ScheduleFormat;
  index: number;
  filled: number[];
  errors: number[];

  onHintSelect: (idx: number) => void;
}

export function ScheduleHint(props: Readonly<ScheduleHintProps>) {
  return (
    <div class="flex justify-center gap-2 text-sm">
      {Hints[props.format].map((hint, idx) => (
        <button
          type="button"
          onClick={() => {
            if (props.filled.includes(idx)) {
              props.onHintSelect(idx);
            }
          }}
          disabled={!props.filled.includes(idx)}
          class={cn('px-0.5 transition-colors', {
            'active-hint cursor-pointer': props.filled.includes(idx),
            'bg-destructive/25': props.errors.includes(idx) && props.index === idx,
            'bg-foreground/10 text-foreground': props.index === idx && !props.errors.includes(idx),
            'bg-transparent text-muted-foreground':
              props.index !== idx && !props.errors.includes(idx),
            'text-destructive': props.errors.includes(idx),
            underline: props.filled.includes(idx),
          })}>
          {hint}
        </button>
      ))}
    </div>
  );
}
