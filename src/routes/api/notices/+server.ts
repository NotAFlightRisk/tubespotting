import { error } from '@sveltejs/kit';
import { stationNotices } from '#lib/server/tfl.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const body = await stationNotices().catch((err) => {
    console.error('No station notices to serve', err);
    return error(503, 'TfL is not answering right now');
  });
  return new Response(body, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=60, s-maxage=300'
    }
  });
};
