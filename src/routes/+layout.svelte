<script lang="ts">
  import { onMount } from 'svelte';
  import { loadPlausible } from '#lib/plausible.js';
  import { load, settings } from '#lib/settings/settings.svelte.js';
  import '../app.css';

  let { children } = $props();

  // the map's page loads them first, for its links, so this is for the error page
  onMount(() => {
    load();
    if (settings.analytics) loadPlausible();
  });
</script>

{@render children()}
