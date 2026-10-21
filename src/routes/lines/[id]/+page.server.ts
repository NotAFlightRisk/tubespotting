import { error } from '@sveltejs/kit';
import { lineById } from '#lib/lines.js';
import { placesOn } from '#lib/network.js';
import { factsOf } from '#lib/server/places.js';
import { lineStatus } from '#lib/server/tfl.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const line = lineById(params.id);
  if (!line) error(404, 'No line by that name');
  const zones = placesOn(line.id).flatMap((place) => {
    const zone = factsOf(place)?.zone;
    return zone ? [[place.slug, zone] as const] : [];
  });
  return { id: line.id, zones: Object.fromEntries(zones), status: await lineStatus() };
};
