// A tube map of the network: lines at 45° steps, the middle given room and the suburbs squeezed in.
// Each run of track between junctions is routed in turn across an octilinear grid, and once a
// grid edge is used no other line can take it, so lines never overlap.
import { project, simplify } from './geo.mjs';

// about Holborn, which the squeeze is centred on
const CENTRE = { x: 1500, y: -500 };
// metres out from the centre before the squeeze really bites
const SQUEEZE = 1500;
// a grid step is this many metres of squeezed London, and this much room on the drawn map
const STEP = 130;
const ROOM = 350;
// grid steps between stops on a branch, which reaches further out if it needs to
const SPACING = 2;
// one junction's worth of lines, beyond which a hub's namesakes stay apart
const MAX_DEGREE = 7;

// what a route pays, per 45° turned, mid-track and while carrying a line through a station
const BEND = [0, 3, 7, Infinity, Infinity];
const THROUGH = [0, 3, 6, 20, 40];
const CROSSING = 2;
// for brushing past another line's station
const CROWDING = 1.5;
// per grid step squared that a station wanders from where it wants to be, and how far it may
const DRIFT = 0.3;
const REACH = 4;
// and how much harder a station's namesake pulls it to sit right alongside
const TWIN_PULL = 5;
// for running over another route, which only happens when there's no other way
const CLASH = 40;
// how far, in grid steps, a station's move still tugs the river along with it
const RIVER_PULL = 3;
// the stretch of the Thames the tube map shows, Kew to Barking, in degrees of longitude
const RIVER_SPAN = [-0.3, 0.13];

const DIRECTIONS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1]
];
const START = DIRECTIONS.length;
const turn = (a, b) => Math.min((a - b + 8) % 8, (b - a + 8) % 8);
const reverse = (d) => (d + 4) % 8;
const directionOf = (dx, dy) => DIRECTIONS.findIndex(([x, y]) => x === dx && y === dy);
const stepLength = (d) => (d % 2 ? Math.SQRT2 : 1);
/** How far along a route each of its grid nodes is */
const distancesAlong = (ways) => ways.reduce((sum, d) => [...sum, sum.at(-1) + stepLength(d)], [0]);
const pair = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Real positions, squeezed towards the centre and measured in grid steps */
function squeezed({ lon, lat }) {
  const { x, y } = project([lon, lat]);
  const [dx, dy] = [x - CENTRE.x, y - CENTRE.y];
  const r = Math.hypot(dx, dy) || 1;
  const k = (SQUEEZE * Math.asinh(r / SQUEEZE)) / r / STEP;
  return { x: dx * k, y: dy * k };
}

/**
 * Stations sharing a hub and a name become one place, unless that's more lines than fit round it,
 * when the one left over goes alongside
 */
function merge(stations, tracks) {
  const around = stations.map(() => new Set());
  for (const { a, b } of tracks) {
    around[a].add(b);
    around[b].add(a);
  }
  const place = stations.map((_, i) => i);
  const firsts = new Map();
  const alongside = new Map();
  stations.forEach((station, i) => {
    const key = `${station.hub ?? station.id}|${station.name}`;
    const first = firsts.get(key);
    if (first === undefined) return firsts.set(key, i);
    if (new Set([...around[first], ...around[i]]).size > MAX_DEGREE) return alongside.set(i, first);
    place[i] = first;
    for (const n of around[i]) around[first].add(n);
  });
  const links = new Map();
  for (const { a, b, lines } of tracks) {
    const [p, q] = [place[a], place[b]];
    if (p === q) continue;
    const link = links.get(pair(p, q)) ?? { a: p, b: q, lines: new Set() };
    for (const line of lines) link.lines.add(line);
    links.set(pair(p, q), link);
  }
  return { place, links: [...links.values()], alongside };
}

