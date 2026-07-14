import { Title } from '@solidjs/meta';

import { FormatSelector } from '@/components/FormatSelector';
import { RutinContextProvider } from '@/context';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <>
      <Title>Editor | Rutin</Title>

      <RutinContextProvider>
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-0">
            <h1 class="font-semibold text-2xl leading-relaxed">Editor</h1>
            <p class="text-content-tertiary">
              Write, validate, and preview your schedule expression.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-[8fr_4fr]">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col rounded-lg border border-separator">
                <div class="flex items-center justify-between border-separator border-b p-4">
                  <div>
                    <FormatSelector />
                  </div>
                </div>

                <div class="flex-1 p-4">
                  <input
                    type="text"
                    class="w-full rounded-lg border border-separator bg-background text-center font-mono text-2xl"
                  />
                </div>

                <div class="flex items-center justify-between border-separator border-t p-4">
                  <div>
                    <Button size="sm">Normalize</Button>
                  </div>

                  <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline">Copy</Button>

                    <Button size="sm" variant="outline">Share</Button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col overflow-hidden rounded-lg border border-separator">
                <div class="border-separator border-b p-4">
                  <p class="font-medium text-content-tertiary text-sm">Next executions</p>
                </div>

                <div class="min-h-40 flex-1"></div>

                <div class="border-separator border-t bg-background p-2 dark:bg-surface">
                  <p class="text-center text-content-tertiary text-xs">
                    Scroll for more executions
                  </p>
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
      </RutinContextProvider>
    </>
  );
}
