import { cloneDeep, get, merge } from 'lodash';

import { ConfigError } from './error';
import { EnvironmentLoader } from './loader/environment';
import { FilesLoader } from './loader/files';
import { LoaderInterface } from './loader/interface';
import { S3Loader } from './loader/s3';

export class Config {
  private settings: any = {};
  // the first time get() or getAll() are called, settings are locked and can’t be changed
  private locked = false;
  // detect if load has ever been called; calling get() before load() is an error
  private hasCalledLoad = false;
  /** the detected environment (such as development, production, or staging) */
  public readonly env: string;

  constructor(env?: string) {
    this.env = env || process.env.NODE_ENV || 'development';
  }

  /**
   * Convenience factory method. Creates a Config object and applies the given loaders,
   * returning the initialized Config object.
   * @param loaders the loaders to load
   */
  static create(loaders: LoaderInterface | LoaderInterface[]) {
    if (!Array.isArray(loaders)) {
      loaders = [loaders];
    }

    const result = new Config();
    for (const loader of loaders) {
      result.load(loader);
    }
    return result;
  }

  /** load settings using the given Loader */
  load(loader: LoaderInterface) {
    if (this.locked) {
      const msg = 'settings are locked and can’t be updated once they have been accessed';
      throw new ConfigError(msg);
    }

    this.hasCalledLoad = true;
    const configValues = loader.load(this.env);
    this.settings = merge(this.settings, configValues);
  }

  /**
   * get a configuration setting
   * @param key the configuration setting to retrieve
   */
  get<T = any>(key: string): T {
    if (!this.hasCalledLoad) {
      const msg = 'attempt to access config settings before they have been loaded';
      throw new ConfigError(msg);
    }
    this.locked = true;
    return cloneDeep(get(this.settings, key));
  }

  /** get all settings */
  getAll() {
    if (!this.hasCalledLoad) {
      const msg = 'attempt to access config settings before they have been loaded';
      throw new ConfigError(msg);
    }
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

/** DEPRECATED: the single global Config instance (use new Config() instead) */
export const config = new Config();

export const Loaders = {
  FilesLoader: FilesLoader,
  EnvironmentLoader: EnvironmentLoader,
  S3Loader: S3Loader
};
