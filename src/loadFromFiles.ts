import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as JSON5 from 'json5';
import { cloneDeep } from 'lodash';
import * as path from 'path';
import { JsonValue } from 'type-fest';
import { ConfigValue } from './index';

/**
 * Load configuration settings from a directory containing configuration files.
 *
 * @param dir the directory from which to recursively load configurations
 * @param enableJs if true, enable loading from JavaScript files by using require(). This
 *  eval-like behavior is deprecated and potentially unsafe.
 */
export default function loadFromFiles(dir: string, enableJs = false) {
  const results: ConfigValue = {};

  if (!fs.existsSync(dir)) {
    return results;
  }

  if (!fs.statSync(dir).isDirectory()) {
    throw new Error(`[big-config] the specified config path is not a directory: ${dir}`);
  }

  const filenames = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((x) => x.isFile())
    .sort((a, b) => a.name.localeCompare(b.name));

  // keep track of which config files we have seen, so we can detect duplicates
  const seen: Record<string, string[]> = {};

  filenames.forEach((dirent) => {
    const basename = path.basename(dirent.name, path.extname(dirent.name));
    const fullPath = path.resolve(dir, dirent.name);
    const ext = path.extname(fullPath);

    if (seen[basename]) {
      seen[basename].push(dirent.name);
    } else {
      seen[basename] = [dirent.name];
    }

    try {
      switch (ext) {
        case '.json5':
          {
            const input = fs.readFileSync(fullPath, 'utf8');
            results[basename] = JSON5.parse(input);
          }
          break;

        case '.json':
          {
            const input = fs.readFileSync(fullPath, 'utf8');
            results[basename] = JSON.parse(input) as JsonValue;
          }
          break;

        case '.yml':
        case '.yaml':
          {
            const input = fs.readFileSync(fullPath, 'utf8');
            results[basename] = yaml.load(input) as ConfigValue;
          }
          break;

        case '.js':
          if (enableJs) {
            // eslint-disable-next-line
            results[basename] = cloneDeep(require(fullPath) as ConfigValue);
          }
          break;
      }
    } catch (err) {
      assert(err instanceof Error);
      err.message = `during import of ${fullPath}: ${err.message}`;
      throw err;
    }
  });

  // warn about any duplicates
  for (const [, duplicates] of Object.entries(seen)) {
    if (duplicates.length > 1) {
      const msg =
        '[big-config] there are multiple configuration files in one directory with the ' +
        'same basename; this is not recommended, as their settings may conflict';
      console.warn(msg, { dir, duplicates });
    }
  }

  return results;
}
