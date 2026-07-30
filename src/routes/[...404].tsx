import { A } from '@solidjs/router';

export default function NotFound() {
  return (
    <div class="flex h-full flex-col justify-center gap-4">
      <h1 class='font-semibold text-5xl tracking-tight md:text-7xl'>404</h1>

      <p class="text-2xl text-content-tertiary leading-none md:text-3xl">
        Yep... you are totally lost.
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
