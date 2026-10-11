import { Title } from '@solidjs/meta';

export default function Library() {
  return (
    <>
      <Title>Library | Rutin</Title>

      <div class="flex flex-col gap-8">
        <div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div class="flex w-full flex-col gap-0">
            <h1 class="font-semibold text-2xl leading-relaxed">Library</h1>
            <p class="text-content-tertiary">
              Find common expressions and use them directly or as template.
            </p>
          </div>

          <div class="relative">
            <div class="i-lucide-search pointer-events-none absolute top-2.75 left-3 size-4 text-content-secondary" />
            <input
              placeholder="Describe a schedule..."
              class='w-80 rounded-md border border-separator py-2.5 pr-4 pl-9 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-content-tertiary/25'
            />
          </div>
        </div>
      </div>
    </>
  );
}
