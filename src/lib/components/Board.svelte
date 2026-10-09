<script lang="ts">
  import { LINES, MODES, type LineId, type ModeId } from '#lib/lines.js';
  import { count, tone } from '#lib/status.js';
  import type { LineStatus } from '#lib/types.js';
  import Icon from './Icon.svelte';

  interface Props {
    status: LineStatus[];
    counts: Map<LineId, number>;
    waiting: boolean;
    shown: Set<LineId>;
    extras: ModeId[];
    onpick: (line: LineId) => void;
    ontoggle: (mode: ModeId) => void;
  }

  let { status, counts, waiting, shown, extras, onpick, ontoggle }: Props = $props();

  const OPTIONAL = MODES.filter((mode) => mode.id !== 'tube');

  const byLine = $derived(new Map(status.map((s) => [s.id, s])));
</script>

<nav class="board" aria-label="Lines">
  <h2 class="visually-hidden">Lines</h2>
  <ul>
    {#each LINES.filter((line) => shown.has(line.id)) as line (line.id)}
      {@const state = byLine.get(line.id)}
      {@const feeling = state ? tone(state.severity) : ''}
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
          <span class="count">{waiting ? '' : count(counts.get(line.id) ?? 0, 'train')}</span>
        </button>
      </li>
    {/each}
    {#each OPTIONAL as mode (mode.id)}
      {@const on = extras.includes(mode.id)}
      <li class="optional">
        <button type="button" class="mode" aria-pressed={on} onclick={() => ontoggle(mode.id)}>
          <Icon name={on ? 'check' : 'plus'} size={16} />
          {mode.name}
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

  .mode {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--tap);
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-small);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text-muted);
    font: 15px/1.1 var(--font-display);
    white-space: nowrap;
    scroll-snap-align: start;

    &[aria-pressed='true'] {
      color: var(--accent);
    }

    &:hover {
      background: var(--surface-sunk);
      color: var(--text);
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
      background: var(--text-muted);
    }

    &.good .dot {
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

    :not(.optional) + .optional {
      margin-top: var(--space-3);
      border-top: 1px solid var(--rule);
      padding-top: var(--space-2);
    }

    .mode {
      width: 100%;
      min-height: 36px;
      box-shadow: none;
      font-size: 14px;
    }
  }
</style>
