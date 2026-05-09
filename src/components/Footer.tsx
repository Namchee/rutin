export function Footer() {
  return (
    <footer class="hidden md:flex flex-col gap-2 items-center w-full mt-auto text-foreground/50 text-sm mt-8">
      <div class="flex items-center">
        Made in 2026 with <div class="i-lucide-heart mx-1 size-4" /> and{' '}
        <a href="https://www.solidjs.com/" target="_blank" rel="noopener noreferrer">
          <div class="i-me-solid mx-1 size-4 opacity-80 transition-opacity hover:opacity-100" />
        </a>
        by{' '}
        <a href="https://www.namchee.dev" target="_blank" rel="noopener noreferrer">
          <div class="i-me-namchee mt-[2px] ml-[2px] size-6 text-foreground/50 transition-colors hover:text-foreground/75" />
        </a>
      </div>

      <div class="flex items-center gap-2">
        <a
          href="https://github.com/Namchee/rutin/tree/ffac537"
          class="font-mono flex items-center gap-1 text-foreground/50 hover:text-foreground/75 transition-colors">
          <div class="i-lucide-git-branch size-4" />
          ffac537
        </a>
        •
        <a
          href="https://github.com/Namchee/rutin"
          target="_blank"
          rel="noopener noreferrer"
          class="text-foreground/50 hover:text-foreground/75 transition-colors">
          <div class="i-me-github size-4" />
        </a>
      </div>
    </footer>
  );
}
