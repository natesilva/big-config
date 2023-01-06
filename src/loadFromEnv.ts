import { set } from 'lodash-es';

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
