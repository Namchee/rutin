import { Button } from './ui/Button';

export function Sidebar() {
  return (
    <div class="border-border border-r p-2 w-64">
      <Button variant="ghost" class="w-full justify-start font-normal text-base">
        Editor
      </Button>

      <Button variant="ghost" class="w-full justify-start">
        Library
      </Button>

      <Button variant="ghost" class="w-full justify-start">
        Saved Items
      </Button>
    </div>
  );
}
