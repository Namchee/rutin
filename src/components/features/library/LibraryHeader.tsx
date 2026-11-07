import { useLibraryContext } from './context';
import { LibraryDialect } from './LibraryDialect';

export function LibraryHeader() {
  const { query, setQuery } = useLibraryContext();

  return (
    <div class="flex items-center justify-between gap-2">
      <div class="relative w-full max-w-80">
        <div class="i-lucide-search text pointer-events-none absolute top-2.25 left-3 size-4 -content-secondary" />
        <input
          value={query()}
          onInput={e => setQuery(e.currentTarget.value)}
          placeholder="Describe a schedule..."
          class="w-full max-w-80 rounded-md border border-separator py-2 pr-4 pl-9 text-sm transition-shadow focus:border-content-primary focus:outline-none focus:ring-2 focus:ring-content-tertiary/25"
        />
      </div>

      <div class="flex items-center rounded-md border border-separator">
        <LibraryDialect />
      </div>
    </div>
  );
}
