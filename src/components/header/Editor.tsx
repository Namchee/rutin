export function EditorHeader() {
  return (
    <>
      <div class="flex flex-col gap-4">
        <div class="grid size-8 place-items-center rounded-md border border-border shadow">
          <div class="i-lucide-code-2 size-4"></div>
        </div>

        <div>
          <h1 class="font-semibold text-2xl">Editor</h1>

          <p class="text-muted-foreground">
            Create, test, and save schedule expressions in multiple formats.
          </p>
        </div>
      </div>

      <div class="w-full border-border border-t"></div>
    </>
  );
}
