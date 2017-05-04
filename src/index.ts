import merge = require('lodash.merge');
import cloneDeep = require('lodash.clonedeep');
import get = require('lodash.get');

import * as deasync from 'deasync';

import { ConfigError } from './error';
import { EnvironmentLoader } from './loader/environment';
import { FilesLoader } from './loader/files';
import { LoaderInterface } from './loader/interface';
import { S3Loader } from './loader/s3';

export class Config {
  private settings: any = {};
  // the first time get() or getAll() are called, settings are locked and can’t be changed
  private locked = false;
  /** the detected environment (such as development, production, or staging) */
  public readonly env: string;

  constructor(env?: string) {
    this.env = env || process.env.NODE_ENV || 'development';
  }

  /** load settings using the given Loader */
  load(loader: LoaderInterface) {
    if (this.locked) {
      const msg = 'settings are locked and can’t be updated once they have been accessed';
      throw new ConfigError(msg);
    }

    const fn = (cb) => {
      loader.load(this.env).then(data => { cb(null, data); }).catch(cb);
    };

    const configValues = deasync(fn)();
    this.settings = merge(this.settings, configValues);
  }

  /**
   * get a configuration setting
   * @param key the configuration setting to retrieve
   */
  get<T=any>(key: string): T {
    this.locked = true;
    return cloneDeep(get<T>(this.settings, key));
  }

  /** get all settings */
  getAll() {
    this.locked = true;
    return cloneDeep(this.settings);
  }

  /** the available loader classes */
  public readonly Loader = {
    FilesLoader: FilesLoader,
    EnvironmentLoader: EnvironmentLoader,
    S3Loader: S3Loader
  };
}

// the single global Config instance
export const config = new Config();
