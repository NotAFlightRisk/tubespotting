import { lineById } from '#lib/lines.js';
import { name, site } from '#lib/meta.js';
import { places, type Place } from '#lib/network.js';
import type { Facts } from '#lib/types.js';

// two separate stations share a few names, so their pages say which by the first line
const titled = (place: Place) =>
  places.some((other) => other !== place && other.name === place.name)
    ? `${place.name} (${lineById(place.lines[0])!.name})`
    : place.name;

const SPOKEN = new Intl.ListFormat('en-GB');
const serves = (place: Place) =>
  SPOKEN.format(
    place.lines.map((id) => {
      const line = lineById(id)!;
      return line.mode === 'dlr' ? 'DLR' : line.mode === 'tram' ? 'trams' : `${line.name} line`;
    })
  );

export const stationTitle = (place: Place) => `${titled(place)} station: live departures | ${name}`;

export const stationDescription = (place: Place) =>
  `Live departures from ${titled(place)} on the ${serves(place)}, with where each train is now, ` +
  'the line status, busy times and the stations around it.';

/** The station itself, and the way to it through the site, for search engines */
export function stationData(place: Place, facts: Facts | null) {
  const url = `${site}/stations/${place.slug}`;
  const [{ lat, lon }] = place.members;
  const tube = place.lines.some((id) => lineById(id)!.mode === 'tube');
  const trail = [
    [name, site],
    ['Stations', `${site}/stations`],
    [titled(place), url]
  ];
  return [
    {
      '@context': 'https://schema.org',
      '@type': tube ? 'SubwayStation' : 'TrainStation',
      name: titled(place),
      url,
      geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lon },
      ...(facts?.address && { address: facts.address })
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map(([name, item], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        item
      }))
    }
  ];
}

export const indexDescription =
  'Every London Underground, Elizabeth line, Overground, DLR and tram station, each with its live ' +
  'departures, line status, busy times and the trains on their way.';
