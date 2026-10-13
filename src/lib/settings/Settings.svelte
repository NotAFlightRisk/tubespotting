<script lang="ts">
  import { onMount } from 'svelte';
  import Close from '#lib/components/Close.svelte';
  import Grip from '#lib/components/Grip.svelte';
  import { MODES } from '#lib/lines.js';
  import { counting, reporting } from '#lib/meta.js';
  import Chips from './Chips.svelte';
  import Row from './Row.svelte';
  import { LANGUAGES, REFRESH } from './saved.js';
  import Segmented from './Segmented.svelte';
  import Select from './Select.svelte';
  import { clear, looks, settings } from './settings.svelte.js';
  import Slider from './Slider.svelte';
  import Switch from './Switch.svelte';

  interface Props {
    zoom: number;
    located: boolean;
    onzoom: (zoom: number) => void;
    onlocate: (on: boolean) => void;
    onclose: () => void;
  }

  let { zoom, located, onzoom, onlocate, onclose }: Props = $props();

  const modes = MODES.map((mode) => ({ value: mode.id, label: mode.name }));
  const refreshes = REFRESH.map((s) => ({
    value: s,
    label: s < 60 ? `${s} sec` : `${s / 60} min`
  }));

  let dialog: HTMLDialogElement;
  // so a drag that ends on the backdrop doesn't close it
  let pressed: EventTarget | null = null;
  let cleared = $state(false);

  // focused itself, so it's announced by name
  onMount(() => {
    dialog.showModal();
    dialog.focus();
  });
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="settings-title"
  tabindex="-1"
  {onclose}
  onpointerdown={(event) => (pressed = event.target)}
  onclick={(event) => pressed === dialog && event.target === dialog && dialog.close()}
>
  <div class="sheet">
    <Grip onclose={() => dialog.close()} />
    <header>
      <h2 id="settings-title">Settings</h2>
      <Close onclick={() => dialog.close()} />
    </header>

    <h3>General</h3>
    <div class="card">
      <Segmented
        label="Theme"
        hint="Matches your device until you pick one"
        options={[
          { value: false, label: 'Light', icon: 'sun' },
          { value: true, label: 'Dark', icon: 'moon' }
        ]}
        bind:value={looks.dark}
      />
      <Select label="Language" hint="More languages are on the way" bind:value={settings.language}>
        {#each Object.entries(LANGUAGES) as [code, name] (code)}
          <option value={code} lang={code}>{name}</option>
        {/each}
      </Select>
    </div>

    <h3>Map</h3>
    <div class="card">
      <Segmented
        label="Layout"
        options={[
          { value: 'schematic', label: 'Tube map', icon: 'tube' },
          { value: 'geographic', label: 'Geographic', icon: 'map' }
        ]}
        bind:value={settings.style}
      />
      <Slider
        label="Zoom"
        bind:value={() => Math.round(zoom * 100), (percent) => onzoom(percent / 100)}
      />
      <Chips label="Lines on the map" options={modes} bind:value={settings.modes} />
      <Switch
        label="Show where I am"
        hint="Your location never leaves your device"
        bind:checked={() => located, onlocate}
      />
      <Segmented
        label="Update every"
        hint="Less often uses less data"
        options={refreshes}
        bind:value={settings.refresh}
      />
    </div>

    <h3>Accessibility</h3>
    <div class="card">
      <Switch
        label="Reduce motion"
        hint="Fewer animations, and no gliding map"
        bind:checked={looks.calm}
      />
      <Switch
        label="More contrast"
        hint="Stronger text and borders"
        bind:checked={looks.contrast}
      />
      <Switch
        label="Keyboard shortcuts"
        hint="Press / to search"
        bind:checked={settings.shortcuts}
      />
    </div>

    <h3>Privacy</h3>
    <div class="card">
      {#if counting}
        <Switch
          label="Usage analytics"
          hint="Plausible counts visits, with no cookies or personal data"
          bind:checked={settings.analytics}
        />
      {/if}
      {#if reporting}
        <Switch
          label="Error reports"
          hint="A redacted report when something breaks, so we can fix it"
          bind:checked={settings.errors}
        />
      {/if}
      <Row label="Clear all data" hint="Resets everything saved in this browser">
        {#snippet children(tie)}
          <button
            type="button"
            class="clear"
            {...tie}
            onclick={() => {
              clear();
              cleared = true;
            }}
          >
            {cleared ? 'Cleared' : 'Clear'}
          </button>
        {/snippet}
      </Row>
    </div>
    <p class="visually-hidden" role="status">{cleared ? 'Everything has been cleared' : ''}</p>
  </div>
</dialog>

<style>
  dialog {
    inset: auto 0 0;
    width: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    overflow: visible;

    &:focus-visible {
      outline: none;
    }

    &::backdrop {
      background: rgb(10 14 20 / 0.3);
    }
  }

  .sheet {
    max-height: 85dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom));
    border-radius: var(--radius) var(--radius) 0 0;
    background: var(--surface);
    box-shadow: var(--shadow);
    animation: rise 320ms var(--ease-out);
  }

  header {
    position: sticky;
    top: var(--space-5);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-2);
    background: var(--surface);
  }

  h2 {
    margin: 0;
    font: 26px/1.1 var(--font-display);
    color: var(--station-ink);
  }

  h3 {
    margin: var(--space-5) var(--space-1) var(--space-2);
    color: var(--text-muted);
    font: 13px/1.2 var(--font-display);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .card {
    border-radius: var(--radius);
    background: var(--surface-sunk);

    > :global(* + *) {
      border-top: 1px solid var(--rule);
    }
  }

  .clear {
    min-height: 36px;
    padding: 0 var(--space-4);
    border: 0;
    border-radius: var(--radius-small);
    background: none;
    box-shadow: inset 0 0 0 1.5px var(--bad);
    color: var(--bad);
    font: 600 14px/1.1 var(--font-ui);

    &:hover {
      background: color-mix(in srgb, var(--bad) 10%, transparent);
    }
  }

  @media (min-width: 960px) {
    dialog {
      inset: 0;
      width: min(600px, 100% - 2 * var(--space-5));
      margin: auto;
    }

    .sheet {
      max-height: min(780px, 100dvh - 2 * var(--space-6));
      padding: 0 var(--space-5) var(--space-5);
      border-radius: var(--radius);
    }

    header {
      top: 0;
      padding-top: var(--space-5);
    }
  }
</style>
