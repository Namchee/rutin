import { A } from '@solidjs/router';

export function ComingSoon() {
  return (
    <div class="flex h-full flex-col justify-center">
      <h1 class="flex items-end gap-0.5 font-semibold text-2xl leading-snug tracking-tight">
        <span>Baking</span>
        <span class="inline-flex -translate-y-1 items-baseline gap-0.5">
          <span class="![animation-delay:-0.3s] size-1 animate-bounce rounded-full bg-current" />
          <span class="![animation-delay:-0.15s] size-1 animate-bounce rounded-full bg-current" />
          <span class="size-1 animate-bounce rounded-full bg-current" />
        </span>
      </h1>

      <p class='text-content-tertiary text-lg leading-normal'>
        This feature isn't quite out of the oven yet.
      </p>

      <A
        href="/"
        class="group mt-8 inline-flex w-fit items-center gap-1 text-content-secondary text-sm transition-colors hover:text-content-primary">
        <span>Bring me home</span>{' '}
        <div class="i-lucide-arrow-right size-4 transition-all group-hover:translate-x-1" />
      </A>
    </div>
  );
}
