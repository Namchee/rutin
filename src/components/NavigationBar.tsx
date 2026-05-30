import { Button } from './ui/Button';

export function NavigationBar() {
  return (
    <nav class="flex hidden h-16 items-center justify-between border-border border-b px-4 md:px-6">
      <a href="/" rel="noopener noreferrer">
        <div class="i-me-logo size-8"></div>
      </a>

      <div class="flex items-center gap-2">
        <div class="rounded-full border border-border shadow-xs">
          <Button variant="ghost" class="size-8 rounded-full p-0">
            <div class="i-lucide-sun size-4" />
          </Button>

          <Button variant="ghost" class="size-8 rounded-full p-0">
            <div class="i-lucide-moon size-4" />
          </Button>

          <Button variant="ghost" class="size-8 rounded-full p-0">
            <div class="i-lucide-monitor size-4" />
          </Button>
        </div>

        <a
          href="https://github.com/Namchee/rutin/tree/ffac537"
          class="flex items-center gap-1 font-mono text-foreground/50 text-sm transition-colors hover:text-foreground/75">
          <div class="i-lucide-git-branch size-4" />
          ffac537
        </a>
      </div>
    </nav>
  );
}
