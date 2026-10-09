<script lang="ts">
  import { source } from '#lib/meta.js';
  import Icon from './Icon.svelte';

  interface Props {
    /** Underground trains running now, or null until TfL has answered */
    trains: number | null;
    onclose: () => void;
  }

  let { trains, onclose }: Props = $props();

  const counting = Boolean(import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT);
  const reporting = Boolean(import.meta.env.PUBLIC_SENTRY_DSN);
  const apps = ['apps.aliciasykes.com', 'peng.ly/projects'];
</script>

<!-- every link here leaves the map, so it opens in a new tab -->
{#snippet link(href: string, text: string)}
  <a {href} target="_blank" rel="noopener">{text}</a>
{/snippet}

<header>
  <h2>About</h2>
  <button type="button" class="close" onclick={onclose}>
    Close <Icon name="close" size={16} />
  </button>
</header>

<p>
  {#if trains === null}
    Every train running on the Underground is on this map.
  {:else if trains === 0}
    No trains are running on the Underground right now. When they are, this map shows every one of
    them.
  {:else if trains === 1}
    Right now there's 1 train running on the Underground, and this map shows it.
  {:else}
    Right now there are {trains} trains running on the Underground, and this map shows every one of them.
  {/if}
  All in real-time from official TfL arrivals data.
</p>

<section>
  <h3>Credits</h3>
  <p>
    tubespotting is built by {@render link('https://github.com/lissy93', '@Lissy93')} and
    {@render link('https://github.com/notAFlightRisk', '@NotAFlightRisk')}, and licensed under
    {@render link(`${source}/blob/main/LICENSE`, 'MIT')} © 2026.
  </p>
  <p>
    Powered by TfL Open Data. Contains OS data © Crown copyright and database rights 2016 and Geomni
    UK Map data © and database rights [2019]. Track shapes and the Thames are © OpenStreetMap
    contributors. Not affiliated with TfL.
  </p>
</section>

<section>
  <h3>Source code</h3>
  <p>
    You can view our code, run this app yourself, or report a bug over at our GitHub:
    {@render link(source, source.replace('https://', ''))}
  </p>
</section>

<section>
  <h3>Privacy</h3>
  <ul>
    <li>
      If you let the map use your location, it's only used to find your nearest station and never
      leaves your device.
    </li>
    <li>
      Your settings, like which lines are on and light or dark mode, are saved in your browser and
      nowhere else.
    </li>
    {#if counting}
      <li>
        We count visits with Plausible, a privacy-friendly analytics tool, to get a rough idea of
        how many people use the map. It sets no cookies, and no personal data is ever collected,
        stored or shared.
      </li>
    {/if}
    {#if reporting}
      <li>
        If something breaks, a redacted error report goes to our own bug tracker so we know what to
        fix.
      </li>
    {/if}
  </ul>
</section>

<section>
  <h3>More apps</h3>
  <p>If you enjoyed this, Lissy and Pengly have many more open source projects to check out!</p>
  <ul>
    {#each apps as app (app)}
      <li>{@render link(`https://${app}`, app)}</li>
    {/each}
  </ul>
</section>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  h2 {
    margin: 0;
    font: 26px/1.1 var(--font-display);
    color: var(--station-ink);
  }

  .close {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 36px;
    margin-right: calc(-1 * var(--space-2));
    padding: 0 var(--space-2);
    border: 0;
    border-radius: var(--radius-small);
    background: none;
    color: var(--text-muted);
    font-size: 13px;

    &:hover {
      background: var(--surface-sunk);
      color: var(--text);
    }
  }

  section {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--rule);
    color: var(--text-muted);
    font-size: 13px;
  }

  h3 {
    margin: 0 0 var(--space-2);
    font: 17px/1.2 var(--font-display);
    color: var(--text);
  }

  p,
  ul {
    margin: var(--space-3) 0 0;
    max-width: 65ch;
  }

  h3 + * {
    margin-top: 0;
  }

  ul {
    padding-left: var(--space-5);
  }

  li + li {
    margin-top: var(--space-1);
  }
</style>
