import { error } from '@sveltejs/kit';
import { lineById, LINES } from '#lib/lines.js';
import { placesOn } from '#lib/network.js';
import { factsOf } from '#lib/server/places.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => LINES.map(({ id }) => ({ id }));

export const load: PageServerLoad = ({ params }) => {
  const line = lineById(params.id);
  if (!line) error(404, 'No line by that name');
  const zones = placesOn(line.id).flatMap((place) => {
    const zone = factsOf(place)?.zone;
    return zone ? [[place.slug, zone] as const] : [];
  });
  return { id: line.id, zones: Object.fromEntries(zones) };
};
