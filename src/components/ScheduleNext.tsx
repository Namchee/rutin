import { createEffect, createSignal, For, onCleanup } from 'solid-js';

import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '@/components/ui/Switch';
import { cn } from '@/lib/css';

import type { ScheduleFormat, ScheduleGenerator } from '@/types';

interface ScheduleNextProps {
  expr: ScheduleGenerator;
  format: ScheduleFormat;
}

export function ScheduleNext(props: Readonly<ScheduleNextProps>) {
  const [isUtc, setIsUtc] = createSignal(false);
  const [next, setNext] = createSignal<Date[]>([]);

  let anchor!: HTMLDivElement;
  let container!: HTMLDivElement;

  const [observer, setObserver] = createSignal<IntersectionObserver | null>(null);

  const loadNextIteration = (count: number = 10) => {
    if (!props.expr) {
      return;
    }

    const newDates = Array.from(props.expr.take(count));

    // 2. If no new dates, exit
    if (newDates.length === 0) {
      console.warn('No more dates found in expression');
      return;
    }

    setNext(prev => [...prev, ...newDates]);
  };

  const formatRelativeTime = (date: Date): string => {
    const diffInMs = date.getTime() - Date.now();
    const diffInMinutes = Math.round(diffInMs / 60_000);
    const absMinutes = Math.abs(diffInMinutes);

    const THRESHOLDS: Record<string, number> = {
      year: 365 * 24 * 60,
      month: 30 * 24 * 60,
      day: 24 * 60,
      hour: 60,
      minute: 1,
    };

    const formatter = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

    for (const [unit, mins] of Object.entries(THRESHOLDS)) {
      if (absMinutes >= mins || unit === 'minute') {
        const value = Math.round(diffInMs / (mins * 60_000));
        return formatter.format(value, unit as Intl.RelativeTimeFormatUnit);
      }
    }

    return 'Just now';
  };

  createEffect(() => {
    setNext([]);

    if (!props.expr || !anchor || !container) {
      return;
    }

    loadNextIteration(20);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadNextIteration();
          }
        });
      },
      {
        root: container,
      },
    );

    setObserver(observer);

    observer.observe(anchor);
  });

  onCleanup(() => {
    const activeObserver = observer();

    if (activeObserver) {
      activeObserver.disconnect();
    }
  });

  return (
    <div class="text-foreground/70 flex flex-col items-center w-full text-sm h-[450px] overflow-hidden">
      <p class="h-10 grid place-items-center font-medium text-muted-foreground shrink-0">
        Execution Time
      </p>

      <Switch
        class="flex gap-2 h-10 items-center mx-auto shrink-0"
        checked={isUtc()}
        onChange={val => setIsUtc(val)}>
        <SwitchLabel class="font-medium">Local Timezone</SwitchLabel>

        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class=" font-medium">UTC</SwitchLabel>
      </Switch>

      <div
        ref={container}
        class={cn(
          'h-full text-muted-foreground mt-4 w-full overflow-auto no-scrollbar fade-bottom',
          {
            'grid place-items-center': next().length === 0,
            'flex flex-col gap-4': next().length > 0,
          },
        )}>
        <For
          each={next()}
          fallback={
            <p class="text-center text-balance max-w-xs">
              Schedules will appear here when the syntax is valid
            </p>
          }>
          {date => (
            <div class="flex items-center justify-between">
              <p>
                {date.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  ...(isUtc() ? { timeZone: 'UTC' } : {}),
                  ...(props.format !== 'unix' ? { seconds: '2-digit' } : {}),
                })}
              </p>

              <p>{formatRelativeTime(date)}</p>
            </div>
          )}
        </For>

        <div ref={anchor}>yes</div>
      </div>
    </div>
  );
}
