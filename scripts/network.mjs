#!/usr/bin/env node
// Rebuilds src/lib/data/network.json from TfL, plus the Thames from OpenStreetMap
import { writeFile } from 'node:fs/promises';

const LINES = [
  'bakerloo',
  'central',
  'circle',
  'district',
  'hammersmith-city',
  'jubilee',
  'metropolitan',
  'northern',
  'piccadilly',
  'victoria',
  'waterloo-city',
  'elizabeth',
  'liberty',
  'lioness',
  'mildmay',
  'suffragette',
  'weaver',
  'windrush'
];
const DIRECTIONS = ['inbound', 'outbound'];
const OUT = new URL('../src/lib/data/network.json', import.meta.url);
const TFL = 'https://api.tfl.gov.uk';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const THAMES =
  '[out:json][timeout:60];way["waterway"="river"]["name"="River Thames"]' +
  '(51.36,-0.62,51.56,0.35);out geom;';
const UA = 'tubespotting/1.0 (+https://github.com/NotAFlightRisk/tubespotting)';

const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const round = (n) => Math.round(n * 1e5) / 1e5;

async function tfl(path, params = {}) {
  const url = new URL(TFL + path);
  for (const [key, value] of Object.entries({ ...params, app_key: process.env.TFL_APP_KEY })) {
    if (value) url.searchParams.set(key, value);
  }
  for (let attempt = 1; ; attempt++) {
    await wait(300);
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': UA } });
    if (res.ok) return res.json();
    if (res.status !== 429 || attempt === 5) throw new Error(`TfL ${res.status} on ${path}`);
    await wait(15_000 * attempt);
  }
}

export const cleanName = (name) =>
  name
    .replace(/(\s+(?:Underground|Rail) Station|-Underground)$/i, '')
    .replace(/\s*\(London\)|\s+ELL$/i, '')
    .replace(/\s*\((?:[^)]*(?:line|bakerloo|central|dist|h&c|circle))[^)]*\)/i, '')
    .trim();

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
};

/** Seconds between consecutive stops, from each pattern origin's own timetable */
async function runTimes(lineId, direction, origins, into) {
  for (const origin of origins) {
    const { timetable } = await tfl(`/Line/${lineId}/Timetable/${origin}`, { direction }).catch(
      () => ({})
    );
    for (const route of timetable?.routes ?? []) {
      for (const { intervals } of route.stationIntervals ?? []) {
        let from = origin;
        let at = 0;
        for (const { stopId, timeToArrival } of intervals) {
          const gap = (timeToArrival - at) * 60;
          if (gap > 0 && gap < 900)
            into.set(`${from}>${stopId}`, [...(into.get(`${from}>${stopId}`) ?? []), gap]);
          from = stopId;
          at = timeToArrival;
        }
      }
    }
  }
}

async function thames() {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'user-agent': UA, accept: 'application/json' },
    body: new URLSearchParams({ data: THAMES })
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const { elements } = await res.json();
  return elements.map((way) => simplify(way.geometry.map((p) => [round(p.lon), round(p.lat)])));
}

// Douglas-Peucker in rough metres, plenty for a river drawn as a band
function simplify(points, tolerance = 20) {
  if (points.length < 3) return points;
  const kx = 111_320 * Math.cos((51.5 * Math.PI) / 180);
  const ky = 110_574;
  const [a, b] = [points[0], points.at(-1)];
  const dx = (b[0] - a[0]) * kx;
  const dy = (b[1] - a[1]) * ky;
  const length = Math.hypot(dx, dy) || 1;
  let worst = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const px = (points[i][0] - a[0]) * kx;
    const py = (points[i][1] - a[1]) * ky;
    const distance = Math.abs(dx * py - dy * px) / length;
    if (distance > worst) [worst, index] = [distance, i];
  }
  if (worst <= tolerance) return [a, b];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance)
  ];
}

async function main() {
  const stations = new Map();
  const lines = [];

  for (const lineId of LINES) {
    const routes = [];
    const observed = new Map();
    for (const direction of DIRECTIONS) {
      const sequence = await tfl(`/Line/${lineId}/Route/Sequence/${direction}`, {
        serviceTypes: 'Regular',
        excludeCrowding: 'true'
      });
      for (const stop of (sequence.stopPointSequences ?? []).flatMap((s) => s.stopPoint ?? [])) {
        if (stations.has(stop.id)) continue;
        stations.set(stop.id, {
          id: stop.id,
          name: cleanName(stop.name),
          lat: round(stop.lat),
          lon: round(stop.lon),
          ...(stop.topMostParentId?.startsWith('HUB') && { hub: stop.topMostParentId })
        });
      }
      const ordered = (sequence.orderedLineRoutes ?? [])
        .map((route) => route.naptanIds.filter((id, i, all) => all.indexOf(id) === i))
        .filter((stops) => stops.length > 1);
      routes.push(...ordered);
      await runTimes(lineId, direction, [...new Set(ordered.map((stops) => stops[0]))], observed);
    }
    const runs = Object.fromEntries([...observed].map(([key, gaps]) => [key, median(gaps)]));
    lines.push({ id: lineId, routes, runs });
    console.log(`${lineId}: ${routes.length} routes, ${Object.keys(runs).length} timed segments`);
  }

  // the mainline's "London Euston" and "Queens Park" go by the tube's names, so labels merge
  const plain = (name) => name.replace(/^London |'/g, '');
  const tube = [...stations.values()].filter((s) => s.hub && s.id.startsWith('940GZZLU'));
  for (const station of stations.values()) {
    const twin = tube.find((s) => s.hub === station.hub && plain(s.name) === plain(station.name));
    if (twin) station.name = twin.name;
  }

  const ids = [...stations.keys()];
  const index = new Map(ids.map((id, i) => [id, i]));
  const missing = lines.flatMap((line) => line.routes.flat()).filter((id) => !index.has(id));
  if (missing.length) throw new Error(`Routes name unknown stations: ${[...new Set(missing)]}`);

  const network = {
    generated: new Date().toISOString(),
    stations: [...stations.values()],
    lines: lines.map((line) => ({
      id: line.id,
      routes: line.routes.map((stops) => stops.map((id) => index.get(id))),
      runs: Object.fromEntries(
        Object.entries(line.runs)
          .filter(([key]) => key.split('>').every((id) => index.has(id)))
          .map(([key, seconds]) => [
            key
              .split('>')
              .map((id) => index.get(id))
              .join('>'),
            seconds
          ])
      )
    })),
    thames: await thames()
  };
  await writeFile(OUT, JSON.stringify(network));
  const points = network.thames.reduce((sum, way) => sum + way.length, 0);
  console.log(`\n${ids.length} stations, ${network.thames.length} river ways (${points} points)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
