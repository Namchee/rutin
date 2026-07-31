import { A } from '@solidjs/router';

export default function NotFound() {
  return (
    <div class="flex h-full flex-col justify-center">
      <h1 class="font-semibold text-2xl leading-snug tracking-tight">404</h1>

      <p class="text text-content-tertiary text-lg">Yep... you are totally lost.</p>

      <A
        href="/"
        class='group mt-8 inline-flex w-fit items-center gap-1 text-content-secondary text-sm transition-colors hover:text-content-primary'>
        <span>Bring me home</span>{' '}
        <div class="i-lucide-arrow-right size-4 transition-all group-hover:translate-x-1" />
      </A>
    </div>
  );
}
