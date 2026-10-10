import type { Tracked } from '#lib/fleet.js';
import type { Layout } from '#lib/layout.js';
import { LINES, type LineId } from '#lib/lines.js';
import {
  distance,
  lane,
  lineRuns,
  middle,
  routeGraph,
  sideways,
  stations,
  tracks,
  type Point,
  type Station,
  type Track
} from '#lib/network.js';
import { detailed, labelSize, lineWidth, toScreen, visible, zoomedOut, type View } from './view.js';

export interface Palette {
  paper: string;
  river: string;
  stationInk: string;
  ring: string;
  ringFill: string;
  halo: string;
  lines: Record<LineId, string>;
  /** Each line's colour shifted a little, for marks drawn on top of it */
  tints: Record<LineId, string>;
  /** Each line's colour taken well away from it, to outline its trains */
  edges: Record<LineId, string>;
}

export interface Focus {
  /** Lines on the map at all */
  shown: Set<LineId>;
  line: LineId | null;
  /** The line focused before, and how far (0 to 1) the fade from it has got */
  previous: LineId | null;
  fade: number;
  station: number | null;
  train: string | null;
}

export interface Hit extends Point {
  radius: number;
}

export interface Label extends Point {
  text: string;
  align: CanvasTextAlign;
  size: number;
}

/** How much of the map's left and bottom the panels cover */
export interface Inset {
  left: number;
  bottom: number;
}

const FADED = 0.16;
const RIVER_METRES = 230;
// line widths back from a station that a bend starts, like the printed map's corners
const BEND = 1.5;
// a ring grows with its lines up to this many, so the biggest hubs don't swamp the map
const RING_LINES = 4;
const FONT = '"Hammersmith One", system-ui, sans-serif';

const mix = (focus: Focus, alpha: (line: LineId | null) => number) =>
  alpha(focus.previous) + (alpha(focus.line) - alpha(focus.previous)) * focus.fade;

const lineAlpha = (focus: Focus, line: LineId) =>
  mix(focus, (picked) => (picked && picked !== line ? FADED : 1));

const stationAlpha = (focus: Focus, station: Station) =>
  mix(focus, (picked) => (picked && !station.lines.includes(picked) ? FADED : 1));

interface Marks {
  /** Each station's lines that are on show */
  lines: LineId[][];
  termini: Set<number>;
  labelGroups: { name: string; members: Station[]; lines: Set<LineId> }[];
  hubs: Station[][];
  interchanges: Set<number>;
  tickTrack: Map<number, Track | undefined>;
}

const marked = new Map<string, Marks>();

/** Rings, ticks and labels for whichever lines are on show, worked out once per mix */
function marksFor(shown: Set<LineId>): Marks {
  const key = [...shown].sort().join();
  if (marked.has(key)) return marked.get(key)!;
  const lines = stations.map((s) => s.lines.filter((line) => shown.has(line)));
  const showing = stations.filter((s) => lines[s.index].length);

  // the ends of each line, which always get named when that line is picked out
  const termini = new Set(
    [...routeGraph]
      .filter(([line]) => shown.has(line))
      .flatMap(([, graph]) =>
        [...graph].filter(([, next]) => next.size === 1).map(([station]) => station)
      )
  );

  // a hub's stations that share a name get one label between them
  const groups = new Map<string, Station[]>();
  for (const station of showing) {
    const key = `${station.hub ?? station.id}|${station.name}`;
    groups.set(key, [...(groups.get(key) ?? []), station]);
  }
  const labelGroups = [...groups.values()].map((members) => ({
    name: members[0].name,
    members,
    lines: new Set(members.flatMap((m) => lines[m.index]))
  }));

  const byHub = new Map<string, Station[]>();
  for (const station of showing) {
    if (station.hub) byHub.set(station.hub, [...(byHub.get(station.hub) ?? []), station]);
  }
  const hubs = [...byHub.values()].filter((members) => members.length > 1);

  const interchanges = new Set(
    showing
      .filter((s) => lines[s.index].length > 1 || hubs.some((m) => m.includes(s)))
      .map((s) => s.index)
  );

  // the track a one-line station's tick hangs off
  const tickTrack = new Map(
    showing.map((s) => [
      s.index,
      tracks.find(
        (t) => t.lines.includes(lines[s.index][0]) && (t.a === s.index || t.b === s.index)
      )
    ])
  );

  const marks = { lines, termini, labelGroups, hubs, interchanges, tickTrack };
  marked.set(key, marks);
  return marks;
}

