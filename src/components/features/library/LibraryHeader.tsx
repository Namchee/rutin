import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { DisplayType } from './context';
import { LibraryDialect } from './LibraryDialect';

export function LibraryHeader() {
  return (
    <div class="flex items-center justify-between gap-2">
      <div class="relative w-full max-w-80">
        <div class="i-lucide-search text pointer-events-none absolute top-2.25 left-3 size-4 -content-secondary" />
        <input
          placeholder="Describe a schedule..."
          class="w-full max-w-80 rounded-md border border-separator py-2 pr-4 pl-9 text-sm transition-shadow focus:border-content-primary focus:outline-none focus:ring-2 focus:ring-content-tertiary/25"
        />
      </div>

      <div class="flex items-center rounded-md border border-separator">
        <LibraryDialect />
      </div>
    </div>
  );
}
