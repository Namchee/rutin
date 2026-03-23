import { createSignal } from 'solid-js';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '@/components/ui/Switch';

interface ScheduleNextProps {
  expr?: Generator<Date, void, void>;
}

export function ScheduleNext(props: Readonly<ScheduleNextProps>) {
  const [next, setNext] = createSignal<Date[]>([]);

  return (
    <div class="text-foreground/70 flex flex-col items-center w-full text-sm max-h-md overflow-hidden">
      <p class="h-10 grid place-items-center font-medium text-muted-foreground shrink-0">
        Execution Time
      </p>

      <Switch class="flex gap-2 h-10 items-center mx-auto shrink-0">
        <SwitchLabel class="font-medium">Local Timezone</SwitchLabel>

        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class=" font-medium">UTC</SwitchLabel>
      </Switch>

      <div class="text-muted-foreground mt-4 w-full flex flex-col gap-4 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]">
        {next().length ? (
          next().map(() => (
            <div class="flex items-center justify-between">
              <p>
                {new Date('2024-10-24').toLocaleDateString('en-GB', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })}
              </p>

              <p class="text-balance max-w-12">
                {new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' }).format(5, 'minutes')}
              </p>
            </div>
          ))
        ) : (
          <p>Schedules will appear here when the syntax is valid.</p>
        )}
      </div>
    </div>
  );
}
