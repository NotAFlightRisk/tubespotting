<script lang="ts">
  import { lineById } from '#lib/lines.js';
  import { stations, type Station } from '#lib/network.js';
  import { minutes } from '#lib/status.js';
  import type { Snapshot, TrainReading } from '#lib/types.js';

  interface Props {
    station: Station;
    snapshot: Snapshot | null;
    now: number;
    keyOf: (reading: TrainReading) => string | undefined;
    onpicktrain: (key: string) => void;
  }

  let { station, snapshot, now, keyOf, onpicktrain }: Props = $props();

  const PER_PLATFORM = 4;
  const time = new Intl.DateTimeFormat('en-GB', { timeStyle: 'medium', timeZone: 'Europe/London' });

  const clock = $derived(time.format(now));

  // a hub's stations that share a name (both Paddingtons, say) share a board
  const here = $derived(
    new Set(
      stations
        .filter(
          (s) =>
            s.index === station.index ||
            (station.hub && s.hub === station.hub && s.name === station.name)
        )
        .map((s) => s.index)
    )
  );
  const lines = $derived([
    ...new Set(stations.filter((s) => here.has(s.index)).flatMap((s) => s.lines))
  ]);

  const platforms = $derived.by(() => {
    if (!snapshot) return [];
    const rows = snapshot.trains.flatMap((train) =>
      train.stops
        .filter(([stop]) => here.has(stop))
        .slice(0, 1)
        .map(([, eta, platform]) => ({
          train,
          platform: (snapshot.platforms[platform] || 'Platform').replace(/\s+-\s+/, ' · '),
          due: (snapshot.at + eta * 1000 - now) / 1000
        }))
    );
    const grouped = new Map<string, typeof rows>();
    for (const row of rows.filter((r) => r.due > -30).sort((a, b) => a.due - b.due)) {
      const key = `${row.train.line}|${row.platform}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }
    return [...grouped.values()]
      .map((group) => ({
        line: lineById(group[0].train.line)!,
        name: group[0].platform,
        rows: group.slice(0, PER_PLATFORM)
      }))
      .sort((a, b) => a.line.name.localeCompare(b.line.name) || a.name.localeCompare(b.name));
  });
</script>

<header>
  <h2>{station.name}</h2>
  <ul class="lines" aria-label="Lines">
    {#each lines as id (id)}
      {@const line = lineById(id)!}
      <li style:--line={id === 'northern' ? 'var(--northern)' : line.colour}>{line.name}</li>
    {/each}
  </ul>
</header>

{#if !snapshot}
  <p class="quiet">Waiting for TfL…</p>
{:else if !platforms.length}
  <p class="quiet">No trains due here at the moment.</p>
{:else}
  {#each platforms as platform (`${platform.line.id}${platform.name}`)}
    <section class="platform" aria-label="{platform.line.name} line, {platform.name}">
      <h3>
        <span
          class="swatch"
          style:--line={platform.line.id === 'northern' ? 'var(--northern)' : platform.line.colour}
        ></span>
        {platform.line.name} · {platform.name}
      </h3>
      <ol class="countdown">
        {#each platform.rows as row, i (row.train)}
          {@const key = keyOf(row.train)}
          <li>
            <button type="button" disabled={!key} onclick={() => key && onpicktrain(key)}>
              <span class="order">{i + 1}</span>
              <span class="to">{row.train.to || 'Check front of train'}</span>
              <span class="due">{minutes(row.due)}</span>
            </button>
          </li>
        {/each}
        <li class="clock" aria-hidden="true">{clock}</li>
      </ol>
    </section>
  {/each}
{/if}

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

  .lines {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text-muted);
    font-size: 13px;

    li::before {
      content: '';
      display: inline-block;
      width: 14px;
      height: 4px;
      margin-right: 6px;
      vertical-align: middle;
      background: var(--line);
    }
  }

  .quiet {
    color: var(--text-muted);
  }

  .platform {
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font: 15px/1.2 var(--font-display);
    color: var(--text-muted);

    .swatch {
      width: 14px;
      height: 4px;
      background: var(--line);
    }
  }

  .countdown .clock {
    padding-top: var(--space-1);
    color: var(--board-ink);
    font: 700 17px/1.2 var(--font-board);
    text-align: center;
    text-shadow: 0 0 6px rgb(255 176 0 / 0.45);
    font-variant-numeric: tabular-nums;
  }

  .countdown {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    list-style: none;
    background: var(--board);
    border-radius: var(--radius-small);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.06);

    button {
      display: grid;
      grid-template-columns: 1.4ch 1fr auto;
      gap: 1.2ch;
      width: 100%;
      min-height: 32px;
      padding: 2px 0;
      border: 0;
      background: none;
      color: var(--board-ink);
      font: 700 17px/1.2 var(--font-board);
      letter-spacing: 0;
      text-align: left;
      text-shadow: 0 0 6px rgb(255 176 0 / 0.45);

      &:disabled {
        cursor: default;
      }

      &:not(:disabled):hover .to {
        text-decoration: underline;
        text-underline-offset: 4px;
      }
    }

    .order {
      color: var(--board-dim);
    }

    .to {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .due {
      font-variant-numeric: tabular-nums;
    }
  }
</style>
