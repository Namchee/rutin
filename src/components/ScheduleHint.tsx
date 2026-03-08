import type { ScheduleFormat } from '@/types';

interface ScheduleHintProps {
  format: ScheduleFormat;
  index: number;
}

export function ScheduleHint({ format, index }: Readonly<ScheduleHintProps>) {
  const hintMap = {
    cron: UnixCRONHint,
    quartz: QuartzCRONHint,
    systemd: SystemdHint,
  };

  const Element = hintMap[format];

  return <Element index={index} />;
}

function UnixCRONHint({ index }: Omit<ScheduleHintProps, 'format'>) {
  return (
    <div class="text-sm flex justify-center text-gray-400 gap-2 mt-2">
      <p>Minute</p>
      <p>Hour</p>
      <p>Date</p>
      <p>Month</p>
      <p>Day</p>
    </div>
  );
}

function QuartzCRONHint({ index }: Omit<ScheduleHintProps, 'format'>) {
  return (
    <div class="text-sm flex justify-center text-gray-400 mt-2">
      <p>Seconds</p>
      <p>Minutes</p>
      <p>Hours</p>
      <p>Date</p>
      <p>Month</p>
      <p>Day</p>
      <p>[Year]</p>
    </div>
  );
}

function SystemdHint({ index }: Omit<ScheduleHintProps, 'format'>) {
  return (
    <div class="text-sm flex justify-center text-gray-400 gap-2 mt-2">
      <p>Day</p>
      <p>Year-Month-Day</p>
      <p>Hour:Minute:Second</p>
    </div>
  );
}
