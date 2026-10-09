import { stations } from './network.js';
import type { Tracked } from './fleet.js';
import { locate } from './motion.js';
import type { TrainReading } from './types.js';

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
  const name = (index: number) => stations[index].name;
  const placed = locate(reading.line, legs, reading.stops[0][0], now / 1000);
  const [from, to] = placed.between;
  if (placed.at !== null || from === to) return `At ${name(placed.at ?? from)}`;
  return placed.f > 0.8 ? `Approaching ${name(to)}` : `Between ${name(from)} and ${name(to)}`;
}

/** Coming in to finish at one of these stations, so not a train you can catch there */
export const finishesAt = ({ dest, stops }: TrainReading, here: Set<number>) =>
  dest !== null && dest === stops.at(-1)![0] && here.has(dest);

/** The call a train's heading for, and how many seconds off it is */
export function nextCall({ legs, reading }: Tracked, now: number) {
  const t = now / 1000;
  const leg = legs.find((l) => t < l.arrive);
  return leg
    ? { station: leg.to, seconds: leg.arrive - t }
    : { station: reading.stops.at(-1)![0], seconds: 0 };
}

export const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