/** Unbroken runs of stops between junctions, ends and anywhere else that's placed on its own */
function chainsOf(links, alone) {
  const around = new Map();
  const lines = new Map();
  for (const { a, b, lines: carried } of links) {
    around.set(a, (around.get(a) ?? new Set()).add(b));
    around.set(b, (around.get(b) ?? new Set()).add(a));
    lines.set(pair(a, b), carried);
  }
  const junction = (s) => around.get(s).size !== 2 || alone.has(s);
  const walked = new Set();
  const chains = [];
  for (const start of [...around.keys()].filter(junction)) {
    for (const first of around.get(start)) {
      if (walked.has(pair(start, first))) continue;
      const stops = [start];
      let [previous, here] = [start, first];
      while (!walked.has(pair(previous, here))) {
        walked.add(pair(previous, here));
        stops.push(here);
        if (junction(here)) break;
        [previous, here] = [here, [...around.get(here)].find((n) => n !== previous)];
      }
      if (stops[0] === stops.at(-1)) throw new Error(`A loop with no junction at ${start}`);
      // a branch runs out to its end of the line
      if (around.get(start).size === 1) stops.reverse();
      const carried = stops.slice(1).flatMap((s, i) => [...lines.get(pair(stops[i], s))]);
      chains.push({ stops, lines: new Set(carried), branch: around.get(stops.at(-1)).size === 1 });
    }
  }
  return chains;
}

class Heap {
  #items = [];

  get size() {
    return this.#items.length;
  }

  push(cost, value) {
    const items = this.#items;
    let i = items.push([cost, value]) - 1;
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (items[up][0] <= cost) return;
      [items[up], items[i]] = [items[i], items[up]];
      i = up;
    }
  }

  pop() {
    const items = this.#items;
    const top = items[0];
    const last = items.pop();
    if (!items.length) return top;
    items[0] = last;
    for (let i = 0; ;) {
      const [l, r] = [2 * i + 1, 2 * i + 2];
      let low = i;
      if (l < items.length && items[l][0] < items[low][0]) low = l;
      if (r < items.length && items[r][0] < items[low][0]) low = r;
      if (low === i) return top;
      [items[low], items[i]] = [items[i], items[low]];
      i = low;
    }
  }
}

class Grid {
  /** Grid nodes holding a station, and the station */
  stops = new Map();
  /** Where each station ended up */
  placed = new Map();
  /** Which ways out of a station are taken, and by which lines */
  ports = new Map();
  /** Directions routes pass through a grid node in */
  passing = new Map();
  taken = new Set();

  constructor(home, alongside) {
    this.alongside = alongside;
    const xs = home.map((p) => p.x);
    const ys = home.map((p) => p.y);
    const margin = REACH * 2;
    this.x0 = Math.floor(Math.min(...xs)) - margin;
    this.y0 = Math.floor(Math.min(...ys)) - margin;
    this.width = Math.ceil(Math.max(...xs)) - this.x0 + margin;
    this.height = Math.ceil(Math.max(...ys)) - this.y0 + margin;
    this.home = home;
  }

  node(x, y) {
    const [gx, gy] = [x - this.x0, y - this.y0];
    return gx < 0 || gy < 0 || gx >= this.width || gy >= this.height ? -1 : gy * this.width + gx;
  }

  point(n) {
    return { x: (n % this.width) + this.x0, y: Math.floor(n / this.width) + this.y0 };
  }

  step(n, d) {
    const { x, y } = this.point(n);
    return this.node(x + DIRECTIONS[d][0], y + DIRECTIONS[d][1]);
  }

  edge(n, d) {
    return d < 4 ? n * 8 + d : this.step(n, d) * 8 + reverse(d);
  }

  /** Takes a grid edge, and the diagonal crossing it if there is one */
  take(n, d) {
    this.taken.add(this.edge(n, d));
    const [dx, dy] = DIRECTIONS[d];
    if (!dx || !dy) return;
    const { x, y } = this.point(n);
    this.taken.add(this.edge(this.node(x + dx, y), directionOf(-dx, dy)));
  }

  /** What leaving a station this way costs its lines, Infinity if the way's taken */
  portCost(station, d, lines) {
    let cost = 0;
    for (const port of this.ports.get(station) ?? []) {
      if (port.d === d) return Infinity;
      const shared = [...lines].filter((line) => port.lines.has(line)).length;
      cost += THROUGH[turn(reverse(port.d), d)] * Math.min(shared, 2);
    }
    return cost;
  }

  /** Grid nodes a station could take, with what moving there costs */
  spots(station, reach) {
    if (this.placed.has(station)) return [[this.placed.get(station), 0]];
    const twin = this.placed.get(this.alongside.get(station));
    const { x, y } = twin === undefined ? this.home[station] : this.point(twin);
    const drift = twin === undefined ? DRIFT : DRIFT * TWIN_PULL;
    const spots = [];
    for (let gy = Math.floor(y - reach); gy <= Math.ceil(y + reach); gy++) {
      for (let gx = Math.floor(x - reach); gx <= Math.ceil(x + reach); gx++) {
        const n = this.node(gx, gy);
        const off = Math.hypot(gx - x, gy - y);
        if (n >= 0 && off <= reach && !this.stops.has(n) && !this.passing.has(n)) {
          spots.push([n, drift * off * off]);
        }
      }
    }
    return spots;
  }

