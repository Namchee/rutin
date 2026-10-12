import { Title } from '@solidjs/meta';
import { For } from 'solid-js';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';

type ExpressionCategory = 'all' | 'hourly' | 'daily' | 'weekly' | 'monthly';

const ExpressionLabel: Record<ExpressionCategory, string> = {
  all: 'All',
  daily: 'Daily',
  hourly: 'Hourly',
  monthly: 'Monthly',
  weekly: 'Weekly',
};

export default function Library() {
  return (
    <>
      <Title>Library | Rutin</Title>

      <div class="flex flex-col gap-8">
        <div class="flex w-full flex-col gap-0">
          <h1 class="font-semibold text-2xl leading-relaxed">Library</h1>
          <p class="text-content-tertiary">
            Find common expressions and use them directly or as template.
          </p>
        </div>

        <div class="flex justify-between gap-4 max-md:flex-col md:items-center">
          <div class="relative">
            <div class="i-lucide-search pointer-events-none absolute top-2.75 left-3 size-4 text-content-secondary" />
            <input
              placeholder="Describe a schedule..."
              class="w-96 rounded-md border border-separator py-2.5 pr-4 pl-9 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-content-tertiary/25"
            />
          </div>

          <ToggleGroup class='max-md:justify-start'>
            <For each={Object.entries(ExpressionLabel)}>
              {([key, value]) => (
                <ToggleGroupItem
                  value={key}
                  class='h-fit rounded-full border border-separator px-3 py-1.5 text-sm data-[state=on]:bg-background-hover'>
                  {value}
                </ToggleGroupItem>
              )}
            </For>
          </ToggleGroup>
        </div>
      </div>
    </>
  );
}
