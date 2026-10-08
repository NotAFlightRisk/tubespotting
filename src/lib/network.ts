import data from './data/network.json' with { type: 'json' };
import { LINE_IDS, type LineId } from './lines.js';

export interface Point {
  x: number;
  y: number;
}

export interface Station extends Point {
  index: number;
  id: string;
  name: string;
  lat: number;
  lon: number;
  hub: string | null;
  lines: LineId[];
}

// Metres east and south of Charing Cross, near enough flat for one city
const ORIGIN = { lat: 51.5074, lon: -0.1278 };
const KX = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const KY = 110_574;

export const project = (lon: number, lat: number): Point => ({
  x: (lon - ORIGIN.lon) * KX,
  y: (ORIGIN.lat - lat) * KY
});

export const unproject = ({ x, y }: Point) => ({
  lon: x / KX + ORIGIN.lon,
  lat: ORIGIN.lat - y / KY
});

export const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

const pair = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export const stations: Station[] = data.stations.map((s, index) => ({
  index,
  id: s.id,
  name: s.name,
  lat: s.lat,
  lon: s.lon,
  hub: 'hub' in s ? (s.hub as string) : null,
  lines: [],
  ...project(s.lon, s.lat)
}));

export const stationById = new Map(stations.map((s) => [s.id, s]));

export const thames: Point[][] = data.thames.map((way) =>
  way.map(([lon, lat]) => project(lon, lat))
);

interface LineData {
  id: LineId;
  routes: number[][];
  runs: Record<string, number>;
}

const lineData = data.lines as unknown as LineData[];

const link = (graph: Map<number, Set<number>>, a: number, b: number) => {
  graph.set(a, (graph.get(a) ?? new Set()).add(b));
  graph.set(b, (graph.get(b) ?? new Set()).add(a));
};

// Every station pair any line runs between, for spotting trains that skip stops
const everyLink = new Map<number, Set<number>>();

/** Each line's calls as TfL runs them, for working out which train is which */
export const routeGraph = new Map<LineId, Map<number, Set<number>>>();

for (const line of lineData) {
  const graph = new Map<number, Set<number>>();
  for (const route of line.routes) {
    for (let i = 1; i < route.length; i++) {
      link(everyLink, route[i - 1], route[i]);
      link(graph, route[i - 1], route[i]);
    }
    for (const stop of route) {
      if (!stations[stop].lines.includes(line.id)) stations[stop].lines.push(line.id);
    }
  }
  routeGraph.set(line.id, graph);
}

/** Shortest way round a link through other stations, if it's nearly as straight as the link */
function stoppingPath(a: number, b: number): number[] | null {
  const chord = distance(stations[a], stations[b]);
  const best = new Map<number, number>([[a, 0]]);
  const via = new Map<number, number>();
  const queue = [a];
  while (queue.length) {
    queue.sort((p, q) => best.get(p)! - best.get(q)!);
    const here = queue.shift()!;
    if (here === b) break;
    for (const next of everyLink.get(here) ?? []) {
      if (here === a && next === b) continue;
      const cost = best.get(here)! + distance(stations[here], stations[next]);
      if (cost > chord * 1.2 || cost >= (best.get(next) ?? Infinity)) continue;
      best.set(next, cost);
      via.set(next, here);
      queue.push(next);
    }
  }
  if (!via.has(b)) return null;
  const path = [b];
  while (path[0] !== a) path.unshift(via.get(path[0])!);
  return path;
}

const expanded = new Map<string, number[]>();
const expand = (a: number, b: number): number[] => {
  const key = `${a}>${b}`;
  if (!expanded.has(key)) expanded.set(key, stoppingPath(a, b) ?? [a, b]);
  return expanded.get(key)!;
};

export interface Track {
  a: number;
  b: number;
  lines: LineId[];
}

/** Each line's drawn graph, with fast runs laid along the stations they skip */
export const lineGraph = new Map<LineId, Map<number, Set<number>>>();
const trackByPair = new Map<string, Track>();

