export function LibraryEmpty() {
  return (
    <div class="grid h-full w-full place-items-center">
      <div class="flex flex-col items-center gap-4">
        <div class="grid size-24 place-items-center rounded-full bg-background brightness-97">
          <div class="i-lucide-ghost size-12 text-content-secondary"></div>
        </div>

        <div class='space-y-1 text-center'>
          <p class="font-semibold text-content-secondary">No Expression Found</p>

          <p class="text-content-tertiary text-sm">
            There are no expression that matches your search criteria
          </p>
        </div>
      </div>
    </div>
  );
}
