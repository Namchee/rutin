import { Title } from '@solidjs/meta';
import { LibraryContextProvider } from '@/components/features/library/context';
import { LibraryHeader } from '@/components/features/library/LibraryHeader';

export default function Library() {
  return (
    <>
      <Title>Library | Rutin</Title>

      <LibraryContextProvider>
        <div class="@container flex flex-col gap-8">
          <div class="flex w-full flex-col gap-0">
            <h1 class="font-semibold text-2xl leading-relaxed">Library</h1>
            <p class="text-content-tertiary">
              Find common expressions and use them directly or as template.
            </p>
          </div>

          <LibraryHeader />
        </div>
      </LibraryContextProvider>
    </>
  );
}
