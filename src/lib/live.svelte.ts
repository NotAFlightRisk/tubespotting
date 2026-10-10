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
    let snapshot: Snapshot | null = null;
    try {
      // no-cache, as the zone stretches max-age on edge hits and the poll would freeze
      const res = await fetch('/api/live', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Live feed answered ${res.status}`);
      snapshot = await res.json();
      this.failing = false;
    } catch {
      this.failing = true;
    }
    if (this.#running) this.#timer = setTimeout(() => this.#poll(), EVERY);
    // outside the try, so a bug in here gets reported rather than passed off as the network
    if (snapshot && (!this.snapshot || snapshot.at > this.snapshot.at)) {
      this.fleet.update(snapshot);
      this.snapshot = snapshot;
    }
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
