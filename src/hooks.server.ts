import type { HandleServerError } from '@sveltejs/kit/hooks';
import { report } from '#lib/server/report.js';

export const handleError: HandleServerError = ({ kind, error, event }) => {
  if (kind !== 'unknown') return;
  const sent = report(error, event);
  event.platform?.ctx?.waitUntil(sent);
};
