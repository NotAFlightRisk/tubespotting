<script lang="ts">
  import type { Tracked } from '#lib/fleet.js';
  import { t } from '#lib/i18n/i18n.svelte.js';
  import type { LineId } from '#lib/lines.js';
  import { placeOf, type Station } from '#lib/network.js';
  import type { Snapshot, TrainReading } from '#lib/types.js';
  import Departures from './Departures.svelte';
  import Icon from './Icon.svelte';
  import LineChips from './LineChips.svelte';

  interface Props {
    station: Station;
    shown: Set<LineId>;
    snapshot: Snapshot | null;
    now: number;
    trainOf: (reading: TrainReading) => Tracked | undefined;
    onpicktrain: (key: string) => void;
  }

  let { station, shown, snapshot, now, trainOf, onpicktrain }: Props = $props();

  const place = $derived(placeOf(station.index));
</script>

<header>
  <h2>{station.name}</h2>
  <LineChips lines={place.lines.filter((line) => shown.has(line))} />
</header>

<a class="page" href="/stations/{place.slug}">
  <span class="eyebrow">{t.station.page}</span>
  <span class="name">{place.name}</span>
  <Icon name="forward" />
</a>

<Departures {place} lines={shown} {snapshot} {now} {trainOf} {onpicktrain} />

<style>
  header {
    display: grid;
    gap: var(--space-2);
  }

  h2 {
    margin: 0;
    font: 26px/1.1 var(--font-display);
    color: var(--station-ink);
  }

  .page {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: var(--space-2);
    margin-top: var(--space-4);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-small);
    background: var(--accent);
    color: var(--accent-ink);
    text-decoration: none;

    .eyebrow {
      font: 600 12px/1.3 var(--font-ui);
      opacity: 0.85;
    }

    .name {
      grid-row: 2;
      overflow: hidden;
      font: 17px/1.2 var(--font-display);
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    :global(svg) {
      grid-area: 1 / 2 / 3;
      transition: translate 320ms var(--ease-out);
    }

    &:hover :global(svg) {
      translate: 3px 0;
    }
  }
</style>
