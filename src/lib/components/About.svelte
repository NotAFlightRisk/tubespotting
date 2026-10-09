<script lang="ts">
  import { source } from '#lib/meta.js';

  const counting = Boolean(import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT);
  const reporting = Boolean(import.meta.env.PUBLIC_SENTRY_DSN);
</script>

<h2>About</h2>
<p>Every London Underground train on one map, moving as TfL reports it.</p>

<h3>Your data</h3>
<ul>
  {#if counting}<li>Visits are counted with Plausible. No cookies, nothing personal.</li>{/if}
  {#if reporting}<li>
      If the page breaks, the error goes to our own bug tracker, minus anything about you.
    </li>{/if}
  <li>Your location, if you ask for it, never leaves your device.</li>
</ul>

<h3>Credits</h3>
<p class="small">
  Powered by TfL Open Data. Contains OS data © Crown copyright and database rights 2016 and Geomni
  UK Map data © and database rights [2019]. Track shapes and the Thames are © OpenStreetMap
  contributors. Not affiliated with TfL.
</p>
<p class="small">
  <a href={source}>Source on GitHub</a>
</p>

<style>
  h2 {
    margin: 0;
    font: 26px/1.1 var(--font-display);
    color: var(--station-ink);
  }

  h3 {
    margin: var(--space-5) 0 var(--space-2);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }

  p,
  ul {
    margin: var(--space-3) 0 0;
    max-width: 65ch;
  }

  ul {
    padding-left: var(--space-5);
  }

  h3 + ul,
  h3 + p {
    margin-top: 0;
  }

  .small {
    color: var(--text-muted);
    font-size: 13px;
  }
</style>
