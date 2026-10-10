import { TFL_APP_KEY } from '$app/env/private';
import { LINE_IDS, MODES } from '#lib/lines.js';
import type { Snapshot } from '#lib/types.js';
import { Platforms, readStatus, readTrains, type Prediction } from './readings.js';

const BASE = 'https://api.tfl.gov.uk';
const FRESH = 10_000;
const TIMEOUT = 15_000;
// a status that's a few minutes old is still news
const STATUS_EVERY = 60_000;
const RETRY = 20_000;

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
let retryAt = 0;

async function refresh() {
  const wantStatus = !current || Date.now() - statusAt > STATUS_EVERY;
  const [arrivals, status] = await Promise.allSettled([
    get<Prediction[]>(`/Line/${LINE_IDS.join(',')}/Arrivals`),
    wantStatus
      ? get<Parameters<typeof readStatus>[0]>(
          `/Line/Mode/${MODES.map((m) => m.id).join(',')}/Status?detail=true`
        )
      : null
  ]);
  const told = status.status === 'fulfilled' && Array.isArray(status.value);
  if (told) statusAt = Date.now();
  const lines = told ? readStatus(status.value!) : (current?.snapshot.status ?? []);

  try {
    if (arrivals.status === 'rejected') throw arrivals.reason;
    if (!Array.isArray(arrivals.value)) throw new Error('TfL arrivals came back as something else');
    const at = Date.now();
    const platforms = new Platforms();
    const trains = readTrains(arrivals.value, at, platforms);
    current = wrap({ at, stale: false, trains, platforms: platforms.names, status: lines });
  } catch (err) {
    // and give TfL a breather rather than asking again on every request
    retryAt = Date.now() + RETRY;
    if (!current) throw err;
    // the last good reading beats an error page, so keep it and say it's stale
    console.error('Refresh failed, serving the last reading', err);
    current = wrap({ ...current.snapshot, stale: true, status: lines });
  }
}

const wrap = (snapshot: Snapshot) => ({ snapshot, body: JSON.stringify(snapshot) });

/** One reading shared by every visitor, refreshed behind their backs once it's a bit old */
export async function live(waitUntil?: (work: Promise<unknown>) => void): Promise<string> {
  const age = current ? Date.now() - current.snapshot.at : Infinity;
  if (age > FRESH && !refreshing && Date.now() >= retryAt) {
    refreshing = refresh().finally(() => (refreshing = null));
    waitUntil?.(refreshing.catch(() => {}));
  }
  // a reading this old is worth waiting for a new one rather than serving
  if (!current || age > FRESH * 6)
    await refreshing?.catch((err) => (current ? null : Promise.reject(err)));
  if (!current) throw new Error('No reading from TfL yet');
  return current.body;
}
