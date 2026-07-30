import { A } from '@solidjs/router';

export function ComingSoon() {
  return (
    <div class="flex h-full flex-col justify-center gap-4">
      <h1 class="flex items-end gap-1 font-semibold text-5xl tracking-tight md:text-7xl">
        <span>Baking</span>
        <span class="inline-flex -translate-y-1 items-baseline gap-1">
          <span class='![animation-delay:-0.3s] size-2 animate-bounce rounded-full bg-current' />
          <span class='![animation-delay:-0.15s] size-2 animate-bounce rounded-full bg-current' />
          <span class="size-2 animate-bounce rounded-full bg-current" />
        </span>
      </h1>

      <p class="text-2xl text-content-tertiary leading-snug md:text-3xl">
        This feature isn't quite out of the oven yet.
      </p>

      <A
        href="/"
        class="group mt-8 inline-flex w-fit items-center gap-1 text-content-secondary transition-colors hover:text-content-primary">
        <span>Bring me home</span>{' '}
        <div class="i-lucide-arrow-right size-4 transition-all group-hover:translate-x-1" />
      </A>
    </div>
  );
}
