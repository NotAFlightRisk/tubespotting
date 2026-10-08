<script lang="ts">
  import { select } from 'd3-selection';
  import 'd3-transition';
  import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
  import { onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import type { Live } from '#lib/live.svelte.js';
  import type { Point } from '#lib/network.js';
  import {
    paintLabels,
    paintNetwork,
    paintTrains,
    type Focus,
    type Hit,
    type Label,
    type Palette
  } from './painter.js';
  import { readPalette } from './palette.js';
  import { toWorld, type View } from './view.js';

  export type Tap = { kind: 'train'; key: string } | { kind: 'station'; index: number } | null;

  interface Props {
    live: Live;
    focus: Pick<Focus, 'line' | 'station' | 'train'>;
    follow: boolean;
    inset: { left: number; bottom: number };
    label: string;
    you: Point | null;
    onpick: (tap: Tap) => void;
    onwander: () => void;
  }

  let { live, focus, follow, inset, label, you, onpick, onwander }: Props = $props();

  const calm = new MediaQuery('prefers-reduced-motion: reduce');
  const dark = new MediaQuery('prefers-color-scheme: dark');
  const LONDON = { x0: -42_000, y0: -28_000, x1: 38_000, y1: 22_000 };
  // roughly zones 1 and 2, or just zone 1 on a phone
  const START = (wide: boolean) => [
    { x: wide ? -8_000 : -3_800, y: wide ? -5_500 : -3_000 },
    { x: wide ? 8_000 : 3_800, y: wide ? 5_000 : 2_600 }
  ];

  let wrap: HTMLDivElement;
  let base: HTMLCanvasElement;
  let top: HTMLCanvasElement;
  let behaviour: ZoomBehavior<HTMLCanvasElement, unknown>;
  let transform = zoomIdentity;
  let size = { width: 0, height: 0 };
  let palette: Palette | null = null;
  let dirty = true;
  let stationHits = new Map<number, Hit>();
  let labels: Label[] = [];
  let trainHits = new Map<string, Hit>();

  const view = (): View => ({ k: transform.k, x: transform.x, y: transform.y, ...size });

  const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

  /** Zooms to fit some points in the bit of the map the panels aren't covering */
  export function flyTo(points: Point[], maxK = 0.12, instant = false) {
    if (!points.length || !size.width) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const [w, h] = [size.width - inset.left, size.height - inset.bottom];
    const span = { x: Math.max(...xs) - Math.min(...xs), y: Math.max(...ys) - Math.min(...ys) };
    const k = clamp(Math.min((w * 0.8) / (span.x || 1), (h * 0.8) / (span.y || 1)), 0.005, maxK);
    const centre = {
      x: (Math.max(...xs) + Math.min(...xs)) / 2,
      y: (Math.max(...ys) + Math.min(...ys)) / 2
    };
    const target = zoomIdentity
      .translate(inset.left + w / 2, h / 2)
      .scale(k)
      .translate(-centre.x, -centre.y);
    select(top)
      .transition()
      .duration(instant || calm.current ? 0 : 1100)
      .call(behaviour.transform, target);
  }

  export function zoomBy(factor: number) {
    select(top)
      .transition()
      .duration(calm.current ? 0 : 300)
      .call(behaviour.scaleBy, factor);
  }

  function nearest<K>(hits: Map<K, Hit>, at: Point): K | null {
    let best: K | null = null;
    let bestDistance = Infinity;
    for (const [key, hit] of hits) {
      const d = Math.hypot(hit.x - at.x, hit.y - at.y);
      if (d < hit.radius && d < bestDistance) [best, bestDistance] = [key, d];
    }
    return best;
  }

  function pickAt(at: Point): Tap {
    const train = nearest(trainHits, at);
    if (train !== null) return { kind: 'train', key: train };
    const station = nearest(stationHits, at);
    return station !== null ? { kind: 'station', index: station } : null;
  }

  const pointer = (event: MouseEvent) => ({ x: event.offsetX, y: event.offsetY });

  function onkeydown(event: KeyboardEvent) {
    const pan: Record<string, [number, number]> = {
      ArrowLeft: [120, 0],
      ArrowRight: [-120, 0],
      ArrowUp: [0, 120],
      ArrowDown: [0, -120]
    };
    if (pan[event.key]) {
      const [dx, dy] = pan[event.key];
      select(top).call(behaviour.translateBy, dx / transform.k, dy / transform.k);
    } else if (event.key === '+' || event.key === '=') zoomBy(1.5);
    else if (event.key === '-') zoomBy(1 / 1.5);
    else if (event.key === 'Escape') onpick(null);
    else return;
    event.preventDefault();
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    size = { width: wrap.clientWidth, height: wrap.clientHeight };
    for (const canvas of [base, top]) {
      canvas.width = Math.round(size.width * ratio);
      canvas.height = Math.round(size.height * ratio);
      canvas.getContext('2d')!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    dirty = true;
  }

  $effect(() => {
    void dark.current;
    palette = readPalette(wrap);
    dirty = true;
  });

  // picking a line fades the rest back rather than cutting
  let fading = { from: null as Focus['line'], to: null as Focus['line'], since: 0 };
  const FADE_MS = 400;

  $effect(() => {
    if (focus.line !== fading.to)
      fading = { from: fading.to, to: focus.line, since: performance.now() };
    void [focus.station, focus.train];
    dirty = true;
  });

  const lensAt = (now: number): Focus => {
    const progress = calm.current ? 1 : Math.min(1, (now - fading.since) / FADE_MS);
    return { ...focus, previous: fading.from, fade: 1 - (1 - progress) ** 3 };
  };

  onMount(() => {
    const baseCtx = base.getContext('2d')!;
    const topCtx = top.getContext('2d')!;
    behaviour = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.004, 1.6])
      .translateExtent([
        [LONDON.x0, LONDON.y0],
        [LONDON.x1, LONDON.y1]
      ])
      .on('zoom', (event) => {
        transform = event.transform;
        dirty = true;
        if (event.sourceEvent) onwander();
      });
    select(top).call(behaviour).on('dblclick.zoom', null);

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();
    // moving to a screen with a different pixel density doesn't resize anything
    let density: MediaQueryList;
    const watchDensity = () => {
      density = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      density.addEventListener('change', onDensity, { once: true });
    };
    const onDensity = () => {
      resize();
      watchDensity();
    };
    watchDensity();
    flyTo(START(size.width >= 600), 1, true);
    document.fonts?.load('12px "Hammersmith One"').then(() => (dirty = true));

    let last = performance.now();
    let painted = 0;
    let frame = requestAnimationFrame(function tick(now) {
      frame = requestAnimationFrame(tick);
      const v = view();
      const lens = lensAt(now);
      // far out, trains crawl a pixel a second, so there's no need for 60 frames of it
      const busy = dirty || lens.fade < 1 || focus.train !== null;
      const every = busy ? 0 : 1000 / clamp(v.k * 160, 12, 60);
      if (now - painted < every || !palette) return;
      const dt = Math.min(0.25, (now - last) / 1000);
      last = painted = now;
      live.fleet.step(Date.now(), dt);
      const followed = follow && focus.train ? live.fleet.trains.get(focus.train) : undefined;
      if (followed) {
        const [w, h] = [size.width - inset.left, size.height - inset.bottom];
        const want = { x: inset.left + w / 2, y: h / 2 };
        const here = { x: followed.shown.x * v.k + v.x, y: followed.shown.y * v.k + v.y };
        const k = 1 - Math.exp(-dt / 0.35);
        const [dx, dy] = [(want.x - here.x) * k, (want.y - here.y) * k];
        // the whole network repaints on every nudge, so ignore the sub-pixel ones
        if (Math.hypot(dx, dy) > 0.75) select(top).call(behaviour.translateBy, dx / v.k, dy / v.k);
      }
      if (dirty || lens.fade < 1) {
        ({ hits: stationHits, labels } = paintNetwork(baseCtx, view(), palette, lens));
        dirty = false;
      }
      trainHits = paintTrains(
        topCtx,
        view(),
        palette,
        lens,
        live.fleet.trains.values(),
        calm.current ? 0 : now / 260,
        you
      );
      paintLabels(topCtx, palette, labels);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      density.removeEventListener('change', onDensity);
      select(top).on('.zoom', null);
    };
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="map"
  bind:this={wrap}
  tabindex="0"
  role="region"
  aria-roledescription="map"
  aria-label={label}
  aria-describedby="map-keys"
  {onkeydown}
>
  <p id="map-keys" class="visually-hidden">
    Arrow keys move the map, plus and minus zoom. The line list, search and station boards have
    everything the map shows.
  </p>
  <canvas bind:this={base} aria-hidden="true"></canvas>
  <canvas
    bind:this={top}
    class="live"
    aria-hidden="true"
    onclick={(event) => onpick(pickAt(pointer(event)))}
    ondblclick={(event) => {
      const at = toWorld(view(), pointer(event));
      flyTo([at], Math.min(1.6, transform.k * 2.2));
    }}
    onpointermove={(event) => {
      if (event.buttons) return;
      top.style.cursor = pickAt(pointer(event)) ? 'pointer' : '';
    }}
  ></canvas>
</div>

<style>
  .map {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--paper);
    touch-action: none;

    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .live {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    &:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: -3px;
    }
  }
</style>
