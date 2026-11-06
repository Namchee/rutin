import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { type DisplayType, useLibraryContext } from './context';
import { LibraryDialect } from './LibraryDialect';

export function LibraryHeader() {
  const { display, setDisplay } = useLibraryContext();

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

        <ToggleGroup
          value={[display()]}
          onValueChange={val => {
            if (val.value.length === 0) {
              return;
            }

            setDisplay(val.value[0] as DisplayType);
          }}
          class="gap-0 rounded-md rounded-l-none border-separator border-l">
          <Tooltip>
            <TooltipTrigger>
              <ToggleGroupItem
                value="grid"
                class="size-8 rounded-r-none rounded-l-none border-separator p-0 data-[state=on]:bg-background-hover">
                <div class="i-lucide-layout-grid size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>

            <TooltipContent>Toggle grid view</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <ToggleGroupItem
                value="list"
                class="size-8 rounded-l-none p-0 data-[state=on]:bg-background-hover">
                <div class="i-lucide-layout-list size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>

            <TooltipContent>Toggle list view</TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </div>
  );
}
