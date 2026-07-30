import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <div class="flex h-full flex-col justify-center gap-4">
      <h1 class="font-bold text-5xl md:text-7xl">404</h1>

      <p class='text-2xl text-content-tertiary leading-none md:text-3xl'>
        Yep... you are totally lost.
      </p>

      <A href="/" class="mt-8 flex items-center gap-1 text-content-secondary">
        <span>Bring me home</span> <div class="i-lucide-arrow-right size-4" />
      </A>
    </div>
  );
}
