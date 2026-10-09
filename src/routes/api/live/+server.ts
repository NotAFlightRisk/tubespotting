import { error } from '@sveltejs/kit';
import { live } from '#lib/server/tfl.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
  const body = await live((work) => platform?.ctx?.waitUntil(work)).catch((err) => {
    console.error('No reading to serve', err);
    return error(503, 'TfL is not answering right now');
  });
  return new Response(body, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=0, s-maxage=5'
    }
  });
};
