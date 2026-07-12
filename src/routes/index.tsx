import { Title } from '@solidjs/meta';

export default function Home() {
  return (
    <>
      <Title>Editor | Rutin</Title>

      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-0">
          <h1 class="font-semibold text-2xl leading-relaxed">Editor</h1>
          <p class="text-content-tertiary">
            Write, validate, and preview your schedule expression.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[8fr_4fr] lg:gap-8">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col rounded-lg border border-separator">
              <div class="flex items-center justify-between border-separator border-b p-4">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-content-tertiary text-sm">Dialect</p>
                </div>
              </div>

              <div class="flex-1 p-4"></div>
            </div>

            <div class="rounded-lg border border-separator">
              <div class="border-separator border-b p-4">
                <p class="font-medium text-content-tertiary text-sm">Next executions</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="rounded-lg border border-separator">
              <div class="border-separator border-b p-4">
                <p class="font-medium text-content-tertiary text-sm">Field References</p>
              </div>
            </div>

            <div class="rounded-lg border border-separator">
              <div class="border-separator border-b p-4">
                <p class="font-medium text-content-tertiary text-sm">Macros</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
