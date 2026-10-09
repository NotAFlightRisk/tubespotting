<script lang="ts">
  import { afterNavigate, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import About from '#lib/components/About.svelte';
  import Board from '#lib/components/Board.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import LineDetail from '#lib/components/LineDetail.svelte';
  import Search from '#lib/components/Search.svelte';
  import StationDetail from '#lib/components/StationDetail.svelte';
  import TrainDetail from '#lib/components/TrainDetail.svelte';
  import type { Style } from '#lib/layout.js';
  import { isLineId, isModeId, lineById, linesIn, type LineId, type ModeId } from '#lib/lines.js';
  import { Live } from '#lib/live.svelte.js';
  import TubeMap, { type Tap } from '#lib/map/TubeMap.svelte';
  import { description, site, source, title } from '#lib/meta.js';
  import { distance, project, stationById, stations, type Point } from '#lib/network.js';
  import { swipeToClose } from '#lib/swipe.js';
  import { Theme } from '#lib/theme.svelte.js';

  type Selection =
    | { kind: 'line'; id: LineId }
    | { kind: 'station'; index: number }
    | { kind: 'train'; key: string }
    | { kind: 'about' }
    | null;

  const live = new Live();
  const theme = new Theme();
  const wide = new MediaQuery('min-width: 960px');
  const STALE_SECONDS = 90;
  const NEARBY_KM = 3;
  const TUBE = linesIn(['tube']);
  const SAVED = 'tubespotting:shown';
  const SAVED_STYLE = 'tubespotting:style';

  let modes = $state<ModeId[]>(['tube', 'elizabeth-line', 'dlr']);
  let style = $state<Style>('schematic');
  let selection = $state<Selection>(null);
  let follow = $state(false);
  let searching = $state(false);
  let finder: HTMLButtonElement;
  let you = $state<Point | null>(null);
  let notice = $state('');
  let now = $state(Date.now());
  let panelHeight = $state(0);
  let innerHeight = $state(800);
  let map: TubeMap;
  let routed = false;

  const shown = $derived(linesIn(modes));
  const focus = $derived({
    shown,
    line: selection?.kind === 'line' ? selection.id : null,
    station: selection?.kind === 'station' ? selection.index : null,
    train: selection?.kind === 'train' ? selection.key : null
  });
  // the sheet takes a moment to measure, so fly-tos assume it's open at full height
  const inset = $derived(
    wide.current
      ? { left: 380, bottom: 0 }
      : {
          left: 0,
          bottom: selection ? Math.max(panelHeight, Math.round(innerHeight * 0.58)) : panelHeight
        }
  );
  const running = $derived.by(() => {
    void live.snapshot;
    return [...live.fleet.trains.values()].filter(
      (train) => !train.gone && shown.has(train.reading.line)
    );
  });
  // the About sheet counts the Underground alone, whatever else is switched on
  const underground = $derived.by(() => {
    void live.snapshot;
    return [...live.fleet.trains.values()].filter(
      (train) => !train.gone && TUBE.has(train.reading.line)
    ).length;
  });
  const counts = $derived.by(() => {
    const counts = new Map<LineId, number>();
    for (const train of running)
      counts.set(train.reading.line, (counts.get(train.reading.line) ?? 0) + 1);
    return counts;
  });
  const keys = $derived(new Map(running.map((train) => [train.reading, train.key])));
  const age = $derived(live.snapshot ? (now - live.snapshot.at) / 1000 : Infinity);
  const freshness = $derived(
    !live.snapshot
      ? live.failing
        ? "Can't reach TfL"
        : 'Connecting'
      : age > STALE_SECONDS
        ? `${Math.round(age / 60)} min behind`
        : live.failing || live.snapshot.stale
          ? 'Catching up'
          : 'Live'
  );
  const about = $derived(selection?.kind === 'about');
  const tracked = $derived.by(() => {
    void live.snapshot;
    return selection?.kind === 'train' ? live.fleet.trains.get(selection.key) : undefined;
  });

  function save(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // private browsing, so it's just forgotten next visit
    }
  }

  function toggle(mode: ModeId) {
    modes = modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode];
    save(SAVED, JSON.stringify(modes));
  }

  function flipStyle() {
    style = style === 'schematic' ? 'geographic' : 'schematic';
    save(SAVED_STYLE, style);
  }

  // a link to a line or station that's switched off switches it on
  function reveal(line: LineId) {
    const { mode } = lineById(line)!;
    if (!shown.has(line)) modes = [...modes, mode];
  }

  function pickLine(id: LineId) {
    reveal(id);
    selection = { kind: 'line', id };
    follow = searching = false;
    map.flyTo(
      stations.filter((s) => s.lines.includes(id)),
      0.1
    );
  }

  function pickStation(index: number) {
    selection = { kind: 'station', index };
    follow = searching = false;
    map.flyTo([stations[index]], 0.09);
  }

  function pickTrain(key: string) {
    const train = live.fleet.trains.get(key);
    if (!train) return;
    selection = { kind: 'train', key };
    follow = true;
    searching = false;
  }

  function onpick(pick: Tap) {
    if (pick?.kind === 'train') pickTrain(pick.key);
    else if (pick?.kind === 'station') pickStation(pick.index);
    else close();
  }

  function close() {
    selection = null;
    follow = false;
  }

  function locate() {
    if (!navigator.geolocation) return (notice = "This browser can't share your location");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = (you = project(coords.longitude, coords.latitude));
        const [nearest] = stations
          .filter((s) => s.lines.some((line) => shown.has(line)))
          .sort((a, b) => distance(here, a) - distance(here, b));
        if (!nearest) return (notice = 'Switch some lines on to find your nearest station');
        const km = distance(here, nearest) / 1000;
        if (km < NEARBY_KM) return pickStation(nearest.index);
        notice = `You're ${Math.round(km)} km from the nearest station`;
        map.flyTo([here, nearest], 0.06);
      },
      () => (notice = "Couldn't get your location"),
      { maximumAge: 60_000, timeout: 10_000 }
    );
  }

  $effect(() => {
    if (!notice) return;
    const timer = setTimeout(() => (notice = ''), 4000);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    const url = new URL(location.href);
    url.searchParams.delete('line');
    url.searchParams.delete('station');
    if (selection?.kind === 'line') url.searchParams.set('line', selection.id);
    if (selection?.kind === 'station')
      url.searchParams.set('station', stations[selection.index].id);
    if (routed && url.href !== location.href) replaceState(url, {});
  });

  afterNavigate(() => (routed = true));

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED) ?? 'null');
      if (Array.isArray(saved)) modes = saved.filter(isModeId);
      const savedStyle = localStorage.getItem(SAVED_STYLE);
      if (savedStyle === 'geographic' || savedStyle === 'schematic') style = savedStyle;
    } catch {
      // nothing saved, or nothing we can read
    }
    const line = page.url.searchParams.get('line');
    const station = stationById.get(page.url.searchParams.get('station') ?? '');
    if (line && isLineId(line)) pickLine(line);
    else if (station) {
      reveal(station.lines[0]);
      pickStation(station.index);
    }

    live.start();
    const tick = setInterval(() => (now = Date.now()), 1000);
    const wake = () => (document.hidden ? live.stop() : live.start());
    document.addEventListener('visibilitychange', wake);
    return () => {
      live.stop();
      clearInterval(tick);
      document.removeEventListener('visibilitychange', wake);
    };
  });
