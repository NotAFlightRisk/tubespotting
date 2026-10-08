import { stations } from './network.js';
import type { TrainReading } from './types.js';

export type Tone = 'good' | 'warn' | 'bad' | 'closed';

const BAD = new Set([1, 2, 3, 4, 5, 6, 11, 16]);
const GOOD = new Set([10, 18, 19]);

/** TfL's severity codes, boiled down to how worried you should be */
export const tone = (severity: number): Tone =>
  GOOD.has(severity) ? 'good' : severity === 20 ? 'closed' : BAD.has(severity) ? 'bad' : 'warn';

export const minutes = (seconds: number) =>
  seconds < 30 ? 'Due' : `${Math.max(1, Math.round(seconds / 60))} min`;

/** TfL's own words for where a train is, unless they're too vague to help */
export function whereIs(train: TrainReading): string {
  const next = stations[train.stops[0][0]].name;
  if (!train.where || /^At Platform/i.test(train.where)) {
    return train.stops[0][1] < 30 ? `At ${next}` : `On the way to ${next}`;
  }
  return train.where.replace(/\s+Platform\s+\S+$/i, '');
}
