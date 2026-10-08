import { Fleet } from './fleet.js';
import type { Snapshot } from './types.js';

const EVERY = 10_000;

/** Polls the shared reading and keeps the fleet moving between them */
export class Live {
  snapshot = $state.raw<Snapshot | null>(null);
  failing = $state(false);
  readonly fleet = new Fleet();
  #timer: ReturnType<typeof setTimeout> | undefined;
  #running = false;

  async #poll() {
    try {
      // no-cache, as the zone stretches max-age on edge hits and the poll would freeze
      const res = await fetch('/api/live', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Live feed answered ${res.status}`);
      const snapshot: Snapshot = await res.json();
      if (!this.snapshot || snapshot.at > this.snapshot.at) {
        this.fleet.update(snapshot);
        this.snapshot = snapshot;
      }
      this.failing = false;
    } catch {
      this.failing = true;
    }
    if (this.#running) this.#timer = setTimeout(() => this.#poll(), EVERY);
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#poll();
  }

  stop() {
    this.#running = false;
    clearTimeout(this.#timer);
  }
}
