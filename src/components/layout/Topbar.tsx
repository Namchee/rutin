import { A } from '@solidjs/router';

export function Topbar() {
  return (
    <div class=":uno: flex h-12 items-center justify-between p-4">
      <div class=":uno: h-full">
        <button
          type="button"
          class=":uno: grid size-6 cursor-pointer place-items-center rounded transition-hover hover:bg-surface-hover"
          onClick={() => console.log('Hola')}>
          <div class=":uno: i-lucide-panel-left size-4" />
        </button>
      </div>

      <div class=":uno: flex items-center gap-2">
        <button type="button" class=":uno: size-6">
          <div class=":uno: i-lucide-sun size-4" />
        </button>
        <A
          href="https://www.github.com/Namchee/rutin"
          target="_blank"
          rel="noopener noreferrer"
          class=":uno: grid size-6 place-items-center rounded text-content-secondary transition-colors hover:bg-background-hover hover:text-content-primary">
          <div class="i-me-github size-4" />
        </A>
      </div>
    </div>
  );
}
