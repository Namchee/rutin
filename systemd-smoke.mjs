import { Temporal } from '@js-temporal/polyfill';
import { SystemdParser } from '/home/namchee/workspace/rutin/src/lib/parser/systemd.ts';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');
function firstN(expr, n) {
  const out = [];
  for (const d of SystemdParser.iterate(expr, START)) out.push(d);
  return out.slice(0, n);
}

const cases = [
  ['*-*-* 00:00:00', 'every midnight'],
  ['Mon..Fri 12:00:00', 'weekdays at noon'],
  ['Mon,Fri 09:00:00', 'Mon and Fri at 9am'],
  ['*-02~03 00:00:00', '3rd-last day of Feb'],
  ['*:02/3:00', 'every 3rd minute from :02'],
];
for (const [expr, note] of cases) {
  const v = SystemdParser.process(expr);
  console.log(`${JSON.stringify(expr).padEnd(22)} ${note.padEnd(30)} status=${v.status}`);
  try {
    for (const d of firstN(expr, 2)) console.log('   ', d.toString());
  } catch (e) {
    console.log('   THREW:', e.message);
  }
}
