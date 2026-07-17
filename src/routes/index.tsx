import { Title } from '@solidjs/meta';

import { EditorContextProvider } from '@/components/features/editor/context';

import { ScheduleEditor } from '@/components/features/editor/ScheduleEditor';
import { ScheduleExecutions } from '@/components/features/editor/ScheduleExecutions';
import { ScheduleMacro } from '@/components/features/editor/ScheduleMacro';
import { ScheduleSyntax } from '@/components/features/editor/ScheduleSyntax';

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
              <ScheduleSyntax />

              <ScheduleMacro />
            </div>
          </div>
        </div>
      </EditorContextProvider>
    </>
  );
}
