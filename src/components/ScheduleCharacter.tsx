import type { ScheduleFormat } from '@/types';

interface ScheduleFormatProps {
  format: ScheduleFormat;
  index: number;
}

export function ScheduleCharacter(props: Readonly<ScheduleFormatProps>) {
  return <div></div>;
}
