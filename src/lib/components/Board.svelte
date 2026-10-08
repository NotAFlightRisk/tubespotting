<script lang="ts">
  import { LINES, type LineId } from '#lib/lines.js';
  import { count, tone } from '#lib/status.js';
  import type { LineStatus } from '#lib/types.js';

  interface Props {
    status: LineStatus[];
    counts: Map<LineId, number>;
    onpick: (line: LineId) => void;
  }

  let { status, counts, onpick }: Props = $props();

  const byLine = $derived(new Map(status.map((s) => [s.id, s])));
</script>

<nav class="board" aria-label="Lines">
  <h2 class="visually-hidden">Lines</h2>
  <ul>
    {#each LINES as line (line.id)}
      {@const state = byLine.get(line.id)}
      {@const feeling = state ? tone(state.severity) : 'good'}
      <li>
        <button
          type="button"
          class="line"
          style:--line={line.id === 'northern' ? 'var(--northern)' : line.colour}
          style:--ink={line.id === 'northern' ? 'var(--paper)' : line.ink}
          onclick={() => onpick(line.id)}
        >
          <span class="name">{line.name}</span>
          <span class="state {feeling}">
            <span class="dot" aria-hidden="true"></span>
            {state?.status ?? 'Checking'}
          </span>
          <span class="count">{count(counts.get(line.id) ?? 0, 'train')}</span>
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .board ul {
    display: flex;
    gap: var(--space-2);
    margin: 0;
    padding: var(--space-2) var(--space-3);
    list-style: none;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .line {
    display: grid;
    grid-template-columns: auto;
    align-items: center;
    min-height: var(--tap);
    padding: 0;
    border: 0;
    border-radius: var(--radius-small);
    background: var(--surface);
    box-shadow: var(--shadow);
    scroll-snap-align: start;
    overflow: hidden;
    text-align: left;

    .name {
      display: flex;
      align-items: center;
      height: 100%;
      padding: var(--space-2) var(--space-3);
      background: var(--line);
      color: var(--ink);
      font: 15px/1.1 var(--font-display);
      white-space: nowrap;
    }

    .count {
      display: none;
    }

    &:hover .name {
      filter: brightness(1.08);
    }
  }

  .state {
    align-items: center;
    font-family: var(--font-display);
    gap: var(--space-2);
    color: var(--text-muted);

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--good);
    }

    &.warn .dot {
      background: var(--warn);
    }

    &.bad {
      color: var(--bad);

      .dot {
        background: var(--bad);
      }
    }

    &.closed .dot {
      background: var(--text-muted);
    }
  }

  @media (max-width: 959px) {
    .line .state {
      display: flex;
      padding: 2px var(--space-3) 4px;
      font-size: 12px;
      white-space: nowrap;
    }
  }

  @media (min-width: 960px) {
    .board ul {
      flex-direction: column;
      gap: 2px;
      padding: 0;
      overflow: visible;
    }

    .line {
      grid-template-columns: 10rem 1fr auto;
      width: 100%;
      border-radius: 0;
      box-shadow: none;
      background: var(--surface);

      .state,
      .count {
        display: flex;
        padding-inline: var(--space-3);
      }

      .name {
        font-size: 14px;
      }

      .state {
        padding-block: 0;
        font-size: 14px;
        white-space: nowrap;
      }

      .count {
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
        font-size: 13px;
      }

      &:hover {
        background: var(--surface-sunk);
      }
    }
  }
</style>