  /** Whether a grid node is right by some other line's station */
  crowds(n, ends) {
    return DIRECTIONS.some((_, d) => {
      const station = this.stops.get(this.step(n, d));
      return station !== undefined && !ends.includes(station);
    });
  }

  /** Cheapest octilinear route for a chain, as [grid node, direction in] pairs, or null */
  route({ stops, lines }, reach, relaxed = false) {
    const [from, to] = [stops[0], stops.at(-1)];
    const blocked = relaxed ? CLASH : Infinity;
    const targets = new Map(this.spots(to, reach));
    const best = new Map();
    const via = new Map();
    const heap = new Heap();
    for (const [n, cost] of this.spots(from, reach)) {
      best.set(n * 9 + START, cost);
      heap.push(cost, n * 9 + START);
    }
    while (heap.size) {
      const [cost, state] = heap.pop();
      if (cost > best.get(state)) continue;
      const [n, din] = [Math.floor(state / 9), state % 9];
      if (din !== START && targets.has(n)) {
        const path = [state];
        while (via.has(path[0])) path.unshift(via.get(path[0]));
        return path.map((s) => [Math.floor(s / 9), s % 9]);
      }
      for (let d = 0; d < 8; d++) {
        const m = this.step(n, d);
        if (m < 0) continue;
        let c = cost + stepLength(d);
        if (din === START) c += this.portCost(from, d, lines);
        else if (this.passing.has(n) && d !== din) c += blocked;
        else c += BEND[turn(din, d)];
        if (this.taken.has(this.edge(n, d))) c += blocked;
        if (targets.has(m)) c += targets.get(m) + this.portCost(to, reverse(d), lines);
        else if (this.stops.has(m)) continue;
        else {
          const through = this.passing.get(m);
          // only straight across another route, never along it
          if (through) c += through.length > 1 || through[0] % 4 === d % 4 ? blocked : CROSSING;
          if (this.crowds(m, [from, to])) c += CROWDING;
        }
        const next = m * 9 + d;
        if (c < (best.get(next) ?? Infinity)) {
          best.set(next, c);
          via.set(next, state);
          heap.push(c, next);
        }
      }
    }
    return null;
  }

  /** Settles a chain's ends and claims every grid edge its route uses */
  commit({ stops, lines }, path) {
    const nodes = path.map(([n]) => n);
    const ways = path.slice(1).map(([, d]) => d);
    for (const [station, n, d] of [
      [stops[0], nodes[0], ways[0]],
      [stops.at(-1), nodes.at(-1), reverse(ways.at(-1))]
    ]) {
      this.placed.set(station, n);
      this.stops.set(n, station);
      this.ports.set(station, [...(this.ports.get(station) ?? []), { d, lines }]);
    }
    ways.forEach((d, i) => this.take(nodes[i], d));
    for (let i = 1; i < nodes.length - 1; i++) {
      const through = [ways[i - 1], ...(ways[i] === ways[i - 1] ? [] : [ways[i]])];
      this.passing.set(nodes[i], [...(this.passing.get(nodes[i]) ?? []), ...through]);
    }
    return { points: nodes.map((n) => this.point(n)), ways };
  }
}

/** A chain's stops spread evenly along its route, off the corners where there's room */
function spread(count, along, turns) {
  const total = along.at(-1);
  const goals = Array.from({ length: count }, (_, k) => (total * (k + 1)) / (count + 1));
  const straights = along
    .map((_, i) => i)
    .filter((i) => i && i < along.length - 1 && !turns.includes(i));
  if (straights.length < count) return [0, ...goals, total];
  let from = 0;
  const picks = goals.map((goal, k) => {
    const options = straights.slice(from, straights.length - (count - k - 1));
    const pick = options.reduce((a, b) =>
      Math.abs(along[b] - goal) < Math.abs(along[a] - goal) ? b : a
    );
    from = straights.indexOf(pick) + 1;
    return along[pick];
  });
  return [0, ...picks, total];
}

