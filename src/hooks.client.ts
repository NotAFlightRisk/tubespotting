import type { HandleClientError } from '@sveltejs/kit/hooks';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
let sentry: Promise<(error: unknown) => void> | undefined;

// the SDK only downloads once something's actually broken, so a page that works never pays for it
function report(error: unknown) {
  sentry ??= import('#lib/sentry.js').then(({ start }) => start(dsn)).catch(() => () => {});
  sentry.then((capture) => capture(error));
}

if (dsn) {
  addEventListener('error', (event) => event.error && report(event.error));
  addEventListener('unhandledrejection', (event) => report(event.reason));
}

export const handleError: HandleClientError = ({ kind, error }) => {
  if (dsn && kind === 'unknown') report(error);
};
