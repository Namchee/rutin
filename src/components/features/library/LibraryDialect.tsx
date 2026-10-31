import { FormatSelector } from '@/components/FormatSelector';
import { FormatLabel } from '@/const/schedule';
import { useLibraryContext } from './context';

export function LibraryDialect() {
  const { format, setFormat } = useLibraryContext();

  return (
    <FormatSelector
      format={format}
      setFormat={setFormat}
      position="end"
      class="w-32 max-w-full truncate rounded-r-none border-0 max-md:w-fit">
      <div class='flex w-full items-center overflow-hidden'>
        <div class="i-lucide-code-xml size-4 shrink-0 text-content-secondary md:mr-2" />
        <span class="truncate max-md:hidden">{FormatLabel[format()].label}</span>
        <div class="i-lucide-chevron-down ml-auto size-3 shrink-0 text-content-tertiary" />
      </div>
    </FormatSelector>
  );
}
