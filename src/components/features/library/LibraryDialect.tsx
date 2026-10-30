import { FormatSelector } from '@/components/FormatSelector';
import { FormatLabel } from '@/const/schedule';
import { useLibraryContext } from './context';

export function LibraryDialect() {
  const { format, setFormat } = useLibraryContext();

  return (
    <FormatSelector
      format={format}
      setFormat={setFormat}
      class='w-32 max-w-full truncate rounded-r-none border-y-none border-l-none max-md:w-fit'>
      <div class="flex overflow-hidden">
        <div class="i-lucide-code-xml size-4 shrink-0 text-content-secondary md:mr-2" />
        <span class="truncate max-md:hidden">{FormatLabel[format()].label}</span>
      </div>
    </FormatSelector>
  );
}
