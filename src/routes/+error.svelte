<script lang="ts">
  import { page } from '$app/state';

  const lost = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{lost ? 'Not on the map' : 'Something went wrong'} · tubespotting</title>
</svelte:head>

<main class="lost">
  <h1>{lost ? 'No trains call here' : 'Something went wrong'}</h1>
  <p class="board">{page.status} · Not in service</p>
  <p>{lost ? "That page isn't on the map." : page.error?.message}</p>
  <a href="/">Back to the live map</a>
</main>

<style>
  .lost {
    display: grid;
    place-content: center;
    justify-items: start;
    gap: var(--space-3);
    min-height: 100dvh;
    padding: var(--space-5);
  }

  .board {
    margin: 0;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-small);
    background: var(--board);
    color: var(--board-ink);
    font: 700 28px/1 var(--font-board);
    text-shadow: 0 0 6px rgb(255 176 0 / 0.45);
  }

  h1 {
    margin: 0;
    font: 32px/1.1 var(--font-display);
    color: var(--station-ink);
  }

  p {
    margin: 0;
    color: var(--text-muted);
  }

  a {
    font-weight: 600;
  }
</style>
