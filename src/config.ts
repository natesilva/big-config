import { cloneDeep, get, merge } from 'lodash';
import * as path from 'path';
import loadFromEnv from './loadFromEnv';
import loadFromFiles from './loadFromFiles';

/**
 * The possible types that can be stored in a configuration. We support anything YAML
 * does. YAML is mostly JSON, plus Buffer, which is returned for !!binary strings.
 *
 */
export interface ConfigArray extends Array<ConfigValue> {} // eslint-disable-line
export type ConfigObject = { [Key in string]?: ConfigValue };
export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | Buffer
  | ConfigObject
  | ConfigArray;

const MISSING_VALUE = Symbol('MISSING_VALUE');

export interface Options {
  /**
   * The base directory from which to recursively load configurations (default: a
   * directory named `config`, located in the working directory, typically the top level
   * of your project)
   */
  dir?: string;
  /**
   * If true, enable loading from JavaScript files by using require(). This eval-like
   * behavior is deprecated and potentially unsafe. (default: false)
   */
  enableJs?: boolean;
  /**
   * The prefix for environment variable names that will be merged with and override any
   * values loaded from configuration files. (default: CONFIG__).
   */
  prefix?: string;
}

const DEFAULT_OPTIONS: Required<Options> = {
  dir: path.resolve(process.cwd(), 'config'),
  enableJs: false,
  prefix: 'CONFIG__',
};

export class Config {
  /** the currently-active environment */
  public readonly env = process.env.NODE_ENV || 'development';
  private readonly settings: ConfigValue;

  /** Initialize the config system. Synchronously builds the entire config tree. */
  constructor(options?: Options) {
    const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

    const defaultDir = path.resolve(resolvedOptions.dir, 'default');
    const envDir = path.resolve(resolvedOptions.dir, this.env);
    const localDir = path.resolve(resolvedOptions.dir, 'local');

    if (resolvedOptions.enableJs) {
      console.warn(
        '[big-config] enabling potentially unsafe parsing of .js files because the ' +
          'enableJs option is true'
      );
    }

    this.settings = loadFromFiles(defaultDir, resolvedOptions.enableJs);
    this.settings = merge(this.settings, loadFromFiles(envDir, resolvedOptions.enableJs));
    if (process.env.BIG_CONFIG_ENABLE_LOCAL === 'true') {
      this.settings = merge(
        this.settings,
        loadFromFiles(localDir, resolvedOptions.enableJs)
      );
    }

    this.settings = merge(this.settings, loadFromEnv(resolvedOptions.prefix));
  }

  /** Get the complete settings tree. */
  get(): ConfigValue;
  /** Get a specific setting. A dot-separated path may be used to access nested values. */
  get<T extends ConfigValue>(key: string): T | undefined;
  get<T extends ConfigValue>(key?: string): T | ConfigValue | undefined {
    if (typeof key !== 'string') {
      return cloneDeep(this.settings);
    }
    return cloneDeep(get(this.settings, key) as T);
  }

  /**
   * Get a specific setting. If it is not found, throw an Error. A dot-separated path may
   * be used to access nested values.
   *
   * @returns the requested value, if found
   * @throws if the requested value was not found
   */
  getOrFail<T extends ConfigValue>(key: string): T {
    const value = get(this.settings, key, MISSING_VALUE) as unknown;
    if (value === MISSING_VALUE) {
      throw new Error(`[big-config] value not found for key ${key}`);
    }
    return value as T;
  }

  /**
   * Get a setting known to be a string. If it is not defined or not a string, an Error is
   * thrown.
   *
   * @returns the requested value, if found and is a string
   * @throws if the requested value was not found or not a string
   */
  getString(key: string): string {
    const value = this.getOrFail(key) as unknown;
    if (typeof value !== 'string') {
      throw new Error(`[big-config] value for key ${key} is not a string`);
    }
    return value;
  }

  /**
   * Get a setting known to be a number. If it is not defined or not a number, an Error is
   * thrown.
   *
   * @returns the requested value, if found and is a number
   * @throws if the requested value was not found or not a number
   */
  getNumber(key: string): number {
    const value = this.getOrFail(key) as unknown;
    if (typeof value !== 'number') {
      throw new Error(`[big-config] value for key ${key} is not a number`);
    }
    return value;
  }

  /**
   * Get a setting known to be a boolean. If it is not defined or not a boolean, an Error
   * is thrown.
   *
   * @returns the requested value, if found and is a boolean
   * @throws if the requested value was not found or not a boolean
   */
  getBoolean(key: string): boolean {
    const value = this.getOrFail(key) as unknown;
    if (typeof value !== 'boolean') {
      throw new Error(`[big-config] value for key ${key} is not a boolean`);
    }
    return value;
  }

  /**
   * Get a setting known to be an array. If it is not defined or not an array, an Error
   * is thrown.
   *
   * @returns the requested value, if found and is a boolean
   * @throws if the requested value was not found or not a boolean
   */
  getArray<T>(key: string): T[] {
    const value = this.getOrFail(key) as unknown;
    if (!Array.isArray(value)) {
      throw new Error(`[big-config] value for key ${key} is not an array`);
    }
    return value as T[];
  }

  /**
   * Get a setting known to be a Buffer. If it is not defined or not a Buffer, an Error is
   * thrown. Buffer values are only possible when using YAML, for strings defined as
   * `!!binary`.
   *
   * @returns the requested value, if found and is a Buffer
   * @throws if the requested value was not found or not a Buffer
   */
  getBuffer(key: string): Buffer {
    const value = this.getOrFail(key) as unknown;
    if (!Buffer.isBuffer(value)) {
      throw new Error(`[big-config] value for key ${key} is not a Buffer`);
    }
    return value;
  }

  /**
   * Get a setting known to be a Date. If it is not defined or not a Date, an Error is
   * thrown. Date values are only possible when using YAML. Within YAML this type is known
   * as `!!timestamp`.
   *
   * @returns the requested value, if found and is a Buffer
   * @throws if the requested value was not found or not a Buffer
   */
  getDate(key: string): Date {
    const value = this.getOrFail(key) as unknown;
    if (!(value instanceof Date)) {
      throw new Error(`[big-config] value for key ${key} is not a Date`);
    }
    return value;
  }
}
