import { FormatSelector } from './FormatSelector';
import { ScheduleTools } from './ScheduleTools';

export function ScheduleMenu() {
  return (
    <div class="fixed z-10 md:bottom-8 bottom-4 border border-border p-2 h-12 shadow rounded-xl bg-background flex justify-between gap-16">
      <FormatSelector />

      <ScheduleTools />
    </div>
  );
}
