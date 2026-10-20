<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.js';
  import { colourOf, inkOf, lineById, type LineId } from '#lib/lines.js';
  import { tone } from '#lib/status.js';
  import type { LineStatus } from '#lib/types.js';

  let { lines, status }: { lines: LineId[]; status: LineStatus[] } = $props();
</script>

<section aria-labelledby="status">
  <h2 id="status">{t.station.status}</h2>
  <ul>
    {#each lines as id (id)}
      {@const line = lineById(id)!}
      {@const state = status.find((s) => s.id === id)}
      <li>
        <a href="/?line={id}" style:--line={colourOf(line)} style:--ink={inkOf(line)}>
          <span class="name">{line.name}</span>
          <span class="state {state ? tone(state.severity) : ''}">
            {state?.status ?? t.board.checking}
          </span>
        </a>
        {#if state?.reason}<p class="reason">{state.reason}</p>{/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  ul {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    display: grid;
    grid-template-columns: minmax(8rem, auto) 1fr;
    align-items: center;
    min-height: var(--tap);
    border-radius: var(--radius-small);
    background: var(--surface-sunk);
    overflow: hidden;
    color: var(--text);
    text-decoration: none;

    &:hover .state {
      text-decoration: underline;
    }
  }

  .name {
    align-self: stretch;
    display: flex;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    background: var(--line);
    color: var(--ink);
    font: 15px/1.1 var(--font-display);
  }

  .state {
    padding: var(--space-2) var(--space-3);
    font: 15px/1.2 var(--font-display);

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
    font-size: 14px;
  }
</style>
