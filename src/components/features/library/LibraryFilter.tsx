import { Show } from 'solid-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useLibraryContext } from './context';

export function LibraryFilterDrawer() {
  return <div></div>;
}

export function LibraryFilter() {
  const { tags, setTags } = useLibraryContext();
  const isNonMobile = useMediaQuery('(min-width: 768px)');

  return (
    <Show when={isNonMobile} fallback={<LibraryFilterDrawer />}>
      <DropdownMenu positioning={{ placement: 'bottom-end' }}>
        <DropdownMenuTrigger class='flex h-8 cursor-pointer items-center gap-2 rounded-md rounded-r-none border-separator px-3 text-content-secondary text-sm transition-colors hover:bg-background-hover'>
          <div class="i-lucide-tag size-4" />
          <span>{tags()[0]}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuLabel class="font-mono font-normal text-content-tertiary text-xs">
            Tags
          </DropdownMenuLabel>

          <DropdownMenuItem value="cron">all</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Show>
  );
}
