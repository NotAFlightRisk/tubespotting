<script lang="ts">
  import { onMount } from 'svelte';
  import { loadPlausible } from '#lib/plausible.js';
  import { read } from '#lib/settings/saved.js';
  import '../app.css';

  let { children } = $props();

  onMount(() => {
    if (read().analytics) loadPlausible();
  });
</script>

{@render children()}
