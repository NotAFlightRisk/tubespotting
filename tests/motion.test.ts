import { describe, expect, it } from 'vitest';
import { Fleet } from '#lib/fleet.js';
import { locate, schedule } from '#lib/motion.js';
import { distance, stations } from '#lib/network.js';
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

  it('works out where a train is coming from when TfL does not say', () => {
    const [first] = schedule(train({ from: null, where: '' }), AT);
    expect(first.from).toBe(STOCKWELL);
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