</script>

<svelte:window
  bind:innerHeight
  onkeydown={(event) => {
    const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea');
    if (event.key !== '/' || typing || searching) return;
    event.preventDefault();
    searching = true;
  }}
/>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={site} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={site} />
  <meta property="og:image" content="{site}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="app" class:open={selection !== null}>
  <TubeMap
    bind:this={map}
    {live}
    {focus}
    {follow}
    {inset}
    {style}
    dark={theme.dark}
    {you}
    label="Map of the London Underground with {running.length} trains moving live"
    {onpick}
    onwander={() => (follow = false)}
  />

  <aside class="panel" bind:clientHeight={panelHeight}>
    <header class="masthead">
      <div class="brand">
        <h1>tubespotting</h1>
        <p class="pill" class:live={freshness === 'Live'}>
          <span class="beat" aria-hidden="true"></span>
          {#if live.snapshot}<span>{running.length} trains</span><span aria-hidden="true">·</span
            >{/if}
          <span role="status">{freshness}</span>
        </p>
      </div>
      <div class="actions">
        <button
          type="button"
          aria-label="Search"
          aria-expanded={searching}
          bind:this={finder}
          onclick={() => (searching = !searching)}
        >
          <Icon name="search" />
        </button>
        <button
          type="button"
          aria-label="Dark mode"
          aria-pressed={theme.dark}
          onclick={() => theme.flip()}
        >
          <Icon name={theme.dark ? 'sun' : 'moon'} />
        </button>
        <button
          type="button"
          class="about"
          aria-label="About this map"
          aria-expanded={about}
          onclick={() => (about ? close() : (selection = { kind: 'about' }))}
        >
          <Icon name="info" />
        </button>
      </div>
      {#if searching}
        <div class="finder">
          <Search
            {shown}
            onpickstation={pickStation}
            onpickline={pickLine}
            onclose={() => {
              searching = false;
              finder.focus();
            }}
          />
        </div>
      {/if}
    </header>

    {#if selection}
      <section class="sheet" class:full={about} aria-label="Details">
        <div class="grip" aria-hidden="true" {@attach swipeToClose(close)}></div>
        {#if selection.kind !== 'about'}
          <button type="button" class="dismiss" aria-label="Back to all lines" onclick={close}>
            <Icon name={wide.current ? 'back' : 'close'} />
            <span>All lines</span>
          </button>
        {/if}
        {#if selection.kind === 'line'}
          {@const id = selection.id}
          <LineDetail
            line={lineById(id)!}
            status={live.snapshot?.status.find((s) => s.id === id)}
            trains={running.filter((train) => train.reading.line === id)}
            waiting={!live.snapshot}
            {now}
            onpicktrain={pickTrain}
          />
        {:else if selection.kind === 'station'}
          <StationDetail
            station={stations[selection.index]}
            {shown}
            snapshot={live.snapshot}
            {now}
            keyOf={(reading) => keys.get(reading)}
            onpicktrain={pickTrain}
          />
        {:else if selection.kind === 'train'}
          <TrainDetail
            train={tracked}
            at={live.snapshot?.at ?? now}
            {now}
            {follow}
            onfollow={(on) => (follow = on)}
            onpickstation={pickStation}
          />
        {:else}
          <About trains={live.snapshot ? underground : null} onclose={close} />
        {/if}
      </section>
    {:else}
      <Board
        status={live.snapshot?.status ?? []}
        {counts}
        waiting={!live.snapshot}
        {shown}
        {modes}
        onpick={pickLine}
        ontoggle={toggle}
      />
      <footer class="links">
        <button type="button" class="link primary" onclick={() => (selection = { kind: 'about' })}>
          <Icon name="info" size={16} />About
        </button>
        <a class="link" href={source} target="_blank" rel="noopener"
          ><Icon name="github" size={16} />GitHub</a
        >
      </footer>
    {/if}
  </aside>

  <div class="controls" style:--lift="{inset.bottom}px">
    {#if notice}<p class="notice" role="status">{notice}</p>{/if}
    <button
      type="button"
      aria-label="Tube map"
      aria-pressed={style === 'schematic'}
      title={style === 'schematic' ? 'Show the real geography' : 'Show the tube map'}
      onclick={flipStyle}
    >
      <Icon name={style === 'schematic' ? 'map' : 'tube'} />
    </button>
    <button type="button" class="zoom" aria-label="Zoom in" onclick={() => map.zoomBy(1.6)}
      ><Icon name="plus" /></button
    >
    <button type="button" class="zoom" aria-label="Zoom out" onclick={() => map.zoomBy(1 / 1.6)}
      ><Icon name="minus" /></button
    >
    <button type="button" aria-label="Show where I am" onclick={locate}
      ><Icon name="locate" /></button
    >
  </div>
</div>

<style>
  .app {
    position: fixed;
    inset: 0;
  }

  .masthead {
    position: fixed;
    top: max(var(--space-3), env(safe-area-inset-top));
    left: var(--space-3);
    right: var(--space-3);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }

  .brand {
    display: grid;
    gap: 2px;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  h1 {
    margin: 0;
    font: 20px/1.1 var(--font-display);
    color: var(--accent);
    letter-spacing: 0.01em;
  }

  .pill {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;

    .beat {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--warn);
    }

    &.live .beat {
      background: var(--good);
      animation: beat 2.4s var(--ease-out) infinite;
    }
  }

  @keyframes beat {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--good) 55%, transparent);
    }
    100% {
      box-shadow: 0 0 0 7px transparent;
    }
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .actions button,
  .controls button {
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);

    &:hover {
      background: var(--surface-sunk);
    }
  }

  .finder {
    flex-basis: 100%;
  }

  .panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .sheet {
    max-height: 58dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 var(--space-4) var(--space-5);
    border-radius: var(--radius) var(--radius) 0 0;
    background: var(--surface);
    box-shadow: var(--shadow);
    animation: rise 320ms var(--ease-out);
  }

  @keyframes rise {
    from {
      translate: 0 24px;
      opacity: 0;
    }
  }

  /* stays put while the sheet scrolls, so it can always be pulled down */
  .grip {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    place-items: center;
    box-sizing: content-box;
    height: var(--space-5);
    margin-inline: calc(-1 * var(--space-4));
    background: var(--surface);
    touch-action: none;
    cursor: grab;

    &::before {
      content: '';
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--rule);
    }
  }

  .dismiss {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 36px;
    margin: 0 0 var(--space-3) calc(-1 * var(--space-2));
    padding: 0 var(--space-2);
    border: 0;
    border-radius: var(--radius-small);
    background: none;
    color: var(--text-muted);
    font-size: 13px;

    &:hover {
      background: var(--surface-sunk);
      color: var(--text);
    }
  }

  .controls {
    position: fixed;
    right: var(--space-3);
    bottom: calc(var(--lift) + var(--space-3) + env(safe-area-inset-bottom));
    display: grid;
    justify-items: end;
    gap: var(--space-2);
    transition: bottom 320ms var(--ease-out);
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }

  .links {
    display: none;
  }

  .notice {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-small);
    background: var(--text);
    color: var(--paper);
    font-size: 13px;
  }

  @media (max-width: 959px) {
    .app.open .controls {
      display: none;
    }

    /* phones pinch to zoom */
    .controls .zoom {
      display: none;
    }

    /* the panel floats over the map, so a drag that misses the sheet or a line still moves it */
    .panel {
      pointer-events: none;
    }

    .sheet {
      pointer-events: auto;
    }

    /* About is all reading and no map, so it takes the whole screen */
    .sheet.full {
      position: fixed;
      inset: 0;
      z-index: 2;
      max-height: none;
      padding-bottom: calc(var(--space-5) + env(safe-area-inset-bottom));
      border-radius: 0;

      .grip {
        padding-top: env(safe-area-inset-top);
      }
    }
  }

  @media (min-width: 960px) {
    .panel {
      top: 0;
      right: auto;
      width: var(--panel-width);
      display: flex;
      flex-direction: column;
      background: var(--surface);
      box-shadow: var(--shadow);
      overflow-y: auto;
    }

    .masthead {
      position: sticky;
      top: 0;
      left: auto;
      right: auto;
      z-index: 1;
      padding: var(--space-4);
      background: var(--surface);
      border-bottom: 1px solid var(--rule);
    }

    .brand {
      padding: 0;
      box-shadow: none;
    }

    h1 {
      font-size: 24px;
    }

    .actions button {
      box-shadow: none;
      background: var(--surface-sunk);
    }

    /* the footer has it on desktop */
    .actions .about {
      display: none;
    }

    .links {
      position: sticky;
      bottom: 0;
      display: flex;
      gap: var(--space-2);
      margin-top: auto;
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--rule);
      background: var(--surface);
    }

    .link {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-height: 36px;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-small);
      background: none;
      box-shadow: inset 0 0 0 1.5px var(--accent);
      color: var(--accent);
      font: 14px/1.1 var(--font-display);
      text-decoration: none;

      &:hover {
        background: var(--surface-sunk);
      }

      &.primary {
        background: var(--accent);
        box-shadow: none;
        color: var(--accent-ink);

        &:hover {
          filter: brightness(1.15);
        }
      }
    }

    .grip {
      display: none;
    }

    .sheet {
      max-height: none;
      overflow: visible;
      border-radius: 0;
      box-shadow: none;
      animation: none;
      padding: var(--space-4);
    }
  }
</style>
