import type { LineId } from './lines.js';
import {
  distance,
  lineGraph,
  pathBetween,
  runTime,
  stations,
  strand,
  type Point
} from './network.js';
import type { TrainReading } from './types.js';

/** One hop between calls, in epoch seconds */
export interface Leg {
  from: number;
  to: number;
  depart: number;
  arrive: number;
}

export interface Placement extends Point {
  /** Sideways nudge onto the line's own strand, in strand widths, applied in screen space */
  ox: number;
  oy: number;
  angle: number;
  /** Set while the train is stood at a station */
  at: number | null;
  /** The neighbouring stations either side of it, and how far along between them */
  between: [number, number];
  f: number;
}

/** Live run times keyed `line:from>to`, measured off every train's own ETAs */
export type Runs = Map<string, number>;

const dwellFor = (gap: number) => Math.min(30, gap * 0.3);
const MIN_RUN = 5;

export function measureRuns(trains: TrainReading[]): Runs {
  const gaps = new Map<string, number[]>();
  for (const train of trains) {
    for (let i = 1; i < train.stops.length; i++) {
      const key = `${train.line}:${train.stops[i - 1][0]}>${train.stops[i][0]}`;
      const gap = train.stops[i][1] - train.stops[i - 1][1];
      if (gap > 20) gaps.set(key, [...(gaps.get(key) ?? []), gap]);
    }
  }
  return new Map(
    [...gaps].map(([key, values]) => [key, values.sort((a, b) => a - b)[values.length >> 1]])
  );
}

/** The neighbour a train must be coming from, given where it's off to next */
function approachTo(line: LineId, first: number, ahead: number | undefined): number | null {
  const around = [...(lineGraph.get(line)?.get(first) ?? [])];
  if (around.length < 2 || ahead === undefined) return around.length === 1 ? around[0] : null;
  const next = pathBetween(line, first, ahead)?.[1];
  if (next === undefined) return null;
  const here = stations[first];
  const out = { x: stations[next].x - here.x, y: stations[next].y - here.y };
  const straightness = (n: number) => {
    const back = { x: here.x - stations[n].x, y: here.y - stations[n].y };
    return (
      (back.x * out.x + back.y * out.y) / (Math.hypot(back.x, back.y) * Math.hypot(out.x, out.y))
    );
  };
  return (
    around.filter((n) => n !== next).sort((a, b) => straightness(b) - straightness(a))[0] ?? null
  );
}

/** When the train leaves and reaches each call, from TfL's arrival estimates */
export function schedule(train: TrainReading, at: number, runs: Runs = new Map()): Leg[] {
  const start = at / 1000;
  const [first, firstEta] = train.stops[0];
  const legs: Leg[] = [];
  const standing = /^At /i.test(train.where);
  const known = train.from !== null && pathBetween(train.line, train.from, first) !== null;
  const before =
    train.from === first
      ? null
      : known
        ? train.from
        : approachTo(train.line, first, train.stops[1]?.[0] ?? train.dest ?? undefined);
  if (before !== null) {
    const live = runs.get(`${train.line}:${before}>${first}`);
    const run = live ? live - dwellFor(live) : runTime(train.line, before, first);
    const arrive = start + firstEta;
    // TfL saying it's still at the platform beats an ETA that says it's long gone
    const depart =
      standing && before === train.from
        ? Math.min(Math.max(arrive - run, start), arrive - MIN_RUN)
        : arrive - run;
    legs.push({ from: before, to: first, depart, arrive });
  }
  for (let i = 1; i < train.stops.length; i++) {
    const [from, leaves] = train.stops[i - 1];
    const [to, arrives] = train.stops[i];
    legs.push({
      from,
      to,
      depart: start + leaves + dwellFor(arrives - leaves),
      arrive: start + arrives
    });
  }
  return legs;
}

const ease = (f: number) => 0.5 - 0.5 * Math.cos(Math.PI * f);

function along(line: LineId, path: number[], fraction: number): Placement {
  let total = 0;
  const lengths = path.slice(1).map((stop, i) => {
    const length = distance(stations[path[i]], stations[stop]);
    total += length;
    return length;
  });
  let left = fraction * total;
  for (let i = 0; i < lengths.length; i++) {
    if (left > lengths[i] && i < lengths.length - 1) {
      left -= lengths[i];
      continue;
    }
    const [a, b] = [stations[path[i]], stations[path[i + 1]]];
    const f = lengths[i] ? Math.min(1, left / lengths[i]) : 0;
    const { slot, normal } = strand(path[i], path[i + 1], line);
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      ox: normal.x * slot,
      oy: normal.y * slot,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      at: null,
      between: [path[i], path[i + 1]],
      f
    };
  }
  return standing(line, path[0], path[0]);
}

function standing(line: LineId, station: number, towards: number): Placement {
  const path = pathBetween(line, station, towards);
  const next = path?.[1];
  if (next === undefined) {
    return {
      ...pointOf(station),
      ox: 0,
      oy: 0,
      angle: 0,
      at: station,
      between: [station, station],
      f: 0
    };
  }
  return { ...along(line, [station, next], 0), at: station };
}

const pointOf = (index: number): Point => ({ x: stations[index].x, y: stations[index].y });

/** Where a train is at time `t` (epoch seconds), assuming it keeps to TfL's estimates */
export function locate(line: LineId, legs: Leg[], fallback: number, t: number): Placement {
  const leg = legs.find((l) => t < l.arrive) ?? legs.at(-1);
  if (!leg) return standing(line, fallback, fallback);
  if (t < leg.depart) return standing(line, leg.from, leg.to);
  const path = pathBetween(line, leg.from, leg.to) ?? [leg.from, leg.to];
  const progress = Math.min(1, (t - leg.depart) / Math.max(leg.arrive - leg.depart, MIN_RUN));
  return { ...along(line, path, ease(progress)), at: progress === 1 ? leg.to : null };
}
