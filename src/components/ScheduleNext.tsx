import { createSignal, For, onCleanup, onMount } from 'solid-js';

import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '@/components/ui/Switch';
import { cn } from '@/lib/css';
import type { ScheduleGenerator } from '@/types';

interface ScheduleNextProps {
  expr: ScheduleGenerator;
}

export function ScheduleNext(props: Readonly<ScheduleNextProps>) {
  const [isUtc, setIsUtc] = createSignal(false);
  const [next, setNext] = createSignal<Date[]>([]);

  let anchor!: HTMLDivElement;
  const [observer, setObserver] = createSignal<IntersectionObserver | null>(null);

  const loadNextIteration = () => {
    for (let ct = 0; ct < 10; ct++) {
      setNext(prev => [...prev, props.expr?.next().value as Date]);
    }
  };

  onMount(() => {
    console.log(props);

    if (props.expr) {
      for (let ct = 0; ct < 20; ct++) {
        setNext(prev => [...prev, props.expr?.next().value as Date]);
      }
    }

    if (anchor) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadNextIteration();
          }
        });
      });

      setObserver(observer);

      observer.observe(anchor);
    }
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
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })}
              </p>

              <p>
                {new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' }).format(5, 'minutes')}
              </p>
            </div>
          )}
        </For>

        <div ref={anchor}></div>
      </div>
    </div>
  );
}
