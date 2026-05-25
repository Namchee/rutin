import { FormatSelector } from './FormatSelector';
import { ScheduleTools } from './ScheduleTools';

export function ScheduleMenu() {
  return (
    <div class="fixed z-10 md:bottom-8 bottom-4 border border-border h-12 shadow rounded-xl bg-background flex justify-between pr-2">
      <FormatSelector />

      <div class="h-full border-l border-border mr-12 md:mr-16" />

      <ScheduleTools />
    </div>
  );
}
