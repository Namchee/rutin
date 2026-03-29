import { BranchIcon } from '@/components/icons/Branch';
import { GithubIcon } from '@/components/icons/Github';
import { HeartIcon } from '@/components/icons/Heart';
import { NamcheeIcon } from '@/components/icons/Namchee';
import { SolidJsIcon } from '@/components/icons/Solid';

export function Footer() {
  return (
    <footer class="flex flex-col gap-2 items-center w-full mt-auto text-foreground/50 text-sm mt-8">
      <div class="flex items-center">
        Made in 2026 with <HeartIcon class="mx-1 w-4 h-4" /> and{' '}
        <a href="https://www.solidjs.com/" target="_blank" rel="noopener noreferrer">
          <SolidJsIcon class="mx-1 w-4 h-4 opacity-80 transition-opacity hover:opacity-100" />
        </a>
        by{' '}
        <a href="https://www.namchee.dev" target="_blank" rel="noopener noreferrer">
          <NamcheeIcon class="mt-[2px] ml-[1px] w-6 h-6 text-foreground/50 transition-colors hover:text-foreground/75" />
        </a>
      </div>

      <div class="flex items-center gap-2">
        <a
          href="https://github.com/Namchee/rutin/tree/ffac537"
          class="font-mono flex items-center gap-1 text-foreground/50 hover:text-foreground/75 transition-colors">
          <BranchIcon class="w-4 h-4" />
          ffac537
        </a>
        •
        <a
          href="https://github.com/Namchee/rutin"
          target="_blank"
          rel="noopener noreferrer"
          class="text-foreground/50 hover: text-foreground/75 transition-colors">
          <GithubIcon class="w-4 h-4" />
        </a>
      </div>
    </footer>
  );
}
