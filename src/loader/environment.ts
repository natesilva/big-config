import { LoaderInterface } from './interface';

import set = require('lodash.set');

export class EnvironmentLoader implements LoaderInterface {
  /**
   * @param envPrefix the prefix for names of environment variables to import
   */
  constructor(private readonly envPrefix = 'CONFIG__') {}

  /**
   * Load settings from the environment. This loader ignores the env/environment setting.
   * Any environment variable starting with `CONFIG__` (or the envPrefix you’ve set) will
   * be loaded. Namespaces are indicated by two underscores. For example:
   *
   *   CONFIG__database__host=some.host
   *
   * Will result in: { database: { host: 'some.host' } }
   */
  async load(): Promise<any> {
    const settings = {};

    const values = Object.keys(process.env)
      .filter(k => k.startsWith(this.envPrefix))
      .map(k => [k.slice(this.envPrefix.length).replace('__', '.'), process.env[k]]);

    values.forEach(([k, v]) => { set(settings, k, v); })

    return settings;
  }
}
