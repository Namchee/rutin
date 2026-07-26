import { cn } from '@/lib/css';

import { type ScheduleState, useEditorContext } from './context';

const ScheduleLabel: Record<Exclude<ScheduleState, 'valid'>, string> = {
  incomplete: 'Schedule is not complete',
  invalid: 'There are error(s) in your schedule syntax',
};

export function ScheduleDescriptor() {
  const { result } = useEditorContext();

  const r = result();

  return (
    <div class="flex items-start gap-2 border-separator border-t p-4 text-sm">
      <div class="i-lucide-speech mt-[1px] size-4 shrink-0 text-content-tertiary" />

      <div class="flex flex-col gap-2">
        <p class="font-semibold text-content-secondary text-xs uppercase">In plain English</p>

        <p class={cn("leading-relaxed", {
          "text-content-secondary": r.status === 'valid',
          "text-content-tertiary": r.status !== 'valid',
        })}>
          {r.status === 'valid' ? r.descriptor : ScheduleLabel[r.status]}
        </p>
      </div>
    </div>
  );
}
