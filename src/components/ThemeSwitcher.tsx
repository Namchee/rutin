import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';
import { useTheme } from '@/lib/context/theme';

import type { Theme } from '@/types/theme';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      value={[theme()]}
      onValueChange={e => setTheme(e.value[0] as unknown as Theme)}
      class="inset-shadow h-6 gap-[2px] rounded-md border border-separator bg-foreground px-[1px]">
      <ToggleGroupItem value="light" class="size-5 rounded p-0" aria-label="Switch to light theme">
        <div class="i-lucide-sun size-[14px]" />
      </ToggleGroupItem>

      <ToggleGroupItem value="dark" class="size-5 rounded p-0" aria-label="Switch to dark theme">
        <div class="i-lucide-moon size-[14px]" />
      </ToggleGroupItem>

      <ToggleGroupItem value="system" class="size-5 rounded p-0" aria-label="Use system theme">
        <div class="i-lucide-monitor size-[14px]" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
