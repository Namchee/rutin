import { ToggleGroup, ToggleGroupItem } from './ui/ToggleGroup';

export function ThemeSwitcher() {
  return (
    <ToggleGroup class="h-8 rounded-full inset-shadow bg-background gap-0">
      <ToggleGroupItem value="light" class="size-5 p-0 bg-surface rounded-full">
        <div class="i-lucide-sun size-[14px]" />
      </ToggleGroupItem>

      <ToggleGroupItem value="dark" class="size-5 p-0 bg-surface rounded-full">
        <div class="i-lucide-moon size-[14px]" />
      </ToggleGroupItem>

      <ToggleGroupItem value="system" class="size-5 p-0 bg-surface rounded-full">
        <div class="i-lucide-monitor size-[14px]" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
