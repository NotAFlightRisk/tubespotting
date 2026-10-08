<script lang="ts">
  import { LINES, type LineId } from '#lib/lines.js';
  import { stations, type Station } from '#lib/network.js';
  import Icon from './Icon.svelte';

  interface Props {
    shown: Set<LineId>;
    onpickstation: (index: number) => void;
    onpickline: (line: LineId) => void;
    onclose: () => void;
  }

  let { shown, onpickstation, onpickline, onclose }: Props = $props();

  type Result = {
    kind: 'station' | 'line';
    id: string;
    label: string;
    detail: string;
    index?: number;
  };

  const LIMIT = 8;
  const everything: Result[] = $derived.by(() => {
    const lines = LINES.filter((line) => shown.has(line.id));
    // a hub's stations that share a name are one result, listing every line between them
    const places = new Map<string, Station[]>();
    for (const s of stations) {
      if (!s.lines.some((line) => shown.has(line))) continue;
      const key = `${s.hub ?? s.id}|${s.name}`;
      places.set(key, [...(places.get(key) ?? []), s]);
    }
    return [
      ...lines.map((line) => ({
        kind: 'line' as const,
        id: line.id,
        label: `${line.name} line`,
        detail: 'Line'
      })),
      ...[...places.values()].map((members) => ({
        kind: 'station' as const,
        id: members[0].id,
        label: members[0].name,
        detail: lines
          .filter((line) => members.some((s) => s.lines.includes(line.id)))
          .map((line) => line.name)
          .join(', '),
        index: members[0].index
      }))
    ];
  });

  let query = $state('');
  let active = $state(0);

  const simplify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const results = $derived.by(() => {
    const wanted = simplify(query);
    if (!wanted) return [];
    return everything
      .map((r) => ({ r, at: simplify(r.label).indexOf(wanted) }))
      .filter(({ at }) => at >= 0)
      .sort((a, b) => Number(a.at > 0) - Number(b.at > 0) || a.r.label.localeCompare(b.r.label))
      .slice(0, LIMIT)
      .map(({ r }) => r);
  });

  function pick(result: Result | undefined) {
    if (!result) return;
    if (result.kind === 'line') onpickline(result.id as LineId);
    else onpickstation(result.index!);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') active = Math.min(results.length - 1, active + 1);
    else if (event.key === 'ArrowUp') active = Math.max(0, active - 1);
    else if (event.key === 'Enter') pick(results[active]);
    else if (event.key === 'Escape') onclose();
    else return;
    event.preventDefault();
  }
</script>

<div class="search" role="search">
  <div class="field">
    <Icon name="search" />
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="search"
      placeholder="Find a station or line"
      aria-label="Find a station or line"
      role="combobox"
      aria-expanded={results.length > 0}
      aria-controls="search-results"
      aria-activedescendant={results.length ? `result-${active}` : undefined}
      autocomplete="off"
      autofocus
      bind:value={query}
      oninput={() => (active = 0)}
      {onkeydown}
    />
    <button type="button" class="close" aria-label="Close search" onclick={onclose}>
      <Icon name="close" />
    </button>
  </div>
  {#if results.length}
    <ul id="search-results" role="listbox" aria-label="Matches">
      {#each results as result, i (result.kind + result.id)}
        <li
          id="result-{i}"
          role="option"
          aria-selected={i === active}
          onpointerenter={() => (active = i)}
          onclick={() => pick(result)}
          onkeydown={() => {}}
        >
          <span class="label">{result.label}</span>
          <span class="detail">{result.detail}</span>
        </li>
      {/each}
    </ul>
  {:else if query.trim()}
    <p class="empty">Nothing on the Underground called that.</p>
  {/if}
</div>

<style>
  .search {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .field {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-left: var(--space-2);
    color: var(--text-muted);

    input {
      flex: 1;
      min-width: 0;
      min-height: var(--tap);
      border: 0;
      background: none;
      color: var(--text);
      font: 17px var(--font-display);
      outline: none;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .close {
      display: grid;
      place-items: center;
      width: var(--tap);
      height: var(--tap);
      border: 0;
      border-radius: 50%;
      background: none;

      &:hover {
        background: var(--surface-sunk);
      }
    }
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: min(50dvh, 420px);
    overflow-y: auto;
  }

  li {
    display: grid;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-small);
    cursor: pointer;

    &[aria-selected='true'] {
      background: var(--surface-sunk);
    }
  }

  .label {
    font: 16px/1.25 var(--font-display);
    color: var(--station-ink);
  }

  .detail,
  .empty {
    color: var(--text-muted);
    font-size: 13px;
  }

  .empty {
    margin: 0;
    padding: var(--space-2) var(--space-3);
  }
</style>
