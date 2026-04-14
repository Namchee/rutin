import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useRutinContext } from '@/context';
import type { Format, ScheduleFormat } from '@/types';

const FormatLabel: Record<ScheduleFormat, Format> = {
  posix: {
    label: 'POSIX',
    description:
      'Standard CRON implementation on UNIX operating system via crontab. Also known as Vixie CRON.',
  },
  quartz: {
    label: 'Quartz',
    description:
      'Richly-featured scheduling system commonly implemented in Java-based applications.',
  },
  systemd: {
    label: 'Systemd',
    description:
      'Scheduling system integrated by systemd which is commonly found in Linux systems.',
  },
  'cf-workers': {
    label: 'Cloudflare Workers',
    description: 'CRON-like scheduling system used exclusively by Cloudflare Workers.',
  },
  cloudwatch: {
    label: 'Amazon Cloudwatch',
    description: 'CRON-like scheduling system used exclusively by Amazon Cloudwatch.',
  },
};

export function FormatSelector() {
  const [{ format }, { setFormat }] = useRutinContext();

  return (
    <Select
      value={format()}
      onChange={setFormat}
      options={Object.keys(FormatLabel)}
      placeholder="Select schedule format..."
      placement="bottom-start"
      itemComponent={props => (
        <SelectItem item={props.item} class="max-w-xs transition-colors">
          <p class="font-medium">{FormatLabel[props.item.rawValue].label}</p>

          <p class="text-xs opacity-70 mt-1">{FormatLabel[props.item.rawValue].description}</p>
        </SelectItem>
      )}>
      <SelectTrigger
        aria-label="Dialect"
        class="w-56 focus:ring-accent focus:ring-offset-0 transition-shadow">
        <div class="flex items-center gap-2">
          <div class="i-lucide-code-2 size-4" />
          <SelectValue<string>>
            {state => FormatLabel[state.selectedOption() as ScheduleFormat].label}
          </SelectValue>
        </div>
      </SelectTrigger>

      <SelectContent class="border-border" />
    </Select>
  );
}
