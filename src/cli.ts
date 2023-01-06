#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { packageDirectorySync } from 'pkg-dir';
import { Config, ConfigValue, Options } from './index.js';

const program = new Command()
  .name('big-config')
  .version('0.0.1')

  .option(
    '-d, --dir <path>',
    'the base directory from which to recursively load configurations',
    path.relative('.', path.join(packageDirectorySync() || '.', 'config'))
  )
  .option('-js, --enable-js', 'enable loading from JavaScript files', false)

  .option(
    '-p, --prefix <prefix>',
    'the prefix for environment variable names that will be merged with and override any ' +
      'values loaded from configuration file',
    'CONFIG__'
  )

  .option('--skip-local', 'skip loading values from the config/local directory', false)

  .option(
    '-e, --env <environment>',
    'the environment to use when loading configuration settings (development, staging, ' +
      'production)'
  )

  .option('-y, --yaml', 'output YAML', false)

  .option('-j, --json', 'output JSON', false);

program
  .command('env')
  .description('get the environment that will be used by the config system')
  .action(() => {
    const programOpts = program.opts();
    const loadLocalConfig = !programOpts.skipLocal;
    const config = new Config({ env: programOpts.env, loadLocalConfig });
    console.log(config.env);
  });

program
  .command('get [dottedPath]')
  .description(
    'get the value of the config item at the given dottedPath, or the entire config ' +
      'tree if no dottedPath supplied'
  )
  .action((dottedPath?: string) => {
    const programOpts = program.opts();

    const loadLocalConfig = !programOpts.skipLocal;

    const options: Options = {
      env: programOpts.env,
      dir: programOpts.dir,
      prefix: programOpts.prefix,
      loadLocalConfig,
    };

    const config = new Config(options);

    let result: ConfigValue | undefined = undefined;

    if (dottedPath) {
      result = config.get<ConfigValue>(dottedPath);
    } else {
      result = config.get();
    }

    if (!programOpts.yaml && !programOpts.json) {
      const exists = fs.existsSync(programOpts.dir);
      const found = exists && fs.statSync(programOpts.dir).isDirectory();
      console.log(
        `config root: ${path.resolve(programOpts.dir)}` + (found ? '' : ' <not found>')
      );
      console.log(`environment: ${config.env}`);
      console.log(`key path: ${dottedPath || '(entire config tree)'}`);
      console.log(`environment variable prefix: ${programOpts.prefix}`);
      console.log(`load config from config/local: ${loadLocalConfig ? 'yes' : 'no'}`);

      console.log('---');
    }

    if (typeof result === 'undefined') {
      console.log('err: value not found');
      process.exit(1);
    } else {
      if (programOpts.yaml) {
        console.log(yaml.dump(result));
      } else if (programOpts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(util.inspect(result, false, null, true));
      }
    }
  });

program
  .command('keys [dottedPath]')
  .description('get the key names of the config item at the given dottedPath')
  .action((dottedPath?: string) => {
    const programOpts = program.opts();

    const loadLocalConfig = !programOpts.skipLocal;

    const options: Record<string, unknown> = {
      env: programOpts.env,
      dir: programOpts.dir,
      prefix: programOpts.prefix,
      loadLocalConfig,
    };

    const config = new Config(options);

    const keys = dottedPath ? config.keys(dottedPath) : config.keys();
    if (!keys) {
      console.log('err: config item not found or is not an object with keys');
      process.exit(1);
    } else {
      if (programOpts.yaml) {
        console.log(yaml.dump(keys));
      } else if (programOpts.json) {
        console.log(JSON.stringify(keys, null, 2));
      } else {
        console.log(util.inspect(keys, false, null, true));
      }
    }
  });

program.parse(process.argv);
