<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Whatever sits at the other end, like the live feed */
  let { children }: { children?: Snippet } = $props();
</script>

<header>
  <a href="/">tubespotting</a>
  {@render children?.()}
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4) var(--space-3);
    border-bottom: 1px solid var(--rule);
    background: var(--surface);
  }

  a {
    font: 20px/1.1 var(--font-display);
    letter-spacing: 0.01em;
    text-decoration: none;
  }
</style>
