import { cn } from '@/lib/css';

import { useEditorContext } from './context';

export function ScheduleDescriptor() {
  const { descriptor, state } = useEditorContext();

  return (
    <div class="flex items-start gap-2 border-separator border-t p-4 text-sm">
      <div class="i-lucide-speech mt-[1px] size-4 shrink-0 text-content-tertiary" />

      <div class="flex flex-col gap-2">
        <p class="font-semibold text-content-secondary text-xs uppercase">In plain English</p>

        <p class={cn("leading-relaxed", {
          "text-content-secondary": state() === 'valid',
          "text-content-tertiary": state() !== 'valid',
        })}>
          {descriptor()}
        </p>
      </div>
    </div>
  );
}
