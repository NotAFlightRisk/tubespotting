import { stations } from './network.js';
import type { Tracked } from './fleet.js';

export type Tone = 'good' | 'warn' | 'bad' | 'closed';

const BAD = new Set([1, 2, 3, 4, 5, 6, 11, 16]);
const GOOD = new Set([10, 18, 19]);

/** TfL's severity codes, boiled down to how worried you should be */
export const tone = (severity: number): Tone =>
  GOOD.has(severity) ? 'good' : severity === 20 ? 'closed' : BAD.has(severity) ? 'bad' : 'warn';

export const minutes = (seconds: number) =>
  seconds < 30 ? 'Due' : `${Math.max(1, Math.round(seconds / 60))} min`;

/** Where the map has the train right now, in words, so the sheet and the map agree */
export function whereIs({ legs, reading }: Tracked, now: number): string {
  const t = now / 1000;
  const leg = legs.find((l) => t < l.arrive);
  const name = (index: number) => stations[index].name;
  if (!leg) return `At ${name(legs.at(-1)?.to ?? reading.stops[0][0])}`;
  if (t < leg.depart) return `At ${name(leg.from)}`;
  const progress = (t - leg.depart) / (leg.arrive - leg.depart);
  return progress > 0.8
    ? `Approaching ${name(leg.to)}`
    : `Between ${name(leg.from)} and ${name(leg.to)}`;
}

export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
