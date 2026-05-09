import { FormatSelector } from './FormatSelector';
import { ScheduleTools } from './ScheduleTools';

export function ScheduleMenu() {
  return (
    <div class="fixed md:hidden z-10 bottom-4 border border-border p-2 h-12 shadow rounded-xl bg-background flex justify-between gap-8">
      <FormatSelector />

      <ScheduleTools />
    </div>
  );
}