// the other railways go underneath, so the tube reads the same with them on
const DRAW_ORDER = [...LINES].sort((a, b) => Number(a.mode === 'tube') - Number(b.mode === 'tube'));

// does the segment's box overlap the screen, so long tracks crossing it still get drawn
const crosses = (view: View, a: Point, b: Point, margin = 20) =>
  Math.max(a.x, b.x) > -margin &&
  Math.min(a.x, b.x) < view.width + margin &&
  Math.max(a.y, b.y) > -margin &&
  Math.min(a.y, b.y) < view.height + margin;

interface Span {
  from: Point;
  to: Point;
  /** How much of each end the bends either side take */
  cut: number;
}

const towards = (from: Point, to: Point, by: number): Point => {
  const f = by / (distance(from, to) || 1);
  return { x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f };
};

const heading = ({ from, to }: Span): Point => ({ x: to.x - from.x, y: to.y - from.y });

/** Where two strands would meet, unless they barely turn or step across to another slot */
function corner(a: Span, b: Span, width: number): Point | null {
  const [p, q] = [heading(a), heading(b)];
  const cross = p.x * q.y - p.y * q.x;
  if (Math.abs(cross) < 0.05 * Math.hypot(p.x, p.y) * Math.hypot(q.x, q.y)) return null;
  const u = ((b.from.x - a.from.x) * q.y - (b.from.y - a.from.y) * q.x) / cross;
  const meet = { x: a.from.x + p.x * u, y: a.from.y + p.y * u };
  return distance(meet, a.to) < width * 2 ? meet : null;
}

/** A track on screen, minus the bends too small to see from here */
function onScreen(view: View, shape: Point[]): Point[] {
  const points = [toScreen(view, shape[0])];
  for (let i = 1; i < shape.length - 1; i++) {
    const p = toScreen(view, shape[i]);
    if (distance(p, points.at(-1)!) > 4) points.push(p);
  }
  points.push(toScreen(view, shape.at(-1)!));
  return points;
}

/** A line's run as straight spans on screen, each nudged onto the line's own strand */
function spansOf(view: View, layout: Layout, line: LineId, run: number[], width: number): Span[] {
  return run.slice(1).flatMap((b, i) => {
    const shift = lane(run[i], b, line) * width;
    const points = onScreen(view, layout.shape(run[i], b));
    return points.slice(1).map((q, j) => {
      const side = sideways(points[j], q);
      const [from, to] = [points[j], q].map((p) => ({
        x: p.x + side.x * shift,
        y: p.y + side.y * shift
      }));
      return { from, to, cut: Math.min(width * BEND, distance(from, to) / 2) };
    });
  });
}

/** One unbroken stroke along the spans on screen, so curves join up without a cap at every point */
function traceRun(ctx: CanvasRenderingContext2D, view: View, spans: Span[], width: number) {
  let joined = false;
  spans.forEach((span, i) => {
    if (!crosses(view, span.from, span.to)) {
      joined = false;
      return;
    }
    const next = spans[i + 1];
    const start = i ? towards(span.from, span.to, span.cut) : span.from;
    const end = next ? towards(span.to, span.from, span.cut) : span.to;
    if (!joined) ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    if (!next) return;
    const bend = corner(span, next, width);
    const out = towards(next.from, next.to, next.cut);
    // round the corner where the strands would meet, or ease over in an S for a step across
    if (bend) ctx.quadraticCurveTo(bend.x, bend.y, out.x, out.y);
    else ctx.bezierCurveTo(span.to.x, span.to.y, next.from.x, next.from.y, out.x, out.y);
    joined = true;
  });
}

