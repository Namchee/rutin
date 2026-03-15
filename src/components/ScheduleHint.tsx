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

  onHintSelect: (idx: number) => void;
}

export function ScheduleHint(props: Readonly<ScheduleHintProps>) {
  return (
    <div class="text-sm flex justify-center gap-2">
      {Hints[props.format].map((hint, idx) => (
        <button
          type="button"
          onClick={() => props.onHintSelect(idx)}
          class={cn('px-0.5 transition-colors ', {
            'bg-foreground/10 text-foreground': props.index === idx,
            'bg-transparent text-foreground/50 cursor-pointer': props.index !== idx,
          })}>
          {hint}
        </button>
      ))}
    </div>
  );
}
