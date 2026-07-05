import { createEffect, createSignal, For, onCleanup } from 'solid-js';

import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '@/components/ui/Switch';
import { cn } from '@/lib/css';
import { formatDate, formatRelativeTime } from '@/lib/date';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { ScheduleFormat, ScheduleGenerator } from '@/types';

interface ScheduleNextProps {
  expr: ScheduleGenerator;
  format: ScheduleFormat;
}

function ScheduleNextMobile() {
  return <></>;
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

    const newDates: Date[] = [];

    for (let ct = 0; ct < count; ct++) {
      const nextExec = props.expr.next();

      if (!nextExec.done) {
        newDates.push(nextExec.value);
      }
    }

    setNext(prev => [...prev, ...newDates]);
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

  const isNonMobile = useMediaQuery('(min-width: 768px)');

  return (
    <Show when={isNonMobile()} fallback={<ScheduleNextMobile />}>
      <div class="hidden h-[450px] w-full flex-col items-center overflow-hidden text-muted-foreground text-sm md:flex">
        <p class="grid h-10 shrink-0 place-items-center font-medium text-muted-foreground">
          Execution Time
        </p>

        <Switch
          class="mx-auto flex h-10 shrink-0 items-center gap-2"
          checked={isUtc()}
          onChange={val => setIsUtc(val)}>
          <SwitchLabel class="font-medium">Local</SwitchLabel>

          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>

          <SwitchLabel class="font-medium">UTC</SwitchLabel>
        </Switch>

        <div
          ref={container}
          class={cn(
            'no-scrollbar mask-b-from-85% mask-b-to-100% mt-4 h-full w-full overflow-auto text-muted-foreground',
            {
              'flex flex-col gap-4': next().length > 0,
              'grid place-items-center': next().length === 0,
            },
          )}>
          <For
            each={next()}
            fallback={
              <p class="max-w-xs text-balance text-center">
                Schedules will appear here when the syntax is valid
              </p>
            }>
            {date => (
              <div class="flex items-center justify-between">
                <p>
                  {formatDate(date, {
                    ...(isUtc() ? { timeZone: 'UTC' } : {}),
                    ...(props.format !== 'posix' ? { seconds: '2-digit' } : {}),
                  })}
                </p>

                <p>{formatRelativeTime(date, new Date())}</p>
              </div>
            )}
          </For>

          <div ref={anchor}></div>
        </div>
      </div>
    </Show>
  );
}
