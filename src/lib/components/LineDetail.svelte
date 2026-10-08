<script lang="ts">
  import type { Tracked } from '#lib/fleet.js';
  import type { Line } from '#lib/lines.js';
  import { callsApart, stations } from '#lib/network.js';
  import { count, minutes, nextCall, tone, whereIs } from '#lib/status.js';
  import type { LineStatus } from '#lib/types.js';

  interface Props {
    line: Line;
    status: LineStatus | undefined;
    trains: Tracked[];
    now: number;
    onpicktrain: (key: string) => void;
  }

  let { line, status, trains, now, onpicktrain }: Props = $props();

  const feeling = $derived(status ? tone(status.severity) : 'good');

  // one strip per destination, furthest from it first, so it reads in the direction of travel
  const directions = $derived.by(() => {
    const byDestination = new Map<string, Tracked[]>();
    for (const train of trains) {
      const to = train.reading.to || 'Check front of train';
      byDestination.set(to, [...(byDestination.get(to) ?? []), train]);
    }
    const left = (train: Tracked) => {
      const { dest, stops } = train.reading;
      return dest === null ? 0 : callsApart(line.id, stops[0][0], dest);
    };
    return [...byDestination]
      .map(([to, group]) => ({ to, trains: group.sort((a, b) => left(b) - left(a)) }))
      .sort((a, b) => b.trains.length - a.trains.length || a.to.localeCompare(b.to));
  });
</script>

<div
  class="detail"
  style:--line={line.id === 'northern' ? 'var(--northern)' : line.colour}
  style:--ink={line.id === 'northern' ? 'var(--paper)' : line.ink}
>
  <h2>{line.name}</h2>
  <p class="status {feeling}">{status?.status ?? 'Checking the status'}</p>
  {#if status?.reason}<p class="reason">{status.reason}</p>{/if}

  <p class="total">{count(trains.length, 'train')} running</p>
  {#each directions as direction (direction.to)}
    <section aria-label="Trains to {direction.to}">
      <h3>To {direction.to} <span>· {count(direction.trains.length, 'train')}</span></h3>
      <ol class="strip">
        {#each direction.trains as train (train.key)}
          {@const next = nextCall(train, now)}
          <li>
            <button type="button" onclick={() => onpicktrain(train.key)}>
              <span class="where">{whereIs(train, now)}</span>
              <span class="next">
                {stations[next.station].name} · {minutes(next.seconds)}
              </span>
            </button>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</div>

<style>
  h2 {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    background: var(--line);
    color: var(--ink);
    font: 24px/1.15 var(--font-display);
  }

  .status {
    margin: var(--space-3) 0 0;
    font: 18px/1.2 var(--font-display);

    &.good {
      color: var(--good);
    }

    &.warn {
      color: var(--warn);
    }

    &.bad {
      color: var(--bad);
    }

    &.closed {
      color: var(--text-muted);
    }
  }

  .reason {
    margin: var(--space-2) 0 0;
    color: var(--text-muted);
  }

  .total {
    margin: var(--space-4) 0 0;
    color: var(--text-muted);
    font: 600 14px/1.3 var(--font-ui);
    font-variant-numeric: tabular-nums;
  }

  h3 {
    margin: var(--space-5) 0 var(--space-2);
    font: 18px/1.2 var(--font-display);
    color: var(--station-ink);

    span {
      color: var(--text-muted);
      font: 600 13px var(--font-ui);
      font-variant-numeric: tabular-nums;
    }
  }

  .strip {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      padding-left: var(--space-5);

      &::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: var(--line);
      }

      &::after {
        content: '';
        position: absolute;
        left: 4px;
        top: 50%;
        width: 10px;
        height: 16px;
        translate: 0 -50%;
        border: 1.5px solid var(--ring);
        border-radius: 5px;
        background: var(--line);
      }
    }

    button {
      display: grid;
      width: 100%;
      min-height: var(--tap);
      padding: var(--space-1) var(--space-2);
      border: 0;
      border-radius: var(--radius-small);
      background: none;
      text-align: left;

      &:hover {
        background: var(--surface-sunk);
      }
    }

    .where {
      font: 15px/1.25 var(--font-display);
      color: var(--station-ink);
    }

    .next {
      color: var(--text-muted);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }
  }
</style>