/** The point a given distance along a route */
function pointAt(points, along, distance) {
  let i = 1;
  while (i < along.length - 1 && along[i] < distance) i++;
  const f = Math.min(1, (distance - along[i - 1]) / (along[i] - along[i - 1]));
  const [a, b] = [points[i - 1], points[i]];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** Rounds off a line's corners, keeping its ends */
const chaikin = (line) =>
  line.length < 3
    ? line
    : [
        line[0],
        ...line.slice(1).flatMap((q, i) => {
          const p = line[i];
          const cut = (f) => ({ x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f });
          return [cut(0.25), cut(0.75)];
        }),
        line.at(-1)
      ];

/** The river, moved the way the stations near it moved so it keeps to the same side of them */
function riverAlong(thames, moves) {
  return thames.map((way) => {
    const nudged = way
      .filter(([lon]) => lon >= RIVER_SPAN[0] && lon <= RIVER_SPAN[1])
      .map(([lon, lat]) => {
        const p = squeezed({ lon, lat });
        let [x, y, total] = [0, 0, 0.05];
        for (const { from, by } of moves) {
          const weight = Math.exp(
            -((p.x - from.x) ** 2 + (p.y - from.y) ** 2) / (2 * RIVER_PULL ** 2)
          );
          x += weight * by.x;
          y += weight * by.y;
          total += weight;
        }
        return { x: p.x + x / total, y: p.y + y / total };
      });
    // simpler and smoother than the real thing, as the tube map draws it
    return chaikin(chaikin(simplify(nudged, 0.3)));
  });
}

/** Every station's place on the tube map, the corners each track turns, and the river */
export function schematic(stations, tracks, thames) {
  const { place, links, alongside } = merge(stations, tracks);
  const chains = chainsOf(links, new Set([...alongside.keys(), ...alongside.values()]));
  const home = stations.map(squeezed);
  for (const { stops } of chains.filter((c) => c.branch)) {
    const [end, root] = [home[stops.at(-1)], home[stops[0]]];
    const reach = Math.hypot(end.x - root.x, end.y - root.y) || 1;
    const want = (stops.length - 1) * SPACING;
    if (reach < want) {
      home[stops.at(-1)] = {
        x: root.x + ((end.x - root.x) * want) / reach,
        y: root.y + ((end.y - root.y) * want) / reach
      };
    }
  }

  // the middle first, while there's still room there
  const fromCentre = ({ stops }) => {
    const [a, b] = [home[stops[0]], home[stops.at(-1)]];
    return Math.hypot(a.x + b.x, a.y + b.y);
  };
  const grid = new Grid(home, alongside);
  const at = new Map();
  const corners = new Map();
  for (const chain of chains.sort((p, q) => fromCentre(p) - fromCentre(q))) {
    const path =
      grid.route(chain, REACH) ??
      grid.route(chain, REACH * 2) ??
      grid.route(chain, REACH * 2, true);
    if (!path) {
      throw new Error(`No room on the grid for ${chain.stops.map((s) => stations[s].name)}`);
    }
    const { points, ways } = grid.commit(chain, path);
    const { stops } = chain;
    const along = distancesAlong(ways);
    const turns = ways.slice(1).flatMap((d, i) => (d === ways[i] ? [] : [i + 1]));
    const stopsAt = spread(stops.length - 2, along, turns);
    stops.forEach((s, i) => at.set(s, pointAt(points, along, stopsAt[i])));
    for (let i = 1; i < stops.length; i++) {
      const between = turns
        .filter((t) => along[t] > stopsAt[i - 1] + 1e-6 && along[t] < stopsAt[i] - 1e-6)
        .map((t) => points[t]);
      corners.set(`${stops[i - 1]}>${stops[i]}`, between);
      corners.set(`${stops[i]}>${stops[i - 1]}`, [...between].reverse());
    }
  }

  const final = stations.map((_, i) => at.get(place[i]) ?? home[i]);
  const moves = stations.map((station, i) => {
    const from = squeezed(station);
    return { from, by: { x: final[i].x - from.x, y: final[i].y - from.y } };
  });
  const world = ({ x, y }) => [Math.round(CENTRE.x + x * ROOM), Math.round(CENTRE.y + y * ROOM)];
  return {
    at: final.map(world),
    bends: tracks.map(({ a, b }) => (corners.get(`${place[a]}>${place[b]}`) ?? []).map(world)),
    river: riverAlong(thames, moves).map((way) => way.map(world))
  };
}
