import type { LibraryTemplate } from '@/types/library';
import { useLibraryContext } from './context';

interface LibraryItemProps {
  template: LibraryTemplate;
}

export function LibraryItem({ template }: Readonly<LibraryItemProps>) {
  const { display } = useLibraryContext();

  return <div class='rounded-md border border-md border-separator'>{template.syntax}</div>;
}
