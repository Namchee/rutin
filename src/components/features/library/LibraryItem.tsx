import { TooltipTrigger } from '@ark-ui/solid';
import { createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { Temporal } from 'temporal-polyfill';
import { Tooltip, TooltipContent } from '@/components/ui/Tooltip';
import { Hints } from '@/const/schedule';
import { cn } from '@/lib/css';
import { Parsers } from '@/lib/parsers';
import { formatDateTime, formatRelativeTime } from '@/lib/temporal';
import type { LibraryTemplate } from '@/types/library';
import type { FieldName, Token, TokenMap } from '@/types/schedule';
import { useLibraryContext } from './context';

interface LibraryItemProps {
  template: LibraryTemplate;
}

function getToken(raw: string[], index: number): Token | undefined {
  const value = raw[index];
  if (value === undefined) {
    return undefined;
  }

  const start = raw.slice(0, index).join(' ').length + (index > 0 ? 1 : 0);

  return {
    position: [start, start + value.length],
    value,
  };
}

export function LibraryItem({ template }: Readonly<LibraryItemProps>) {
  const { format } = useLibraryContext();

  const [copied, setCopied] = createSignal<boolean>(false);
  const [timeoutRef, setTimeoutRef] = createSignal<ReturnType<typeof setTimeout> | undefined>();

  const syntax = createMemo(() => {
    const rawTokens = template.syntax.split(' ');
    const tokens: TokenMap = {
      dayOfMonth: getToken(rawTokens, 2),
      dayOfWeek: getToken(rawTokens, 4),
      hour: getToken(rawTokens, 1),
      minute: getToken(rawTokens, 0),
      month: getToken(rawTokens, 3),
    };

    return Parsers[format()].convert(tokens, template.syntax, 'unix');
  });

  const fields = createMemo(() => {
    const hints = Hints[format()];

    return Object.entries(syntax().tokens)
      .filter((entry): entry is [FieldName, Token] => entry[1] !== undefined)
      .sort(([, a], [, b]) => a.position[0] - b.position[0])
      .map(([field, token]) => ({
        hint: hints.find(hint => hint.field === field)?.label,
        value: token.value,
      }));
  });

  const next = createMemo(() => {
    const result = Parsers.unix.process(template.syntax);

    if (result.status !== 'valid') {
      return null;
    }

    const iteration = result.generator.next();

    return iteration.done ? null : iteration.value;
  });

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(syntax().value);
    } catch {
      return;
    }

    setCopied(true);

    setTimeoutRef(
      setTimeout(() => {
        setCopied(false);
      }, 2_500),
    );
  }

  onCleanup(() => {
    const ref = timeoutRef();

    if (ref) {
      clearTimeout(ref);
    }
  });

  return (
    <div class="flex flex-col divide-y divide-separator rounded-md border border-md border-separator">
      <div class="flex flex-1 flex-col gap-2 p-4">
        <div class="flex items-center gap-1">
          {fields().map(field => (
            <Tooltip>
              <TooltipTrigger class="inline w-fit rounded-md border border-separator bg-background px-1.5 py-0.5 font-mono">
                {field.value}
              </TooltipTrigger>

              <TooltipContent>{field.hint ?? 'Field'}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <p class="font-medium text-content-secondary text-sm">{template.label}</p>

        <p class="text-content-tertiary text-xs">{template.description}</p>
      </div>

      <div class="flex items-center justify-between gap-2 bg-background px-4 py-3">
        <div class='max-w-full flex-1 overflow-hidden'>
          <Show when={next()}>
            {date => (
              <div class="flex gap-1 truncate text-xs">
                <p class="font-medium font-mono text-content-secondary uppercase">Next</p>

                <span class="text-content-tertiary">&middot;</span>

                <Tooltip>
                  <TooltipTrigger class="text-content-secondary">
                    {formatDateTime(date())}
                  </TooltipTrigger>

                  <TooltipContent>
                    {formatRelativeTime(Temporal.Now.plainDateTimeISO(), date())}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </Show>
        </div>

        <div class="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              class="grid size-6 place-items-center rounded-md rounded-md transition-colors enabled:cursor-pointer enabled:focus-visible:bg-background-hover enabled:hover:bg-background-hover"
              onClick={onCopy}
              disabled={copied()}>
              <div
                class={cn('size-3', {
                  'i-lucide-check': copied(),
                  'i-lucide-copy': !copied(),
                })}
              />
            </TooltipTrigger>

            <TooltipContent>Copy</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <a
                href={`/?q=${template.syntax}&dialect=${format()}`}
                class="grid size-6 place-items-center rounded-md transition-colors hover:bg-background-hover focus-visible:bg-background-hover">
                <div class="i-lucide-square-pen size-3 text-content-secondary" />
              </a>
            </TooltipTrigger>

            <TooltipContent>Use in Editor</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
