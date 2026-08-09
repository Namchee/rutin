import type { ScheduleFormat } from '@/types/schedule';

import { AmazonParser } from './parser/amazon';
import { CloudflareWorkersParser } from './parser/cf-workers';
import { NodeParser } from './parser/node';
import { QuartzParser } from './parser/quartz';
import { SystemdParser } from './parser/systemd';
import type { ScheduleParser } from './parser/types';
import { UNIXParser } from './parser/unix';

export const Parsers: Record<ScheduleFormat, ScheduleParser> = {
  amazon: AmazonParser,
  'cf-workers': CloudflareWorkersParser,
  node: NodeParser,
  quartz: QuartzParser,
  systemd: SystemdParser,
  unix: UNIXParser,
};
