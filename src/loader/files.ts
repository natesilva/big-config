import * as fs from 'fs';
import * as path from 'path';
import * as stripJsonComments from 'strip-json-comments';
import * as yaml from 'js-yaml';

import { cloneDeep, merge } from 'lodash';

import { ConfigError } from '../error';
import { LoaderInterface } from './interface';

export class FilesLoader implements LoaderInterface {
  public readonly configDir: string;

  /**
   * @param configDir the directory where the config files are located
   */
  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), 'config');

    if (!fs.existsSync(this.configDir)) {
      const msg = `config directory does not exist: ${this.configDir}`;
      throw new ConfigError(msg);
    }

    const stats = fs.statSync(this.configDir);
    if (!stats.isDirectory()) {
      const msg = `config path must be a directory: ${this.configDir}`;
      throw new ConfigError(msg);
    }
  }

  load(env: string): any {
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

    if (!fs.existsSync(dir)) {
      return settings;
    }

    const configFilenames = fs
      .readdirSync(dir)
      .filter(x => ['.js', '.json', '.yaml', '.yml'].includes(path.extname(x)))
      .sort();

    configFilenames.forEach(configFilename => {
      const basename = path.basename(configFilename, path.extname(configFilename));
      let fp = path.join(dir, configFilename);
      const extname = path.extname(fp);
      // deep-clone the require’d object so any changes made to it don’t propagate
      if (extname === '.json') {
        // for JSON, strip out comments
        const input = fs.readFileSync(fp, 'utf8');
        settings[basename] = cloneDeep(JSON.parse(stripJsonComments(input)));
      } else if (extname === '.yml' || extname === '.yaml') {
        settings[basename] = cloneDeep(yaml.safeLoad(fs.readFileSync(fp, 'utf8')));
      } else {
        settings[basename] = cloneDeep(require(fp));
      }
    });

    return settings;
  }
}
