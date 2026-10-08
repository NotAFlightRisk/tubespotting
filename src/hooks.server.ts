import type { HandleServerError } from '@sveltejs/kit/hooks';
import { report } from '#lib/server/report.js';

export const handleError: HandleServerError = ({ kind, error, event }) => {
  if (import.meta.env.PUBLIC_SENTRY_DSN && kind === 'unknown') report(error, event);
};