for (const line of lineData) {
  const graph = new Map<number, Set<number>>();
  for (const route of line.routes) {
    for (let i = 1; i < route.length; i++) {
      const path = expand(route[i - 1], route[i]);
      for (let j = 1; j < path.length; j++) {
        const [a, b] = [Math.min(path[j - 1], path[j]), Math.max(path[j - 1], path[j])];
        link(graph, a, b);
        const track = trackByPair.get(pair(a, b)) ?? { a, b, lines: [] };
        if (!track.lines.includes(line.id)) track.lines.push(line.id);
        trackByPair.set(pair(a, b), track);
      }
    }
  }
  lineGraph.set(line.id, graph);
}

export const tracks: Track[] = [...trackByPair.values()];
for (const track of tracks) {
  track.lines.sort((p, q) => LINE_IDS.indexOf(p) - LINE_IDS.indexOf(q));
}

/** How far a line sits from the middle of a shared track, in strands */
export function strand(a: number, b: number, line: LineId): { slot: number; normal: Point } {
  const track = trackByPair.get(pair(a, b));
  const lines = track?.lines ?? [line];
  const [from, to] = a < b ? [stations[a], stations[b]] : [stations[b], stations[a]];
  const length = distance(from, to) || 1;
  return {
    slot: lines.indexOf(line) - (lines.length - 1) / 2,
    normal: { x: -(to.y - from.y) / length, y: (to.x - from.x) / length }
  };
}

type Cache<T> = Map<LineId, Map<number, T>>;

// per line, keyed `from * 1024 + to`, as these get asked for thousands of times a snapshot
function cached<T>(cache: Cache<T>, line: LineId, from: number, to: number, work: () => T): T {
  if (!cache.has(line)) cache.set(line, new Map());
  const mine = cache.get(line)!;
  const key = from * 1024 + to;
  if (!mine.has(key)) mine.set(key, work());
  return mine.get(key)!;
}

function shortest(graph: Map<number, Set<number>> | undefined, from: number, to: number) {
  const via = new Map<number, number>([[from, from]]);
  const queue = [from];
  while (queue.length && !via.has(to)) {
    const here = queue.shift()!;
    for (const next of graph?.get(here) ?? []) {
      if (via.has(next)) continue;
      via.set(next, here);
      queue.push(next);
    }
  }
  if (!via.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(via.get(path[0])!);
  return path;
}

const drawnPaths: Cache<number[] | null> = new Map();
const routePaths: Cache<number[] | null> = new Map();
const times: Cache<number> = new Map();

/** Stations a train on this line passes between two calls, ends included, as drawn */
export const pathBetween = (line: LineId, from: number, to: number) =>
  cached(drawnPaths, line, from, to, () => shortest(lineGraph.get(line), from, to));

/** How many calls apart two stations are on a line, or Infinity if it never links them */
export const callsApart = (line: LineId, from: number, to: number) => {
  const path = cached(routePaths, line, from, to, () => shortest(routeGraph.get(line), from, to));
  return path ? path.length - 1 : Infinity;
};

const runs = new Map(lineData.map((line) => [line.id, line.runs]));

/** Timetabled seconds between two neighbouring calls, else a guess off the distance */
export function runTime(line: LineId, from: number, to: number): number {
  const timetabled = runs.get(line)?.[`${from}>${to}`];
  if (timetabled) return timetabled;
  const path = pathBetween(line, from, to) ?? [from, to];
  let metres = 0;
  for (let i = 1; i < path.length; i++)
    metres += distance(stations[path[i - 1]], stations[path[i]]);
  return 30 + metres / 14;
}

/** Timetabled seconds between any two stations on a line, call by call */
export const travelTime = (line: LineId, from: number, to: number) =>
  cached(times, line, from, to, () => {
    const path = shortest(routeGraph.get(line), from, to) ?? [from, to];
    let seconds = 0;
    for (let i = 1; i < path.length; i++) seconds += runTime(line, path[i - 1], path[i]);
    return seconds;
  });

export const generated = data.generated;
