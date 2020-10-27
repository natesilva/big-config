#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as pkgDir from 'pkg-dir';
import * as util from 'util';
import { Config, ConfigValue } from '.';

program.name('big-config').version('0.0.1');

program.option(
  '-d, --dir <path>',
  'the base directory from which to recursively load configurations',
  path.relative('.', path.join(pkgDir.sync() || '.', 'config'))
);

program.option('-js, --enable-js', 'enable loading from JavaScript files', false);

program.option(
  '-p, --prefix <prefix>',
  'the prefix for environment variable names that will be merged with and override any ' +
    'values loaded from configuration file',
  'CONFIG__'
);

program.option(
  '--skip-local',
  'skip loading values from the config/local directory',
  false
);

program.option(
  '-e, --env <environment>',
  'the environment to use when loading configuration settings (development, staging, ' +
    'production)'
);

program.option('-y, --yaml', 'output YAML', false);
program.option('-j, --json', 'output JSON', false);

program
  .command('env')
  .description('get the environment that will be used by the config system')
  .action(() => {
    const programOpts = program.opts();
    if (programOpts.env) {
      console.log(programOpts.env);
    } else {
      const config = new Config();
      console.log(config.env);
    }
  });

program
  .command('get [dottedPath]')
  .description(
    'get the value of the config item at the given dottedPath, or the entire config ' +
      'tree if no dottedPath supplied'
  )
  .action((dottedPath?: string) => {
    const programOpts = program.opts();

    const options: Record<string, unknown> = {
      dir: programOpts.dir,
      enableJs: programOpts.enableJs,
      prefix: programOpts.prefix,
      loadLocalConfig: programOpts.loadLocalConfig,
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
      console.log(`parse JavaScript: ${programOpts.enableJs ? 'yes' : 'no'}`);
      console.log(`environment variable prefix: ${programOpts.prefix as string}`);
      console.log(
        `load config from config/local: ${programOpts.loadLocalConfig ? 'yes' : 'no'}`
      );

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

program.parse(process.argv);

const options: Record<string, unknown> = {};
if (typeof program.dir === 'string') {
  options.dir = program.dir;
}
if (typeof program.enableJs === 'boolean') {
  options.enableJs = program.enableJs;
}
if (typeof program.prefix === 'string') {
  options.prefix = program.prefix;
}
if (typeof program.skipLocal === 'boolean') {
  options.loadLocalConfig = !program.skipLocal;
}

// console.log(program);

// const config = new Config(options);
