import { Show } from 'solid-js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useLibraryContext } from './context';

function LibraryDialectDrawer() {
  return <></>
}

export function LibraryDialect() {
  const { format, setFormat } = useLibraryContext();
  const isNonMobile = useMediaQuery('(min-width: 768px)');

  return (
    <Show when={isNonMobile} fallback={<LibraryDialectDrawer />}>
      <DropdownMenu positioning={{ placement: 'bottom-end' }}>
        <DropdownMenuTrigger class="flex h-8 cursor-pointer items-center gap-2 rounded-md rounded-r-none border-separator px-3 text-content-secondary text-sm transition-colors hover:bg-background-hover">
          <div class="i-lucide-language size-4" />
          <span>{format()}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem value="cron">CRON</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Show>
  );
}
