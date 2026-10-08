import type { Point } from '#lib/network.js';

/** Screen = world * k + (x, y), world being metres from Charing Cross */
export interface View {
  k: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const toScreen = (view: View, p: Point): Point => ({
  x: p.x * view.k + view.x,
  y: p.y * view.k + view.y
});

export const toWorld = (view: View, p: Point): Point => ({
  x: (p.x - view.x) / view.k,
  y: (p.y - view.y) / view.k
});

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Line weight in CSS pixels, thickening gently as you zoom in */
export const lineWidth = (k: number) => clamp(2 + Math.log2(k / 0.01) * 1.25, 2, 7.5);

export const labelSize = (k: number) => Math.round(clamp(11 + Math.log2(k / 0.03) * 1.6, 11, 15));

export const visible = (view: View, p: Point, margin = 40) =>
  p.x > -margin && p.y > -margin && p.x < view.width + margin && p.y < view.height + margin;
