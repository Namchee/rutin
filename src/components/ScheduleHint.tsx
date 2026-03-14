import { Dynamic } from 'solid-js/web';

import type { ScheduleFormat } from '@/types';

interface ScheduleHintProps {
  format: ScheduleFormat;
  index: number;
}

export function ScheduleHint(props: Readonly<ScheduleHintProps>) {
  const hintMap = {
    unix: UnixCronHint,
    quartz: QuartzCronHint,
    systemd: SystemdHint,
  };

  return <Dynamic component={hintMap[props.format]} index={props.index} />;
}

function UnixCronHint(props: Omit<ScheduleHintProps, 'format'>) {
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

function QuartzCronHint(props: Omit<ScheduleHintProps, 'format'>) {
  return (
    <div class="text-sm flex justify-center text-gray-400 gap-2 mt-2">
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

function SystemdHint(props: Omit<ScheduleHintProps, 'format'>) {
  return (
    <div class="text-sm flex justify-center text-gray-400 gap-2 mt-2">
      <p>Day</p>
      <p>Year-Month-Day</p>
      <p>Hour:Minute:Second</p>
    </div>
  );
}
