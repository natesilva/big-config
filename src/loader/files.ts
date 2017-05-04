import * as fs from 'fs';
import * as path from 'path';

import { ConfigError } from '../error';
import { LoaderInterface } from './interface';

import merge = require('lodash.merge');
import cloneDeep = require('lodash.clonedeep');

export class FilesLoader implements LoaderInterface {
  public readonly configDir: string;

  /**
   * @param configDir the directory where the config files are located
   */
  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), 'config');

    if (!fs.existsSync(this.configDir)) {
      const msg = `config directory does not exist: ${this.configDir}`;
      console.error(msg);
      throw new ConfigError(msg);
    }

    const stats = fs.statSync(this.configDir);
    if (!stats.isDirectory()) {
      const msg = `config path must be a directory: ${this.configDir}`;
      console.error(msg);
      throw new ConfigError(msg);
    }
  }

  async load(env: string): Promise<any> {
    let settings = {};

    // default settings
    settings = FilesLoader.loadDirConfigs(path.join(this.configDir, 'default'));

    // env-specific overrides
    settings = merge(
      settings,
      FilesLoader.loadDirConfigs(path.join(this.configDir, env))
    );

    // local setting overrides
    settings = merge(
      settings,
      FilesLoader.loadDirConfigs(path.join(this.configDir, 'local'))
    );

    return settings;
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
}
