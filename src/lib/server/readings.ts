import { isLineId, type LineId } from '#lib/lines.js';
import { pathBetween, stationById, stations, travelTime } from '#lib/network.js';
import type { LineStatus, Stop, TrainReading } from '#lib/types.js';

export interface Prediction {
  vehicleId?: string;
  naptanId: string;
  lineId: string;
  platformName?: string;
  destinationNaptanId?: string;
  destinationName?: string;
  towards?: string;
  expectedArrival: string;
  currentLocation?: string;
}

interface Call {
  station: number;
  eta: number;
  platform: string;
  prediction: Prediction;
}

const ANONYMOUS = /^0*$/;
const HORIZON = 45 * 60;
// TfL repeats a call once per platform it might use, a few seconds apart
const SAME_CALL = 90;
const SAME_TRAIN = 45;
// fast trains skip a few stops between calls, but not half a line
const MAX_HOPS = 4;
// nothing on the tube is a quarter of an hour from its next stop unless it's parked
const FIRST_CALL = 15 * 60;

export const cleanName = (name: string) =>
  name
    .replace(/(\s+Underground Station|-Underground)$/i, '')
    .replace(/\s*\((?:[^)]*(?:line|bakerloo|central|dist|h&c|circle))[^)]*\)/i, '')
    .trim();

const simplify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const byName = new Map<string, number[]>();
for (const station of stations) {
  const key = simplify(station.name);
  byName.set(key, [...(byName.get(key) ?? []), station.index]);
}

/** Which station TfL's free-text location names, preferring ones on the train's own line */
export function stationNamed(name: string, line: LineId): number | null {
  const wanted = simplify(name.replace(/\s+Platform\s+\S+$/i, ''));
  const exact = byName.get(wanted);
  const loose =
    exact ??
    [...byName]
      .filter(([key]) => key.startsWith(wanted) || wanted.startsWith(key))
      .flatMap(([, ids]) => ids);
  const onLine = loose.filter((index) => stations[index].lines.includes(line));
  return onLine[0] ?? null;
}

/** "Between Foo and Bar", "Left Foo" and "At Foo" all say where the train has just been */
export function lastStation(location: string, line: LineId): number | null {
  const match =
    /^Between (.+?) and /i.exec(location) ??
    /^(?:Left|Departed|Departing|Leaving|At) (.+)$/i.exec(location);
  return match ? stationNamed(match[1], line) : null;
}

const destinationOf = (p: Prediction) =>
  cleanName(p.destinationName ?? '') || p.towards?.replace(/^Check Front of Train$/i, '') || '';

function toCalls(line: LineId, predictions: Prediction[], at: number): Call[] {
  return predictions
    .flatMap((prediction) => {
      const station = stationById.get(prediction.naptanId);
      const eta = Math.round((Date.parse(prediction.expectedArrival) - at) / 1000);
      // TfL sometimes files a call under a line that doesn't stop there
      if (!station?.lines.includes(line) || !Number.isFinite(eta) || eta < -30 || eta > HORIZON) {
        return [];
      }
      return [
        {
          station: station.index,
          eta: Math.max(0, eta),
          platform: prediction.platformName ?? '',
          prediction
        }
      ];
    })
    .sort((a, b) => a.eta - b.eta);
}

const hops = (line: LineId, from: number, to: number) => {
  const path = pathBetween(line, from, to);
  return path ? path.length - 1 : Infinity;
};

/** How far off a call is from where this train could be by then, or null if it can't be */
function misfit(line: LineId, dest: number | null, train: Call[], call: Call): number | null {
  const [before, last] = [train.at(-2), train.at(-1)!];
  if (train.some((c) => c.station === call.station)) return null;
  if (hops(line, last.station, call.station) > MAX_HOPS) return null;
  // onwards, not back the way it came, or towards its destination when that's all there is
  const onwards = before
    ? hops(line, before.station, call.station) > hops(line, before.station, last.station)
    : dest === null || hops(line, call.station, dest) < hops(line, last.station, dest);
  if (!onwards) return null;
  const expected = travelTime(line, last.station, call.station);
  const taken = call.eta - last.eta;
  if (taken < expected * 0.4 - 30 || taken > expected * 2.5 + 90) return null;
  return Math.abs(taken - expected);
}

/** Calls chain into trains stop by stop, each joining the train that could get there in time */
function chains(line: LineId, dest: number | null, calls: Call[]): Call[][] {
  const trains: Call[][] = [];
  for (const call of calls) {
    const repeat = trains.some((train) =>
      train.some((c) => c.station === call.station && Math.abs(call.eta - c.eta) < SAME_CALL)
    );
    if (repeat) continue;
    let home: Call[] | undefined;
    let best = Infinity;
    for (const train of trains) {
      const off = misfit(line, dest, train, call);
      if (off !== null && off < best) [home, best] = [train, off];
    }
    if (home) home.push(call);
    else trains.push([call]);
  }
  return trains;
}

