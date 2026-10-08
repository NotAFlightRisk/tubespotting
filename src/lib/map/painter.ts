import type { Tracked } from '#lib/fleet.js';
import { LINE_IDS, type LineId } from '#lib/lines.js';
import { stations, strand, thames, tracks, type Point, type Station } from '#lib/network.js';
import { labelSize, lineWidth, toScreen, visible, type View } from './view.js';

export interface Palette {
  paper: string;
  river: string;
  stationInk: string;
  ring: string;
  ringFill: string;
  halo: string;
  lines: Record<LineId, string>;
}

export interface Focus {
  line: LineId | null;
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

const FADED = 0.16;
const RIVER_METRES = 230;
const FONT = '"Hammersmith One", system-ui, sans-serif';

const lineAlpha = (focus: Focus, line: LineId) => (focus.line && focus.line !== line ? FADED : 1);

// a hub's stations that share a name get one label between them
const labelGroups = (() => {
  const groups = new Map<string, Station[]>();
  for (const station of stations) {
    const key = `${station.hub ?? station.id}|${station.name}`;
    groups.set(key, [...(groups.get(key) ?? []), station]);
  }
  return [...groups.values()].map((members) => ({
    name: members[0].name,
    members,
    lines: new Set(members.flatMap((m) => m.lines)),
    x: members.reduce((sum, m) => sum + m.x, 0) / members.length,
    y: members.reduce((sum, m) => sum + m.y, 0) / members.length
  }));
})();

const hubs = (() => {
  const byHub = new Map<string, Station[]>();
  for (const station of stations) {
    if (station.hub) byHub.set(station.hub, [...(byHub.get(station.hub) ?? []), station]);
  }
  return [...byHub.values()].filter((members) => members.length > 1);
})();

const interchanges = new Set(
  stations.filter((s) => s.lines.length > 1 || hubs.some((m) => m.includes(s))).map((s) => s.index)
);

// the track a one-line station's tick hangs off
const tickTrack = new Map(
  stations.map((s) => [
    s.index,
    tracks.find((t) => t.lines.includes(s.lines[0]) && (t.a === s.index || t.b === s.index))
  ])
);

// does the segment's box overlap the screen, so long tracks crossing it still get drawn
const crosses = (view: View, a: Point, b: Point, margin = 20) =>
  Math.max(a.x, b.x) > -margin &&
  Math.min(a.x, b.x) < view.width + margin &&
  Math.max(a.y, b.y) > -margin &&
  Math.min(a.y, b.y) < view.height + margin;

const strandOffset = (a: number, b: number, line: LineId, width: number) => {
  const { slot, normal } = strand(a, b, line);
  return { x: normal.x * slot * width, y: normal.y * slot * width };
};

function drawRiver(ctx: CanvasRenderingContext2D, view: View, palette: Palette) {
  ctx.strokeStyle = palette.river;
  ctx.lineWidth = Math.max(3, RIVER_METRES * view.k);
  ctx.beginPath();
  for (const way of thames) {
    way.forEach((p, i) => {
      const s = toScreen(view, p);
      if (i) ctx.lineTo(s.x, s.y);
      else ctx.moveTo(s.x, s.y);
    });
  }
  ctx.stroke();
}

function drawTracks(ctx: CanvasRenderingContext2D, view: View, palette: Palette, focus: Focus) {
  const width = lineWidth(view.k);
  ctx.lineWidth = width;
  for (const line of LINE_IDS) {
    ctx.globalAlpha = lineAlpha(focus, line);
    ctx.strokeStyle = palette.lines[line];
    ctx.beginPath();
    for (const track of tracks) {
      if (!track.lines.includes(line)) continue;
      const a = toScreen(view, stations[track.a]);
      const b = toScreen(view, stations[track.b]);
      if (!crosses(view, a, b)) continue;
      const off = strandOffset(track.a, track.b, line, width);
      ctx.moveTo(a.x + off.x, a.y + off.y);
      ctx.lineTo(b.x + off.x, b.y + off.y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawStations(
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette,
  focus: Focus,
  hits: Map<number, Hit>
) {
  const width = lineWidth(view.k);
  const ring = Math.max(1.2, width * 0.42);
  const showTicks = view.k > 0.018;

  for (const members of hubs) {
    const points = members.map((m) => toScreen(view, m));
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
    const p = toScreen(view, station);
    if (!visible(view, p)) continue;
    const dim = focus.line && !station.lines.includes(focus.line);
    ctx.globalAlpha = dim ? FADED : 1;
    if (interchanges.has(station.index)) {
      const radius = Math.max(width * 0.95, (station.lines.length * width) / 2 + ring);
      ctx.fillStyle = palette.ringFill;
      ctx.strokeStyle = palette.ring;
      ctx.lineWidth = ring;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      hits.set(station.index, { ...p, radius: radius + 6 });
    } else {
      const line = station.lines[0];
      const track = tickTrack.get(station.index);
      if (showTicks && track) {
        const { slot, normal } = strand(track.a, track.b, line);
        const side = slot < 0 ? -1 : 1;
        const base = { x: p.x + normal.x * slot * width, y: p.y + normal.y * slot * width };
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

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function placeLabels(
  ctx: CanvasRenderingContext2D,
  view: View,
  focus: Focus,
  hits: Map<number, Hit>
): Label[] {
  const labels: Label[] = [];
  const size = labelSize(view.k);
  const width = lineWidth(view.k);
  ctx.font = `${size}px ${FONT}`;
  // interchange rings stay readable, so labels go round them
  const placed: Box[] = [...interchanges].flatMap((index) => {
    const hit = hits.get(index);
    const r = hit ? hit.radius - 6 : 0;
    return hit ? [{ x: hit.x - r, y: hit.y - r, w: r * 2, h: r * 2 }] : [];
  });
  const wanted = labelGroups
    .map((group) => {
      const focused = group.members.some((m) => m.index === focus.station);
      const onLine = focus.line ? group.lines.has(focus.line) : true;
      const weight = focused ? 100 : group.lines.size + (onLine && focus.line ? 10 : 0);
      const threshold = focused
        ? 0
        : focus.line && onLine
          ? 0.012
          : [0.06, 0.03, 0.016][Math.min(group.lines.size, 3) - 1];
      return { group, weight, show: view.k >= threshold && (onLine || focused) };
    })
    .filter((item) => item.show)
    .sort((a, b) => b.weight - a.weight);

  for (const { group } of wanted) {
    const anchor = toScreen(view, group);
    if (!visible(view, anchor)) continue;
    const text = group.name;
    const w = ctx.measureText(text).width;
    const gap = width * Math.max(1.4, group.lines.size * 0.6) + 4;
    const options: (Box & { align: CanvasTextAlign })[] = [
      { x: anchor.x + gap, y: anchor.y - size / 2, w, h: size, align: 'left' },
      { x: anchor.x - gap - w, y: anchor.y - size / 2, w, h: size, align: 'right' },
      { x: anchor.x - w / 2, y: anchor.y - gap - size, w, h: size, align: 'center' },
      { x: anchor.x - w / 2, y: anchor.y + gap, w, h: size, align: 'center' }
    ];
    const spot = options.find((box) => !placed.some((other) => overlaps(box, other)));
    if (!spot) continue;
    placed.push({ x: spot.x - 3, y: spot.y - 2, w: spot.w + 6, h: spot.h + 4 });
    const x = spot.align === 'left' ? spot.x : spot.align === 'right' ? spot.x + w : spot.x + w / 2;
    labels.push({ text, x, y: spot.y + size / 2, align: spot.align, size });
  }
  return labels;
}

/** Names go on top of the trains, so a busy station still says what it is */
export function paintLabels(ctx: CanvasRenderingContext2D, palette: Palette, labels: Label[]) {
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
}

/** The network itself, redrawn only when the view, focus or theme changes */
export function paintNetwork(
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette,
  focus: Focus
): { hits: Map<number, Hit>; labels: Label[] } {
  const hits = new Map<number, Hit>();
  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawRiver(ctx, view, palette);
  drawTracks(ctx, view, palette, focus);
  drawStations(ctx, view, palette, focus, hits);
  return { hits, labels: placeLabels(ctx, view, focus, hits) };
}

/** Trains, every frame */
export function paintTrains(
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette,
  focus: Focus,
  trains: Iterable<Tracked>,
  pulse: number,
  you: Point | null
): Map<string, Hit> {
  const hits = new Map<string, Hit>();
  const width = lineWidth(view.k);
  const length = Math.max(7, width * 2.7);
  const girth = Math.max(4.5, width * 1.55);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.lineJoin = 'round';

  for (const train of trains) {
    const { shown, reading } = train;
    const base = toScreen(view, shown);
    const p = { x: base.x + shown.ox * width, y: base.y + shown.oy * width };
    if (!visible(view, p)) continue;
    const selected = train.key === focus.train;
    ctx.globalAlpha = Math.max(0, train.opacity) * lineAlpha(focus, reading.line);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(shown.angle);
    if (selected) {
      ctx.fillStyle = palette.halo;
      ctx.globalAlpha *= 0.28 + 0.12 * Math.sin(pulse);
      ctx.beginPath();
      ctx.arc(0, 0, length * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.max(0, train.opacity);
    }
    ctx.fillStyle = palette.lines[reading.line];
    ctx.strokeStyle = palette.paper;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-length / 2, -girth / 2, length, girth, girth / 2);
    ctx.fill();
    ctx.stroke();
    if (length > 13) {
      ctx.fillStyle = palette.paper;
      ctx.beginPath();
      ctx.arc(length / 2 - girth / 2, 0, girth * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    hits.set(train.key, { ...p, radius: Math.max(14, length) });
  }
  ctx.globalAlpha = 1;
  if (you) {
    const p = toScreen(view, you);
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
