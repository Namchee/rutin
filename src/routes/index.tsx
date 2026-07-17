import { Title } from '@solidjs/meta';

import { EditorContextProvider } from '@/components/features/editor/context';

import { ScheduleEditor } from '@/components/features/editor/ScheduleEditor';
import { ScheduleExecutions } from '@/components/features/editor/ScheduleExecutions';

export default function Home() {
  return (
    <>
      <Title>Editor | Rutin</Title>

      <EditorContextProvider>
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-0">
            <h1 class="font-semibold text-2xl leading-relaxed">Editor</h1>
            <p class="text-content-tertiary">
              Write, validate, and preview your schedule expression.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-[8fr_4fr]">
            <div class="flex flex-col gap-4">
              <ScheduleEditor />

              <ScheduleExecutions />
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
      </EditorContextProvider>
    </>
  );
}
