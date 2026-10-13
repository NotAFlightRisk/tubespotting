import { MediaQuery } from 'svelte/reactivity';
import { defaults, LOOKS, read, write, type Look } from './saved.js';

export const settings = $state(defaults());

const names = Object.keys(LOOKS) as Look[];

/** Each look as picked, or as the system has it until then */
export const looks = Object.defineProperties(
  {} as Record<Look, boolean>,
  Object.fromEntries(
    names.map((name) => {
      const system = new MediaQuery(LOOKS[name]);
      const get = () => settings[name] ?? system.current;
      return [name, { get, set: (on: boolean) => (settings[name] = on) }];
    })
  )
);

let loaded = false;

/** Once the page has hydrated, so its first render still matches the prerendered one */
export function load() {
  if (loaded) return;
  loaded = true;
  Object.assign(settings, read());
  $effect.root(() => {
    $effect(() => {
      for (const name of names) document.documentElement.dataset[name] = String(looks[name]);
    });
    $effect(() => write($state.snapshot(settings)));
  });
}

export function clear() {
  try {
    localStorage.clear();
  } catch {
    // there was nothing we could have kept
  }
  Object.assign(settings, defaults());
}
