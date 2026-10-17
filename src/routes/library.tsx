import { Title } from '@solidjs/meta';
import { createSignal, For } from 'solid-js';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';

type ExpressionCategory = 'all' | 'hourly' | 'daily' | 'weekly' | 'monthly';
type DisplayType = 'grid' | 'list';

const ExpressionLabel: Record<ExpressionCategory, string> = {
  all: 'All',
  daily: 'Daily',
  hourly: 'Hourly',
  monthly: 'Monthly',
  weekly: 'Weekly',
};

export default function Library() {
  const [display, setDisplay] = createSignal<DisplayType>('grid');
  return (
    <>
      <Title>Library | Rutin</Title>

      <div class="@container flex flex-col gap-8">
        <div class="flex w-full flex-col gap-0">
          <h1 class="font-semibold text-2xl leading-relaxed">Library</h1>
          <p class="text-content-tertiary">
            Find common expressions and use them directly or as template.
          </p>
        </div>

        <div class="flex @3xl:flex-row @sm:flex-col @3xl:items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="relative">
              <div class="i-lucide-search pointer-events-none absolute top-2.75 left-3 size-4 text-content-secondary" />
              <input
                placeholder="Describe a schedule..."
                class="w-96 rounded-md border border-separator py-2.5 pr-4 pl-9 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-content-tertiary/25"
              />
            </div>

            <ToggleGroup class="justify-start">
              <For each={Object.entries(ExpressionLabel)}>
                {([key, value]) => (
                  <ToggleGroupItem
                    value={key}
                    class="h-fit rounded-full border border-separator px-2 py-0.5 text-xs data-[state=on]:bg-background-hover">
                    {value}
                  </ToggleGroupItem>
                )}
              </For>
            </ToggleGroup>
          </div>

          <ToggleGroup value={[display()]} onValueChange={(val) => setDisplay(val.value[0] as DisplayType)} class="gap-0 rounded-md border border-separator">
            <ToggleGroupItem
              value="grid"
              class="size-8 rounded-r-none border-separator border-r p-0 data-[state=on]:bg-background-hover">
              <div class="i-lucide-layout-grid size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" class="size-8 p-0 data-[state=on]:bg-background-hover">
              <div class="i-lucide-layout-list size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </>
  );
}
