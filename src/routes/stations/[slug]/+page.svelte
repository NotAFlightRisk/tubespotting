<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import Departures from '#lib/components/Departures.svelte';
  import Feed from '#lib/components/Feed.svelte';
  import Head from '#lib/components/Head.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import LineChips from '#lib/components/LineChips.svelte';
  import MapButtons from '#lib/components/MapButtons.svelte';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import { t } from '#lib/i18n/i18n.svelte.js';
  import { linesIn } from '#lib/lines.js';
  import { live } from '#lib/live.svelte.js';
  import TubeMap, { type Tap } from '#lib/map/TubeMap.svelte';
  import { placeBySlug, placeOf, stations } from '#lib/network.js';
  import Settings from '#lib/settings/Settings.svelte';
  import { load, looks, settings } from '#lib/settings/settings.svelte.js';
  import Around from '#lib/station/Around.svelte';
  import Busy from '#lib/station/Busy.svelte';
  import Facts from '#lib/station/Facts.svelte';
  import Notices from '#lib/station/Notices.svelte';
  import { stationData, stationDescription, stationTitle } from '#lib/station/seo.js';
  import Status from '#lib/station/Status.svelte';
  import { nextCall } from '#lib/status.js';

  let { data } = $props();

  const place = $derived(placeBySlug.get(data.slug)!);
  const lines = $derived(new Set(place.lines));
  // its own lines are always on, without switching them on for the map back home
  const shown = $derived(new Set([...linesIn(settings.modes), ...place.lines]));
  const running = $derived.by(() => {
    void live.snapshot;
    return [...live.fleet.trains.values()].filter(
      (train) => !train.gone && lines.has(train.reading.line)
    ).length;
  });

  let map: TubeMap;
  let picked = $state<string | null>(null);
  let zoom = $state(0);
  let configuring = $state(false);
  let notices = $state<Record<string, string[]>>({});

  const focus = $derived({
    shown,
    lines,
    station: place.members[0].index,
    train: picked,
    alone: true
  });
  // TfL files a line's disruption under each of its stations too, where Line status says it already
  const said = $derived.by(() => {
    const reasons = new Set(live.snapshot?.status.map((s) => s.reason));
    const all = new Set(place.members.flatMap((s) => notices[s.id] ?? []));
    return [...all].filter((notice) => !reasons.has(notice));
  });
  // with a column to spare, notices go at the top of it rather than in a long line over both;
  // they only ever arrive after the page has opened, so the server never has to guess
  const wide = new MediaQuery('min-width: 960px');

  const recentre = (instant = false) => map.flyTo(place.members, 0.09, instant);

  function onpick(tap: Tap) {
    if (tap?.kind === 'station') {
      const there = placeOf(tap.index);
      if (there !== place) goto(`/stations/${there.slug}`);
    } else picked = tap?.kind === 'train' ? tap.key : null;
  }

  // a row picks its train out, and the map moves to show it on its way in
  function pickTrain(key: string) {
    picked = picked === key ? null : key;
    const train = live.fleet.trains.get(key);
    if (picked && train)
      map.flyTo([...place.members, stations[nextCall(train, live.now).station]], 0.09);
  }

  // another station's page keeps this one and its map, which glides over to it
  let arrived = false;
  $effect(() => {
    void place;
    untrack(() => {
      picked = null;
      recentre(!arrived);
      arrived = true;
    });
  });

  $effect(() => {
    live.every = settings.refresh * 1000;
  });

  onMount(() => {
    load();
    fetch('/api/notices')
      .then((res) => (res.ok ? res.json() : {}))
      .then((got) => (notices = got))
      .catch(() => {});
    return live.connect();
  });
</script>

<Head
  title={stationTitle(place)}
  description={stationDescription(place)}
  path="/stations/{place.slug}"
  data={stationData(place, data.facts)}
/>

