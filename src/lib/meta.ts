export const site = 'https://tubespotting.peng.ly';
export const source = 'https://github.com/NotAFlightRisk/tubespotting';
export const name = 'Tube Spotting';
export const title = `${name} | Live London Underground map`;
export const description =
  'Live London Underground map showing real time train locations across the TfL network. Tap a station for its next trains.';
export const imageAlt =
  'Map of central London with live Tube trains on every line, beside the status of each line';

/** Tells search engines what the site's called, for the name shown above its results */
export const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  alternateName: 'tubespotting',
  url: site
});