function drawRiver(ctx: CanvasRenderingContext2D, view: View, layout: Layout, palette: Palette) {
  ctx.strokeStyle = palette.river;
  ctx.lineWidth = Math.max(3, RIVER_METRES * view.k);
  ctx.beginPath();
  for (const way of layout.river) {
    way.forEach((p, i) => {
      const s = toScreen(view, p);
      if (i) ctx.lineTo(s.x, s.y);
      else ctx.moveTo(s.x, s.y);
    });
  }
  ctx.stroke();
}

function drawTracks(
  ctx: CanvasRenderingContext2D,
  view: View,
  layout: Layout,
  palette: Palette,
  focus: Focus
) {
  const width = lineWidth(view.k);
  ctx.lineWidth = width;
  for (const { id: line } of DRAW_ORDER) {
    if (!focus.shown.has(line)) continue;
    ctx.globalAlpha = lineAlpha(focus, line);
    ctx.strokeStyle = palette.lines[line];
    ctx.beginPath();
    for (const run of lineRuns.get(line)!) {
      traceRun(ctx, view, spansOf(view, layout, line, run, width), width);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawStations(
  ctx: CanvasRenderingContext2D,
  view: View,
  layout: Layout,
  palette: Palette,
  focus: Focus,
  hits: Map<number, Hit>
) {
  const width = lineWidth(view.k);
  const ring = Math.max(1.2, width * 0.42);
  // rings swell less with their lines zoomed out, where they'd crowd each other
  const swell = 0.4 - 0.15 * zoomedOut(view.k);
  const showTicks = detailed(view.k);
  const { lines, hubs, interchanges, tickTrack } = marksFor(focus.shown);

  for (const members of hubs) {
    const points = members.map((m) => toScreen(view, layout.at[m.index]));
    if (!points.some((p) => visible(view, p))) continue;
    for (const [stroke, w] of [
      [palette.ring, width * 1.9 + ring * 2],
      [palette.ringFill, width * 1.9]
    ] as const) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = w;
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
  }

  for (const station of stations) {
    const p = toScreen(view, layout.at[station.index]);
    if (!lines[station.index].length || !visible(view, p)) continue;
    ctx.globalAlpha = stationAlpha(focus, station);
    if (interchanges.has(station.index)) {
      const served = Math.min(lines[station.index].length, RING_LINES);
      const radius = Math.max(width * 0.95, served * width * swell + ring);
      ctx.fillStyle = palette.ringFill;
      ctx.strokeStyle = palette.ring;
      ctx.lineWidth = ring;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      hits.set(station.index, { ...p, radius: radius + 6 });
    } else {
      const line = lines[station.index][0];
      const track = tickTrack.get(station.index);
      if (showTicks && track) {
        const onward = track.a === station.index ? track.b : track.a;
        const shift = lane(station.index, onward, line);
        const [here, next] = layout.shape(station.index, onward);
        const normal = sideways(here, next);
        const side = shift < 0 ? -1 : 1;
        const base = { x: p.x + normal.x * shift * width, y: p.y + normal.y * shift * width };
        const reach = width * 0.5 + width * 0.9;
        ctx.strokeStyle = palette.lines[line];
        ctx.lineWidth = Math.max(1.5, width * 0.75);
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(base.x + normal.x * side * reach, base.y + normal.y * side * reach);
        ctx.stroke();
        ctx.lineCap = 'round';
      }
      hits.set(station.index, { ...p, radius: width + 8 });
    }
  }
  ctx.globalAlpha = 1;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const runsAcross = (layout: Layout, { tickTrack }: Marks, index: number) => {
  const track = tickTrack.get(index);
  if (!track) return false;
  const onward = track.a === index ? track.b : track.a;
  const [a, b] = layout.shape(index, onward);
  return Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
};

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function placeLabels(
  ctx: CanvasRenderingContext2D,
  view: View,
  layout: Layout,
  focus: Focus,
  hits: Map<number, Hit>,
  inset: Inset
): Label[] {
  const labels: Label[] = [];
  // a name the panel or the edge would cut in half is no use to anyone
  const fits = (box: Box) =>
    box.x >= inset.left &&
    box.y >= 0 &&
    box.x + box.w <= view.width &&
    box.y + box.h <= view.height - inset.bottom;
  const size = labelSize(view.k) - (focus.line ? 1 : 0);
  const width = lineWidth(view.k);
  const marks = marksFor(focus.shown);
  const { interchanges, labelGroups, termini } = marks;
  ctx.font = `${size}px ${FONT}`;
  // interchange rings stay readable, so labels go round the ones still in view
  const placed: Box[] = [...interchanges].flatMap((index) => {
    const hit = hits.get(index);
    if (!hit || (focus.line && !stations[index].lines.includes(focus.line))) return [];
    const r = hit.radius - 6;
    return [{ x: hit.x - r, y: hit.y - r, w: r * 2, h: r * 2 }];
  });
  const wanted = labelGroups
    .map((group) => {
      const focused = group.members.some((m) => m.index === focus.station);
      const onLine = focus.line ? group.lines.has(focus.line) : true;
      const end = group.members.some((m) => termini.has(m.index));
      const weight = focused ? 100 : group.lines.size + (focus.line ? (end ? 40 : 10) : 0);
      const threshold =
        focused || (focus.line && onLine)
          ? 0
          : [0.06, 0.03, 0.016][Math.min(group.lines.size, 3) - 1];
      return { group, weight, show: view.k >= threshold && (onLine || focused) };
    })
    .filter((item) => item.show)
    .sort((a, b) => b.weight - a.weight);

  for (const { group } of wanted) {
    const anchor = toScreen(view, middle(group.members.map((m) => layout.at[m.index])));
    if (!visible(view, anchor)) continue;
    const text = group.name;
    const w = ctx.measureText(text).width;
    const gap = width * Math.max(1.4, group.lines.size * 0.6) + 4;
    const lean = gap * 0.7;
    const beside: (Box & { align: CanvasTextAlign })[] = [
      { x: anchor.x + gap, y: anchor.y - size / 2, w, h: size, align: 'left' },
      { x: anchor.x - gap - w, y: anchor.y - size / 2, w, h: size, align: 'right' }
    ];
    const over: (Box & { align: CanvasTextAlign })[] = [
      { x: anchor.x - w / 2, y: anchor.y - gap - size, w, h: size, align: 'center' },
      { x: anchor.x - w / 2, y: anchor.y + gap, w, h: size, align: 'center' }
    ];
    // like the printed map, names sit beside a line running up the page and above one running across
    const options: (Box & { align: CanvasTextAlign })[] = [
      ...(runsAcross(layout, marks, group.members[0].index)
        ? [...over, ...beside]
        : [...beside, ...over]),
      { x: anchor.x + lean, y: anchor.y - lean - size, w, h: size, align: 'left' },
      { x: anchor.x + lean, y: anchor.y + lean, w, h: size, align: 'left' },
      { x: anchor.x - lean - w, y: anchor.y - lean - size, w, h: size, align: 'right' },
      { x: anchor.x - lean - w, y: anchor.y + lean, w, h: size, align: 'right' }
    ];
    const spot = options.find((box) => fits(box) && !placed.some((other) => overlaps(box, other)));
    if (!spot) continue;
    placed.push({ x: spot.x - 3, y: spot.y - 2, w: spot.w + 6, h: spot.h + 4 });
    const x = spot.align === 'left' ? spot.x : spot.align === 'right' ? spot.x + w : spot.x + w / 2;
    labels.push({ text, x, y: spot.y + size / 2, align: spot.align, size });
  }
  return labels;
}

/** Names go on top of the trains, so a busy station still says what it is */
export function paintLabels(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  labels: Label[],
  alpha = 1
) {
  ctx.globalAlpha = alpha;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = palette.paper;
  ctx.fillStyle = palette.stationInk;
  for (const label of labels) {
    ctx.font = `${label.size}px ${FONT}`;
    ctx.textAlign = label.align;
    ctx.strokeText(label.text, label.x, label.y);
    ctx.fillText(label.text, label.x, label.y);
  }
  ctx.globalAlpha = 1;
}

/** The network itself, redrawn only when the view, focus or theme changes */
export function paintNetwork(
  ctx: CanvasRenderingContext2D,
  view: View,
  layout: Layout,
  palette: Palette,
  focus: Focus,
  inset: Inset
): { hits: Map<number, Hit>; labels: Label[] } {
  const hits = new Map<number, Hit>();
  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawRiver(ctx, view, layout, palette);
  drawTracks(ctx, view, layout, palette, focus);
  drawStations(ctx, view, layout, palette, focus, hits);
  return { hits, labels: placeLabels(ctx, view, layout, focus, hits, inset) };
}

function ring(ctx: CanvasRenderingContext2D, palette: Palette, at: Point, radius: number) {
  ctx.strokeStyle = palette.halo;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/** Trains, every frame */
export function paintTrains(
  ctx: CanvasRenderingContext2D,
  view: View,
  layout: Layout,
  palette: Palette,
  focus: Focus,
  trains: Iterable<Tracked>,
  pulse: number,
  you: Point | null
): Map<string, Hit> {
  const hits = new Map<string, Hit>();
  const width = lineWidth(view.k);
  // a carriage wider than its line, squared off so it can't be taken for a station's ring
  const length = width * 3.6;
  const girth = width * 1.8;
  const showHeading = detailed(view.k);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.lineJoin = 'round';

  for (const train of trains) {
    const { shown, reading } = train;
    if (!focus.shown.has(reading.line)) continue;
    const base = toScreen(view, shown);
    const p = { x: base.x + shown.ox * width, y: base.y + shown.oy * width };
    if (!visible(view, p)) continue;
    const selected = train.key === focus.train;
    ctx.globalAlpha = Math.max(0, train.opacity) * lineAlpha(focus, reading.line);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(shown.angle);
    if (selected) ring(ctx, palette, { x: 0, y: 0 }, length * 0.8 + 3 + Math.sin(pulse) * 1.5);
    ctx.fillStyle = palette.lines[reading.line];
    ctx.strokeStyle = palette.edges[reading.line];
    ctx.lineWidth = Math.min(1.25, girth * 0.2);
    ctx.beginPath();
    ctx.roundRect(-length / 2, -girth / 2, length, girth, 1.5);
    ctx.fill();
    ctx.stroke();
    if (showHeading) {
      // a chevron at the front, pointing the way it's heading
      ctx.strokeStyle = palette.tints[reading.line];
      ctx.lineWidth = girth * 0.2;
      ctx.beginPath();
      ctx.moveTo(length / 2 - girth * 0.85, -girth * 0.275);
      ctx.lineTo(length / 2 - girth * 0.45, 0);
      ctx.lineTo(length / 2 - girth * 0.85, girth * 0.275);
      ctx.stroke();
    }
    ctx.restore();
    if (!train.gone) hits.set(train.key, { ...p, radius: Math.max(14, length) });
  }
  ctx.globalAlpha = 1;
  if (focus.station !== null) {
    ring(ctx, palette, toScreen(view, layout.at[focus.station]), Math.max(12, width * 2.6));
  }
  if (you) {
    const p = toScreen(view, layout.place(you));
    ctx.fillStyle = palette.halo;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.paper;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  return hits;
}
