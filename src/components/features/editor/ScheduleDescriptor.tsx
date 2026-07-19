import { cn } from '@/lib/css';

import { type ScheduleState, useEditorContext } from './context';

const ScheduleLabel: Record<Exclude<ScheduleState, 'valid'>, string> = {
  incomplete: 'Schedule is not complete.',
  invalid: 'There are error(s) in your schedule syntax.',
};

export function ScheduleDescriptor() {
  const { state } = useEditorContext();

  const actualState = state();

  return (
    <div class="flex items-start gap-2 border-separator border-t p-4 text-sm transition-colors">
      <div class="i-lucide-speech mt-[1px] size-4 shrink-0 text-content-tertiary" />

      <div class="flex flex-col gap-2">
        <p class="font-semibold text-content-secondary text-xs uppercase">In plain English</p>

        <p class={cn("leading-relaxed", {
          "text-content-secondary": actualState === 'valid',
          "text-content-tertiary": actualState !== 'valid',
        })}>
          {actualState !== 'valid' ? ScheduleLabel[actualState] : 'Lorem ipsum dolor sit amet, in laborum eiusmod et in proident. Quis excepteur do mollit adipiscing consectetur in voluptate consequat ea sint. Dolore in consectetur laboris in et quis ullamco.'}
        </p>
      </div>
    </div>
  );
}