function toReading(
  line: LineId,
  id: string | null,
  calls: Call[],
  platforms: Platforms
): TrainReading {
  const head = calls[0].prediction;
  const where = head.currentLocation?.trim() ?? '';
  const to = destinationOf(head);
  return {
    id,
    line,
    to,
    dest: to ? stationNamed(to, line) : null,
    where,
    from: lastStation(where, line),
    stops: calls.map((c): Stop => [c.station, c.eta, platforms.index(c.platform)])
  };
}

/** A train TfL lists twice, with an id and without, only counts once */
function dedupe(trains: TrainReading[]): TrainReading[] {
  const ranked = [...trains].sort(
    (a, b) => Number(b.id !== null) - Number(a.id !== null) || b.stops.length - a.stops.length
  );
  const kept: TrainReading[] = [];
  for (const train of ranked) {
    const [first, eta] = train.stops[0];
    const twin = kept.some(
      (other) =>
        other.line === train.line &&
        other.to === train.to &&
        other.stops.some(([station, at]) => station === first && Math.abs(at - eta) <= SAME_TRAIN)
    );
    if (!twin) kept.push(train);
  }
  return kept;
}

export class Platforms {
  readonly names: string[] = [];
  #index = new Map<string, number>();

  index(name: string): number {
    if (!this.#index.has(name)) this.#index.set(name, this.names.push(name) - 1);
    return this.#index.get(name)!;
  }
}

export function readTrains(
  predictions: Prediction[],
  at: number,
  platforms: Platforms
): TrainReading[] {
  const groups = new Map<string, { line: LineId; id: string | null; predictions: Prediction[] }>();
  for (const prediction of predictions) {
    if (!isLineId(prediction.lineId) || !prediction.naptanId) continue;
    const vehicle = prediction.vehicleId?.trim() ?? '';
    const anonymous = ANONYMOUS.test(vehicle);
    const to = destinationOf(prediction);
    // nameless trains are told apart by timing alone, as TfL's location text varies per call
    const key = anonymous
      ? `${prediction.lineId}|?|${to}`
      : `${prediction.lineId}|${vehicle}|${to}`;
    const group = groups.get(key) ?? {
      line: prediction.lineId,
      id: anonymous ? null : `${prediction.lineId}:${vehicle}:${to}`,
      predictions: []
    };
    group.predictions.push(prediction);
    groups.set(key, group);
  }

  const trains: TrainReading[] = [];
  for (const { line, id, predictions: group } of groups.values()) {
    const to = destinationOf(group[0]);
    const dest = to ? stationNamed(to, line) : null;
    chains(line, dest, toCalls(line, group, at)).forEach((train, i) => {
      if (train[0].eta > FIRST_CALL) return;
      trains.push(toReading(line, id && (i ? `${id}#${i}` : id), train, platforms));
    });
  }
  return dedupe(trains.filter((train) => !isReturnTrip(train, trains)));
}

// TfL's id, or failing that where it says the train is, which is the same for all its calls
const vehicleOf = (train: TrainReading) =>
  train.id ? train.id.split(':').slice(0, 2).join(':') : `${train.line}|${train.where}`;

/** A train's next trip back shows up too, starting where this one ends */
const isReturnTrip = (train: TrainReading, all: TrainReading[]) =>
  (train.id !== null || train.where !== '') &&
  all.some(
    (other) =>
      other !== train &&
      vehicleOf(other) === vehicleOf(train) &&
      other.stops.at(-1)![1] <= train.stops[0][1] &&
      hops(train.line, other.stops.at(-1)![0], train.stops[0][0]) <= 2
  );

interface RawStatus {
  id: string;
  lineStatuses?: { statusSeverity: number; statusSeverityDescription: string; reason?: string }[];
}

export const readStatus = (raw: RawStatus[]): LineStatus[] =>
  raw.flatMap((line) => {
    if (!isLineId(line.id)) return [];
    const worst = [...(line.lineStatuses ?? [])].sort(
      (a, b) => a.statusSeverity - b.statusSeverity
    )[0];
    return [
      {
        id: line.id,
        severity: worst?.statusSeverity ?? 10,
        status: worst?.statusSeverityDescription ?? 'Unknown',
        reason: worst?.reason?.replace(/\s+/g, ' ').trim() || null
      }
    ];
  });
