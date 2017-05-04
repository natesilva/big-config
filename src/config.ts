import merge = require('lodash.merge');
import cloneDeep = require('lodash.clonedeep');
import get = require('lodash.get');

import { ConfigError } from './error';
import { Loader } from './loader/interface';

export class Config {
  // note: settings are STATIC because there’s only one global set of settings
  private static settings: any = {};
  // the first time get() or getAll() are called, settings are locked and can’t be changed
  private static locked = false;
  /** the detected environment (such as development, production, or staging) */
  public readonly env: string;

  constructor(env?: string) {
    this.env = env || process.env.NODE_ENV || 'development';
  }

  /** load settings using the given Loader */
  async load(loader: Loader) {
    if (Config.locked) {
      const msg = 'settings are locked and can’t be updated once they have been accessed';
      throw new ConfigError(msg);
    }
    const configValues = await loader.load(this.env);
    Config.settings = merge(Config.settings, configValues);
  }

  /**
   * get a configuration setting
   * @param key the configuration setting to retrieve
   */
  get<T=any>(key: string): T {
    Config.locked = true;
    return cloneDeep(get<T>(Config.settings, key));
  }

  /** get all settings */
  getAll() {
    Config.locked = true;
    return cloneDeep(Config.settings);
  }
}
