import { cloneDeep, get, isPlainObject, isUndefined, merge, omitBy } from 'lodash';
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
   * The environment to use. (default: the value of the NODE_ENV environment variable, or
   * 'development' if it is not set)
   */
  env?: string;
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
  /**
   * Whether to load config from the `local` directory. (default: true)
   */
  loadLocalConfig?: boolean;
  /**
   * JSON configuration to use as the base configuration. This will be merged with
   * configuration loaded from files and environment variables.
   */
  json?: ConfigValue;
}

const DEFAULT_OPTIONS: Required<Options> = {
  env: process.env.NODE_ENV || 'development',
  dir: path.resolve(process.cwd(), 'config'),
  enableJs: false,
  prefix: 'CONFIG__',
  loadLocalConfig: true,
  json: {},
};

export class Config {
  /** the currently-active environment */
  public readonly env: string;
  private readonly settings: ConfigValue;

  /** Initialize the config system. Synchronously builds the entire config tree. */
  constructor(options?: Options) {
    const resolvedOptions = { ...DEFAULT_OPTIONS, ...omitBy(options, isUndefined) };

    if (
      resolvedOptions.env === 'default' ||
      (resolvedOptions.env === 'local' && resolvedOptions.loadLocalConfig)
    ) {
      throw new Error(`[big-config] ${resolvedOptions.env} is not a valid env name`);
    }

    this.env = resolvedOptions.env;
    this.settings = {};

    this.settings = merge(this.settings, resolvedOptions.json);

    const defaultDir = path.resolve(resolvedOptions.dir, 'default');
    const envDir = path.resolve(resolvedOptions.dir, this.env);
    const localDir = path.resolve(resolvedOptions.dir, 'local');

    if (resolvedOptions.enableJs) {
      console.warn(
        '[big-config] enabling potentially unsafe parsing of .js files because the ' +
          'enableJs option is true'
      );
    }

    this.settings = merge(
      this.settings,
      loadFromFiles(defaultDir, resolvedOptions.enableJs)
    );
    const lff = loadFromFiles(envDir, resolvedOptions.enableJs);
    this.settings = merge(this.settings, lff);
    if (resolvedOptions.loadLocalConfig) {
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

  /** Get the top-level key names for the settings tree. */
  keys(): string[];
  /** Get the available key names at the specified config path. */
  keys(atKey: string): string[] | undefined;
  keys(atKey?: string): string[] | undefined {
    const root = atKey
      ? (get(this.settings, atKey) as ConfigValue | undefined)
      : this.settings;

    if (!isPlainObject(root)) {
      return undefined;
    }

    return Object.keys(root as ConfigObject);
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

    if (Buffer.isBuffer(value)) {
      return value;
    }

    if (value instanceof Uint8Array) {
      return Buffer.from(value.buffer);
    }

    throw new Error(`[big-config] value for key ${key} is not a Buffer or Uint8Array`);
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
