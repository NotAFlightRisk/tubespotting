import { TFL_APP_KEY } from '$app/env/private';
import { LINE_IDS } from '#lib/lines.js';
import type { Snapshot } from '#lib/types.js';
import { Platforms, readStatus, readTrains, type Prediction } from './readings.js';

const BASE = 'https://api.tfl.gov.uk';
const FRESH = 10_000;
const TIMEOUT = 8_000;
// a status that's a few minutes old is still news
const STATUS_EVERY = 60_000;

async function get<T>(path: string): Promise<T> {
  const url = new URL(BASE + path);
  if (TFL_APP_KEY) url.searchParams.set('app_key', TFL_APP_KEY);
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT)
  });
  if (!res.ok) throw new Error(`TfL ${res.status} on ${path.split('?')[0]}`);
  return res.json() as Promise<T>;
}

let current: { snapshot: Snapshot; body: string } | null = null;
let statusAt = 0;
let refreshing: Promise<void> | null = null;

async function refresh() {
  const wantStatus = !current || Date.now() - statusAt > STATUS_EVERY;
  const [arrivals, status] = await Promise.allSettled([
    get<Prediction[]>(`/Line/${LINE_IDS.join(',')}/Arrivals`),
    wantStatus ? get<Parameters<typeof readStatus>[0]>('/Line/Mode/tube/Status') : null
  ]);
  if (status.status === 'fulfilled' && status.value) statusAt = Date.now();

  if (arrivals.status === 'rejected' || !Array.isArray(arrivals.value)) {
    if (!current) throw arrivals.status === 'rejected' ? arrivals.reason : new Error('No arrivals');
    current = wrap({ ...current.snapshot, stale: true });
    return;
  }

  const at = Date.now();
  const platforms = new Platforms();
  current = wrap({
    at,
    stale: false,
    trains: readTrains(arrivals.value, at, platforms),
    platforms: platforms.names,
    status:
      status.status === 'fulfilled' && Array.isArray(status.value)
        ? readStatus(status.value)
        : (current?.snapshot.status ?? [])
  });
}

const wrap = (snapshot: Snapshot) => ({ snapshot, body: JSON.stringify(snapshot) });

/** One reading shared by every visitor, refreshed behind their backs once it's a bit old */
export async function live(waitUntil?: (work: Promise<unknown>) => void): Promise<string> {
  const age = current ? Date.now() - current.snapshot.at : Infinity;
  if (age > FRESH && !refreshing) {
    refreshing = refresh().finally(() => (refreshing = null));
    waitUntil?.(refreshing.catch(() => {}));
  }
  // a reading this old is worth waiting for a new one rather than serving
  if (!current || age > FRESH * 6) await refreshing;
  return current!.body;
}
