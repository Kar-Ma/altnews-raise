/**
 * Astro loads a local .env into `import.meta.env`, while a built server and
 * every hosting platform put the same names in `process.env`. Read both, or a
 * password set in .env silently does nothing in development — which is exactly
 * the sort of thing you discover by still being logged in when you should not be.
 */
export function env(key) {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  const fromMeta = import.meta.env?.[key];
  return fromMeta !== undefined && fromMeta !== '' ? fromMeta : undefined;
}
