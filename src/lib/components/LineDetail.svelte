<script lang="ts">
  import type { Tracked } from '#lib/fleet.js';
  import type { Line } from '#lib/lines.js';
  import { tone, whereIs } from '#lib/status.js';
  import type { LineStatus } from '#lib/types.js';

  interface Props {
    line: Line;
    status: LineStatus | undefined;
    trains: Tracked[];
    onpicktrain: (key: string) => void;
  }

  let { line, status, trains, onpicktrain }: Props = $props();

  const feeling = $derived(status ? tone(status.severity) : 'good');
  const sorted = $derived(
    [...trains].sort(
      (a, b) =>
        a.reading.to.localeCompare(b.reading.to) ||
        whereIs(a.reading).localeCompare(whereIs(b.reading))
    )
  );
</script>

<div
  class="detail"
  style:--line={line.id === 'northern' ? 'var(--northern)' : line.colour}
  style:--ink={line.id === 'northern' ? 'var(--paper)' : line.ink}
>
  <h2>{line.name}</h2>
  <p class="status {feeling}">{status?.status ?? 'Checking the status'}</p>
  {#if status?.reason}<p class="reason">{status.reason}</p>{/if}

  <h3>{trains.length} {trains.length === 1 ? 'train' : 'trains'} running</h3>
  <ul class="trains">
    {#each sorted as train (train.key)}
      <li>
        <button type="button" onclick={() => onpicktrain(train.key)}>
          <span class="to">{train.reading.to || 'Check front of train'}</span>
          <span class="where">{whereIs(train.reading)}</span>
        </button>
      </li>
    {/each}
  </ul>
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
    font-weight: 600;

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

  h3 {
    margin: var(--space-5) 0 var(--space-2);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .trains {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;

    button {
      display: grid;
      width: 100%;
      min-height: var(--tap);
      padding: var(--space-2) var(--space-3);
      border: 0;
      border-radius: var(--radius-small);
      background: var(--surface-sunk);
      text-align: left;

      &:hover {
        background: var(--rule);
      }
    }

    .to {
      font: 16px/1.25 var(--font-display);
      color: var(--station-ink);
    }

    .where {
      color: var(--text-muted);
      font-size: 13px;
    }
  }
</style>
