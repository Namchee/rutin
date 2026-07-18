import type { JSX } from 'solid-js';
import { cn } from '@/lib/css';

export function Code({ class: className, ...props }: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <code {...props} class={cn("rounded-md border border-separator bg-background px-1.5 py-0.5 font-mono text-xs transition-colors", className)} />
  );
}
