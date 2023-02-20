import { set } from 'lodash';

/**
 * Load configuration settings from environment variables.
 *
 * @param prefix the prefix to use when looking up environment variables
 */
export default function loadFromEnv(prefix: string) {
  const settings: Record<string, string> = {};

  for (const key of Object.keys(process.env)) {
    if (key.startsWith(prefix)) {
      if (process.env[key]) {
        const resolvedKey = key.slice(prefix.length).replace(/__/g, '.');
        set(settings, resolvedKey, process.env[key]);
      }
    }
  }

  return settings;
}
