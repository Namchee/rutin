import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/css';
import type { FieldName, ScheduleFormat } from '@/types';

import { useEditorContext } from './context';

interface HintEntry {
  field: FieldName;
  label: string;
  /** When true, the field is optional in this dialect; rendered as `[label]`. */
  optional?: boolean;
}

const Hints: Record<ScheduleFormat, HintEntry[]> = {
  amazon: [
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
    { field: 'year', label: 'Year' },
  ],
  'cf-workers': [
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
  ],
  node: [
    { field: 'second', label: 'Second', optional: true },
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
  ],
  quartz: [
    { field: 'second', label: 'Second', optional: true },
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
    { field: 'year', label: 'Year', optional: true },
  ],
  systemd: [
    { field: 'dayOfWeek', label: 'Day' },
    { field: 'date', label: 'Year-Month-Day' },
    { field: 'time', label: 'Hour:Minute:Second' },
  ],
  unix: [
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
  ],
};

export function ScheduleHint() {
  const { format, currentToken, tokens, errors, onHintSelect, value, state } = useEditorContext();

  return (
    <div class="scrollbar-none flex w-full max-w-full gap-2 overflow-x-auto px-4">
      {Hints[format()].map(hint => {
        const tokenValue = tokens()[hint.field];
        const isPresent = tokenValue !== undefined;
        const displayLabel = hint.optional ? `[${hint.label}]` : hint.label;

        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={!isPresent || (state() === 'valid' && value().trim().startsWith('@'))}
            class={cn(
              'flex h-fit min-w-[21%] flex-shrink-0 flex-col items-center justify-center gap-0 py-1.5 font-mono font-normal lg:min-w-0 lg:flex-1',
              {
                'bg-danger text-danger-foreground hover:bg-danger dark:bg-danger/50':
                  errors().includes(hint.field),
                'bg-surface-hover': currentToken() === hint.field && !errors().includes(hint.field),
                'text-content-secondary': !errors().includes(hint.field),
              },
            )}
            data-hint
            onClick={() => onHintSelect(hint.field)}>
            <span
              class={cn('max-w-full truncate font-medium font-mono text-lg leading-normal', {
                'text-content-primary': !errors().includes(hint.field),
                'text-danger-foreground': errors().includes(hint.field),
              })}>
              {tokenValue?.value ?? '-'}
            </span>

            <span>{displayLabel}</span>
          </Button>
        );
      })}
    </div>
  );
}
