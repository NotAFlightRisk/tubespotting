import { describe, expect, it } from 'vitest';
import { Fleet, type Tracked } from '#lib/fleet.js';
import { layouts } from '#lib/layout.js';
import { locate, schedule } from '#lib/motion.js';
import { distance, stations, type Point } from '#lib/network.js';
import { whereIs } from '#lib/status.js';
import type { Snapshot, TrainReading } from '#lib/types.js';
import { AT, index } from './helpers.js';

const STOCKWELL = index('940GZZLUSKW');
const VAUXHALL = index('940GZZLUVXL');
const PIMLICO = index('940GZZLUPCO');

const train = (overrides: Partial<TrainReading> = {}): TrainReading => ({
  id: 'victoria:201',
  line: 'victoria',
  to: 'Walthamstow Central',
  dest: null,
  where: 'Between Stockwell and Vauxhall',
  from: STOCKWELL,
  stops: [
    [VAUXHALL, 60, 0],
    [PIMLICO, 180, 0]
  ],
  ...overrides
});

const seconds = (offset: number) => AT / 1000 + offset;

const offTrack = (p: Point, shape: Point[]) =>
  Math.min(
    ...shape.slice(1).map((b, i) => {
      const a = shape[i];
      const length = distance(a, b) ** 2 || 1;
      const f = Math.max(
        0,
        Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / length)
      );
      return distance(p, { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
    })
  );

describe('locate', () => {
  it('closes in on the next stop as its arrival time comes round', () => {
    const legs = schedule(train(), AT);
    const gaps = [0, 20, 40, 59].map((t) =>
      distance(locate('victoria', legs, VAUXHALL, seconds(t)), stations[VAUXHALL])
    );
    expect(gaps).toEqual([...gaps].sort((a, b) => b - a));
    expect(gaps[3]).toBeLessThan(gaps[0] / 10);
  });

  it('waits at a station between arriving and leaving', () => {
    const legs = schedule(train(), AT);
    const stood = locate('victoria', legs, VAUXHALL, seconds(65));
    expect(stood.at).toBe(VAUXHALL);
    expect(distance(stood, stations[VAUXHALL])).toBeLessThan(1);
  });

  it('stays at the last stop once the estimates run out', () => {
    const legs = schedule(train(), AT);
    expect(locate('victoria', legs, VAUXHALL, seconds(600)).at).toBe(PIMLICO);
  });

  it("keeps a train at the platform TfL says it's at, even with an ETA that says it left", () => {
    const stood = train({ where: 'At Stockwell Platform 1', stops: [[VAUXHALL, 20, 0]] });
    const placed = locate('victoria', schedule(stood, AT), VAUXHALL, seconds(0));
    expect(distance(placed, stations[STOCKWELL])).toBeLessThan(1);
  });

  it('leaves a train where it is when TfL says it is stood at its next call', () => {
    const stood = train({ where: 'At Vauxhall', from: VAUXHALL, stops: [[VAUXHALL, 40, 0]] });
    expect(locate('victoria', schedule(stood, AT), VAUXHALL, seconds(0)).at).toBe(VAUXHALL);
  });

  it.each(['geographic', 'schematic'] as const)('keeps a train on the %s track', (style) => {
    const layout = layouts[style];
    const placed = locate('victoria', schedule(train(), AT), VAUXHALL, seconds(30), layout);
    expect(placed.at).toBeNull();
    expect(offTrack(placed, layout.shape(...placed.between))).toBeLessThan(1);
  });

  it('works out where a train is coming from when TfL does not say', () => {
    const [first] = schedule(train({ from: null, where: '' }), AT);
    expect(first.from).toBe(STOCKWELL);
  });

  it('starts a train from the end of the line when it is heading back out', () => {
    const BRIXTON = index('940GZZLUBXN');
    const leaving = train({
      from: null,
      where: '',
      stops: [
        [BRIXTON, 60, 0],
        [STOCKWELL, 180, 0]
      ]
    });
    expect(locate('victoria', schedule(leaving, AT), BRIXTON, seconds(0)).at).toBe(BRIXTON);
  });
});

describe('whereIs', () => {
  it('names neighbouring stations even when a leg skips calls', () => {
    const VICTORIA = index('940GZZLUVIC');
    const reading = train({
      stops: [
        [STOCKWELL, 0, 0],
        [VICTORIA, 300, 0]
      ]
    });
    const where = [60, 150, 230, 290].map((t) =>
      whereIs({ legs: schedule(reading, AT), reading } as Tracked, AT + t * 1000)
    );
    for (const text of where) {
      expect(text).toMatch(
        /^(Between|Approaching) (Stockwell and Vauxhall|Vauxhall and Pimlico|Pimlico and Victoria|Vauxhall|Pimlico|Victoria)$/
      );
    }
  });
});

describe('Fleet', () => {
  const snapshot = (at: number, trains: TrainReading[]): Snapshot => ({
    at,
    stale: false,
    trains,
    platforms: [''],
    status: []
  });

  it('keeps following a nameless train from one reading to the next', () => {
    const fleet = new Fleet();
    fleet.update(snapshot(AT, [train({ id: null })]), AT);
    const [key] = fleet.trains.keys();
    const later = train({
      id: null,
      stops: [
        [VAUXHALL, 50, 0],
        [PIMLICO, 170, 0]
      ]
    });
    fleet.update(snapshot(AT + 10_000, [later]), AT + 10_000);
    expect([...fleet.trains.keys()]).toEqual([key]);
  });

  it('carries trains straight onto the other map rather than easing them across', () => {
    const fleet = new Fleet();
    fleet.update(snapshot(AT, [train()]), AT);
    fleet.step(AT + 1000, 1);
    fleet.step(AT + 1100, 0.1, layouts.schematic);
    const [moved] = fleet.trains.values();
    const there = locate('victoria', moved.legs, VAUXHALL, seconds(1.1), layouts.schematic);
    expect(distance(moved.shown, there)).toBeLessThan(1);
  });

  it('fades a train out when it drops off the feed rather than deleting it', () => {
    const fleet = new Fleet();
    fleet.update(snapshot(AT, [train()]), AT);
    fleet.step(AT + 1000, 1);
    fleet.update(snapshot(AT + 10_000, []), AT + 10_000);
    const [gone] = fleet.trains.values();
    expect(gone.gone).toBe(true);
    fleet.step(AT + 12_000, 2);
    expect(fleet.trains.size).toBe(0);
  });
});
