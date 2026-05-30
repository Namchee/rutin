import { FormatSelector } from './FormatSelector';
import { ScheduleTools } from './ScheduleTools';

export function ScheduleMenu() {
  return (
    <div class="fixed bottom-4 z-10 flex h-12 justify-between rounded-lg border border-border bg-background pr-2 shadow md:bottom-8">
      <FormatSelector />

      <div class="mr-12 h-full border-border border-l md:mr-16" />

      <ScheduleTools />
    </div>
  );
}
