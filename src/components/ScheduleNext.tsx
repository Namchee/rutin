import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from './ui/Switch';

export function ScheduleNext() {
  return (
    <div class="text-foreground/70 flex flex-col items-center w-full text-sm max-h-md overflow-hidden">
      <p class="h-10 grid place-items-center font-medium text-muted-foreground shrink-0">
        Execution Time
      </p>

      <Switch class="flex gap-2 h-10 items-center mx-auto mt-1">
        <SwitchLabel class="font-medium">Local Timezone</SwitchLabel>

        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class=" font-medium">UTC</SwitchLabel>
      </Switch>

      <div class="text-muted-foreground mt-4 w-full flex flex-col gap-4 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {Array(20)
          .fill(0)
          .map(() => (
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

              <p>
                {new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' }).format(5, 'minutes')}
              </p>
            </div>
          ))}

        <div></div>
      </div>
    </div>
  );
}
