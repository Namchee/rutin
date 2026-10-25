import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';
import { type DisplayType, useLibraryContext } from './context';
import { LibraryFilter } from './LibraryFilter';

export function LibraryHeader() {
  const { display, setDisplay } = useLibraryContext();

  return (
    <div class="flex items-center justify-between">
      <div class="relative w-full max-w-80">
        <div class="i-lucide-search text pointer-events-none absolute top-2.25 left-3 size-4 -content-secondary" />
        <input
          placeholder="Describe a schedule..."
          class="w-full max-w-80 rounded-md border border-separator py-2 pr-4 pl-9 text-sm transition-shadow focus:border-content-primary focus:outline-none focus:ring-2 focus:ring-content-tertiary/25"
        />
      </div>

      <div class="flex items-center rounded-md border border-separator">
        <LibraryFilter />

        {/*<ToggleGroup
          value={[category()]}
          onValueChange={val => setCategory(val.value[0] as ExpressionCategory)}
          class='hidden flex-wrap justify-start'>
          <For each={Object.entries(ExpressionLabel)}>
            {([key, value]) => (
              <ToggleGroupItem
                value={key}
                class="h-fit rounded-full border border-separator px-3 py-1 text-xs data-[state=on]:bg-background-hover">
                {value}
              </ToggleGroupItem>
            )}
          </For>
        </ToggleGroup>*/}

        <ToggleGroup
          value={[display()]}
          onValueChange={val => setDisplay(val.value[0] as DisplayType)}
          class="gap-0 rounded-md rounded-l-none border-separator border-l">
          <ToggleGroupItem
            value="grid"
            class='size-8 rounded-r-none rounded-l-none border-separator p-0 data-[state=on]:bg-background-hover'>
            <div class="i-lucide-layout-grid size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            class="size-8 rounded-l-none p-0 data-[state=on]:bg-background-hover">
            <div class="i-lucide-layout-list size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
