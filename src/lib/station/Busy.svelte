<script lang="ts">
  import { onMount } from 'svelte';
  import { hour, t, weekday } from '#lib/i18n/i18n.svelte.js';
  import type { Busy } from '#lib/types.js';

  let { busy }: { busy: Busy } = $props();

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const LABELLED = [6, 9, 12, 15, 18, 21];
  const LONDON = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23'
  });

  // which day it is in London is only known once it's open, so nothing's shown until then
  let today = $state<{ day: number; hour: number } | null>(null);
  let day = $state(0);

  const hours = $derived(busy[day]);
  const peak = $derived(hours.indexOf(Math.max(...hours)));

  onMount(() => {
    const parts = Object.fromEntries(LONDON.formatToParts().map((p) => [p.type, p.value]));
    today = { day: DAYS.indexOf(parts.weekday), hour: Number(parts.hour) };
    day = today.day;
  });
</script>

<section aria-labelledby="busy">
  <div class="top">
    <h2 id="busy">{t.station.busy}</h2>
    <select aria-label={t.station.day} bind:value={day} disabled={!today}>
      {#each DAYS as _, i (i)}
        <option value={i}>{weekday(i)}</option>
      {/each}
    </select>
  </div>
  <div class="chart">
    {#if today}
      <p>{t.station.busiest(hour(peak))}</p>
      <ol aria-hidden="true">
        {#each hours as level, h (h)}
          <li class:now={day === today.day && h === today.hour} style:--level="{level}%">
            {#if day === today.day && h === today.hour}<span class="mark">{t.station.now}</span
              >{/if}
            {#if LABELLED.includes(h)}<span class="hour">{hour(h)}</span>{/if}
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</section>

<style>
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);

    h2 {
      margin: 0;
    }
  }

  select {
    min-height: 36px;
    padding: 0 var(--space-2);
    border: 1px solid var(--rule);
    border-radius: var(--radius-small);
    background: var(--surface);
    color: var(--text);
    font: inherit;
  }

  /* the same height before and after it's drawn, so nothing jumps */
  .chart {
    min-height: 152px;
  }

  p {
    margin: var(--space-2) 0 var(--space-3);
    color: var(--text-muted);
  }

  ol {
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    align-items: end;
    gap: 2px;
    height: 96px;
    margin: 0;
    padding: 0 0 18px;
    list-style: none;
  }

  li {
    position: relative;
    height: max(2px, var(--level));
    border-radius: 2px 2px 0 0;
    background: color-mix(in srgb, var(--accent) 35%, var(--surface-sunk));

    &.now {
      background: var(--accent);
    }
  }

  .hour,
  .mark {
    position: absolute;
    left: 50%;
    translate: -50% 0;
    color: var(--text-muted);
    font-size: 11px;
    white-space: nowrap;
  }

  .hour {
    top: calc(100% + 4px);
  }

  .mark {
    bottom: calc(100% + 2px);
    color: var(--accent);
    font-weight: 600;
  }
</style>
