import type { JSX } from 'solid-js';
import { cn } from '@/lib/css';

export function Code({ class: className, ...props }: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <code {...props} class={cn("rounded-md border border-separator bg-background px-2 py-1 font-mono text-xs transition-colors", className)} />
  );
}
