import { error } from '@sveltejs/kit';
import { placeBySlug, places } from '#lib/network.js';
import stations from '#lib/server/stations.json' with { type: 'json' };
import type { Busy, Facts } from '#lib/types.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => places.map(({ slug }) => ({ slug }));

const facts: Record<string, Facts> = stations.facts;
const busy: Record<string, Busy> = stations.busy;

export const load: PageServerLoad = ({ params }) => {
  const place = placeBySlug.get(params.slug);
  if (!place) error(404, 'No station by that name');
  // TfL files a hub's facts under the hub, and the rest under the station
  const [{ hub, id }] = place.members;
  return {
    slug: place.slug,
    facts: facts[hub ?? id] ?? null,
    busy: busy[hub ?? id] ?? null
  };
};