<div class="station scrolls">
  <SiteHeader><Feed trains={running} /></SiteHeader>

  <main>
    <div class="intro">
      <nav aria-label={t.station.trail}>
        <ol class="trail">
          <li><a href="/">{t.station.liveMap}</a></li>
          <li><a href="/stations">{t.stations.title}</a></li>
          <li aria-current="page">{place.name}</li>
        </ol>
      </nav>
      <div class="title floating">
        <h1>{place.name}</h1>
        <button
          type="button"
          aria-label={t.page.settings}
          aria-haspopup="dialog"
          onclick={() => (configuring = true)}
        >
          <Icon name="settings" />
        </button>
      </div>
      <LineChips lines={place.lines} />
      {#if data.facts?.zone || data.facts?.night}
        <p class="tags">
          {#if data.facts.zone}<span>{t.facts.zone} {data.facts.zone}</span>{/if}
          {#if data.facts.night}<span>{t.facts.night}</span>{/if}
        </p>
      {/if}
      {#if !wide.current}<Notices notices={said} />{/if}
    </div>

    <div class="view">
      <TubeMap
        bind:this={map}
        bind:level={zoom}
        {live}
        {focus}
        follow={false}
        inset={{ left: 0, bottom: 0 }}
        style={settings.style}
        dark={looks.dark}
        calm={looks.calm}
        you={null}
        inPage
        label={t.map.station(place.name)}
        {onpick}
        onwander={() => {}}
      />
      <div class="controls floating">
        <MapButtons onzoom={(by) => map.zoomBy(by)} />
        <button type="button" aria-label={t.station.recentre} onclick={() => recentre()}>
          <Icon name="centre" />
        </button>
      </div>
    </div>

    <div class="sections">
      <section aria-labelledby="departures">
        <h2 id="departures">{t.station.departures}</h2>
        <Departures
          {place}
          {lines}
          snapshot={live.snapshot}
          now={live.now}
          trainOf={live.trainOf}
          full
          {picked}
          onpicktrain={pickTrain}
        />
      </section>
      <div class="more">
        {#if wide.current}<Notices notices={said} />{/if}
        <Status lines={place.lines} status={live.snapshot?.status ?? []} />
        {#if data.busy}<Busy busy={data.busy} />{/if}
        <Around {place} />
        {#if data.facts}<Facts facts={data.facts} />{/if}
        <a class="open" href="/?station={place.members[0].id}">
          <Icon name="map" />{t.station.onMap}
        </a>
      </div>
    </div>
  </main>
</div>

{#if configuring}
  <Settings {zoom} onzoom={(level) => map.zoomTo(level)} onclose={() => (configuring = false)} />
{/if}

<style>
  .station {
    min-height: 100dvh;
    background: var(--surface);
  }

  .intro {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-4);
  }

  .trail {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text-muted);
    font-size: 13px;

    li + li::before {
      content: '›';
      content: '›' / '';
      padding: 0 var(--space-2);
    }
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  h1 {
    margin: 0;
    font: 30px/1.1 var(--font-display);
    color: var(--station-ink);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;

    span {
      padding: 2px var(--space-2);
      border-radius: var(--radius-small);
      background: var(--surface-sunk);
      font-size: 13px;
    }
  }

  .view {
    position: relative;
    height: clamp(240px, 42svh, 420px);
    border-block: 1px solid var(--rule);
  }

  .controls {
    position: absolute;
    right: var(--space-3);
    bottom: var(--space-3);
    display: grid;
    gap: var(--space-2);
  }

  .sections,
  .more {
    display: grid;
    gap: var(--space-6);
  }

  .sections {
    padding: var(--space-4) var(--space-4) calc(var(--space-6) + env(safe-area-inset-bottom));

    /* a default each section's own heading can still override */
    :global(:where(h2)) {
      margin: 0 0 var(--space-3);
      font: 20px/1.2 var(--font-display);
      color: var(--station-ink);
    }
  }

  .open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--tap);
    border-radius: var(--radius-small);
    box-shadow: inset 0 0 0 1.5px var(--accent);
    font: 15px/1.1 var(--font-display);
    text-decoration: none;

    &:hover {
      background: var(--surface-sunk);
    }
  }

  /* the map runs across the top third, with the boards down the left under it */
  @media (min-width: 960px) {
    main {
      display: flex;
      flex-direction: column;
    }

    .view {
      order: -1;
      height: max(280px, 100svh / 3);
      border-top: 0;
    }

    .intro,
    .sections {
      width: 100%;
      max-width: 1440px;
      margin-inline: auto;
      padding-inline: var(--space-6);
    }

    .intro {
      padding-top: var(--space-5);
    }

    .sections {
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      align-items: start;
      column-gap: var(--space-6);
    }
  }
</style>
