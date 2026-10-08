import { LINES, type LineId } from '#lib/lines.js';
import type { Palette } from './painter.js';

// the lines too dark to see on the night map get a lighter strand there
const NIGHT = new Set<LineId>(['northern', 'piccadilly', 'metropolitan', 'elizabeth', 'weaver']);

/** Tokens hold light-dark(), which only resolves once it lands on a real property */
export function readPalette(root: HTMLElement): Palette {
  const probe = document.createElement('span');
  probe.hidden = true;
  root.append(probe);
  const read = (token: string) => {
    probe.style.color = `var(${token})`;
    return getComputedStyle(probe).color;
  };
  const palette: Palette = {
    paper: read('--paper'),
    river: read('--river'),
    stationInk: read('--station-ink'),
    ring: read('--ring'),
    ringFill: read('--ring-fill'),
    halo: read('--accent'),
    lines: Object.fromEntries(
      LINES.map((line) => [line.id, NIGHT.has(line.id) ? read(`--${line.id}`) : line.colour])
    ) as Record<LineId, string>
  };
  probe.remove();
  return palette;
}
