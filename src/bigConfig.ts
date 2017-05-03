import * as fs from 'fs';
import * as path from 'path';

import { BigConfigError } from './error';
import merge = require('lodash.merge');
import get = require('lodash.get');
import cloneDeep = require('lodash.clonedeep');


export class BigConfig {
  private readonly configDir: string;
  /** the detected environment, such as 'production' or 'development' */
  public readonly env: string;
  private settings: any = {};

  /** load the project configuration */
  constructor(configDir?: string, env?: string) {
    this.configDir = configDir || BigConfig.getConfigDir();
    this.env = env || process.env.NODE_ENV || 'development';

    if (!fs.existsSync(this.configDir)) {
      const msg = `config directory does not exist: ${this.configDir}`;
      console.error(msg);
      throw new BigConfigError(msg);
    }

    const stats = fs.statSync(this.configDir);
    if (!stats.isDirectory()) {
      const msg = `config path must be a directory: ${this.configDir}`;
      console.error(msg);
      throw new BigConfigError(msg);
    }

    this.loadConfig();
  }

  private loadConfig() {
    // default settings
    this.settings = BigConfig.loadDirConfigs(path.join(this.configDir, 'default'));

    // env-specific overrides
    this.settings = merge(
      this.settings,
      BigConfig.loadDirConfigs(path.join(this.configDir, this.env))
    );

    // local setting overrides
    this.settings = merge(
      this.settings,
      BigConfig.loadDirConfigs(path.join(this.configDir, 'local'))
    );
  }

  /** build a config object by reading all the config files in this dir */
  private static loadDirConfigs(dir: string) {
    const settings = {};

    if (!fs.existsSync(dir)) { return settings; }

    const configFilenames = fs.readdirSync(dir).filter(
      x => x.slice(-3) === '.js' || x.slice(-5) === '.json'
    ).sort();

    configFilenames.forEach(configFilename => {
        const basename = path.basename(configFilename, path.extname(configFilename));
        let fp = path.join(dir, configFilename);
        // deep-clone the require’d object so any changes made to it don’t propagate
        settings[basename] = cloneDeep(require(path.join(dir, configFilename)));
    });

    return settings;
  }

  /**
   * get a configuration setting
   * @param key the configuration setting to retrieve
   */
  get<T=any>(key: string): T { return cloneDeep(get<T>(this.settings, key)); }

  /** get all settings */
  getAll() { return cloneDeep(this.settings); }

  /**
   * Return the expected location of the `config` directory, which must be located in the
   * same directory as the project’s `package.json`. This function does NOT check if the
   * directory actually exists.
   */
  static getConfigDir() {
    let result = process.env.NODE_CONFIG_DIR || path.join(process.cwd(), 'config');
    if (result.indexOf('.') === 0) { result = path.join(process.cwd() , result); }
    return result;
  }
}
