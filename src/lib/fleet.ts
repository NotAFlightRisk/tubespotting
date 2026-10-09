import { layouts } from './layout.js';
import { locate, measureRuns, schedule, type Leg, type Placement } from './motion.js';
import { distance } from './network.js';
import type { Snapshot, TrainReading } from './types.js';

export interface Tracked {
  key: string;
  reading: TrainReading;
  legs: Leg[];
  shown: Placement;
  opacity: number;
  gone: boolean;
}

// a nameless train that's moved further than this between readings is someone else
const SAME_TRAIN_METRES = 1000;
const SETTLE_SECONDS = 0.6;
const FADE_SECONDS = 0.8;
const SNAP_METRES = 3000;
const HOLD_METRES = 400;

const turn = (from: number, to: number, k: number) => {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * k;
};

function blend(shown: Placement, target: Placement, k: number): Placement {
  const gap = distance(shown, target);
  if (gap > SNAP_METRES) return target;
  // a reading that puts the train a little behind where it's drawn means wait, not reverse
  const ahead =
    (target.x - shown.x) * Math.cos(shown.angle) + (target.y - shown.y) * Math.sin(shown.angle);
  const sameWay = Math.cos(target.angle - shown.angle) > 0;
  if (ahead < 0 && sameWay && gap < HOLD_METRES) return { ...shown, at: target.at };
  return {
    x: shown.x + (target.x - shown.x) * k,
    y: shown.y + (target.y - shown.y) * k,
    ox: shown.ox + (target.ox - shown.ox) * k,
    oy: shown.oy + (target.oy - shown.oy) * k,
    angle: turn(shown.angle, target.angle, k),
    at: target.at,
    between: target.between,
    f: target.f
  };
}

let serial = 0;

/** Keeps every train on screen between readings, and the nameless ones matched up across them */
export class Fleet {
  trains = new Map<string, Tracked>();
  #layout = layouts.geographic;

  update(snapshot: Snapshot, now = Date.now()) {
    const runs = measureRuns(snapshot.trains);
    const incoming = snapshot.trains.map((reading) => {
      const legs = schedule(reading, snapshot.at, runs);
      const target = locate(reading.line, legs, reading.stops[0][0], now / 1000, this.#layout);
      return { reading, legs, target };
    });
    const next = new Map<string, Tracked>();
    // a train that's still fading out can be picked back up if it turns up again
    const old = new Map(this.trains);
    const keep = (key: string, item: (typeof incoming)[number], before?: Tracked) => {
      old.delete(key);
      next.set(key, {
        key,
        reading: item.reading,
        legs: item.legs,
        shown: before?.shown ?? item.target,
        opacity: Math.max(0, before?.opacity ?? 0),
        gone: false
      });
    };

    for (const item of incoming) {
      if (item.reading.id) keep(item.reading.id, item, old.get(item.reading.id));
    }

    const nameless = incoming.filter((item) => !item.reading.id);
    const pairs = nameless.flatMap((item) =>
      [...old.values()]
        .filter(
          (train) =>
            !train.reading.id &&
            train.reading.line === item.reading.line &&
            train.reading.to === item.reading.to &&
            Math.cos(train.shown.angle - item.target.angle) > -0.2
        )
        .map((train) => ({ item, train, metres: distance(train.shown, item.target) }))
        .filter((p) => p.metres < SAME_TRAIN_METRES)
    );
    const placed = new Set<(typeof incoming)[number]>();
    for (const { item, train } of pairs.sort((a, b) => a.metres - b.metres)) {
      if (placed.has(item) || !old.has(train.key)) continue;
      placed.add(item);
      keep(train.key, item, train);
    }
    for (const item of nameless) if (!placed.has(item)) keep(`anon:${++serial}`, item);

    for (const [key, train] of old) next.set(key, { ...train, gone: true });
    this.trains = next;
  }

  /** Moves everything on by `dt` seconds, settling into the latest reading rather than jumping */
  step(now: number, dt: number, layout = layouts.geographic) {
    // a map that's changing under the trains carries them with it
    const moved = layout !== this.#layout;
    this.#layout = layout;
    const k = 1 - Math.exp(-dt / SETTLE_SECONDS);
    for (const [key, train] of this.trains) {
      if (train.gone) {
        train.opacity -= dt / FADE_SECONDS;
        if (train.opacity <= 0) this.trains.delete(key);
        continue;
      }
      const { line, stops } = train.reading;
      const target = locate(line, train.legs, stops[0][0], now / 1000, layout);
      train.shown = moved ? target : blend(train.shown, target, k);
      train.opacity = Math.min(1, train.opacity + dt / FADE_SECONDS);
    }
  }
}
