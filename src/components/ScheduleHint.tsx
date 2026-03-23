import { cn } from '@/lib/css';

import type { ScheduleFormat } from '@/types';

const Hints = {
  unix: ['Minute', 'Hour', 'Date', 'Month', 'Day'],
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
    <div class="text-sm flex justify-center gap-2">
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
            'bg-foreground/10 text-foreground': props.index === idx && !props.errors.includes(idx),
            'bg-transparent text-foreground/50': props.index !== idx && !props.errors.includes(idx),
            'cursor-pointer active-hint': props.filled.includes(idx),
            'text-destructive': props.errors.includes(idx),
            'bg-destructive/25': props.errors.includes(idx) && props.index === idx,
            underline: props.filled.includes(idx),
          })}>
          {hint}
        </button>
      ))}
    </div>
  );
}
