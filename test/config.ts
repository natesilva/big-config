// tslint:disable:no-unused-expression

import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';

import { only, suite, test } from 'mocha-typescript';

import { BigConfig } from '../src/config';
import { BigConfigError } from '../src/error';
import { expect } from 'chai';

// process.on('unhandledRejection', (err: Error) => {
  //   console.error(
  //     '🙅  REJECTED: unhandled Promise rejection, crashing now, stack is:\n',
  //     err
  //   );
  //   process.exit(1);
  // });

// test fixtures: generate an array of {key: <uuid>, value: <uuid>}
const fixtures = {
    test1: {
        input: {
            default: {
                'database': { host: 'default.db', port: 3306, user: 'dbuser' },
                'aws': { region: 'us-west-2', profile: 'app-aws-profile' }
            },

            development: {
                'database': { host: 'dev.db', debug: true }
            },

            production: {
                'aws': { secretAccessKey: '1234567890ABCDEFG' },
                'redis': { host: 'redis.host' }
            },

            local: {
                'database': { user: 'otheruser' }
            }
        },

        merged: {
            development: {
                database: { host: 'dev.db', port: 3306, user: 'otheruser', debug: true },
                aws: { region: 'us-west-2', profile: 'app-aws-profile' }
            },

            production: {
                database: { host: 'default.db', port: 3306, user: 'otheruser' },
                aws: { region: 'us-west-2', profile: 'app-aws-profile', secretAccessKey: '1234567890ABCDEFG' },
                redis: { host: 'redis.host' }
            },

            staging: {
                database: { host: 'default.db', port: 3306, user: 'otheruser' },
                aws: { region: 'us-west-2', profile: 'app-aws-profile' }
            }
        }
    }
};


// const tmpdir = path.join(__dirname, 'fixtures');
// fs.mkdirSync(tmpdir);
const { name: jsonTmpDir } = tmp.dirSync({unsafeCleanup: true});
const { name: jsTmpDir } = tmp.dirSync({unsafeCleanup: true});

@suite('big-config configuration parser')
export class BigConfigTests {
  static before() {
    // create the test files as JSON
    Object.keys(fixtures).forEach(fixtureName => {
      const fixture = fixtures[fixtureName].input;
      const fixtureDir = path.join(jsonTmpDir, fixtureName);
      fs.mkdirSync(fixtureDir);
      Object.keys(fixture).forEach(envName => {
        const env = fixture[envName];
        const envDir = path.join(fixtureDir, envName);
        fs.mkdirSync(envDir);
        Object.keys(env).forEach(filename => {
          const values = env[filename];
          fs.writeFileSync(
            path.join(envDir, filename + '.json'),
            JSON.stringify(values)
          );
        });
      });
    });

    // create the test files as JavaScript
    Object.keys(fixtures).forEach(fixtureName => {
      const fixture = fixtures[fixtureName].input;
      const fixtureDir = path.join(jsTmpDir, fixtureName);
      fs.mkdirSync(fixtureDir);
      Object.keys(fixture).forEach(envName => {
        const env = fixture[envName];
        const envDir = path.join(fixtureDir, envName);
        fs.mkdirSync(envDir);
        Object.keys(env).forEach(filename => {
          const values = env[filename];
          fs.writeFileSync(
            path.join(envDir, filename + '.js'),
            `module.exports = ${JSON.stringify(values)};`
          );
        });
      });
    });
  }

  @test 'load configs from .json' () {
    Object.keys(fixtures).forEach(fixtureName => {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      envs.forEach(env => {
        const config = new BigConfig(path.join(jsonTmpDir, fixtureName), env);
        const expected = fixture.merged[env];
        Object.keys(expected).forEach(key => {
          expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
        });
      });
    });
  }

  @test 'load configs from .js' () {
    Object.keys(fixtures).forEach(fixtureName => {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      envs.forEach(env => {
        const config = new BigConfig(path.join(jsonTmpDir, fixtureName), env);
        const expected = fixture.merged[env];
        Object.keys(expected).forEach(key => {
          expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
        });
      });
    });
  }

  @test 'missing config directory should throw' () {
    const fn = () => {
      // this very project doesn’t have a config dir
      const config = new BigConfig();
    }
    expect(fn).to.throw(Error);
  }

  @test 'should throw if config dir name is a file instead of a dir' () {
    const fn = () => {
      const config = new BigConfig(__filename);
    }
    expect(fn).to.throw(Error);
  }

  @test 'should allow using an environment variable to specify the config dir' () {
    process.env.NODE_CONFIG_DIR = jsonTmpDir;
    const config = new BigConfig();
  }

  @test 'should allow using a relative environment variable to specify the config dir' ()
  {
    process.env.NODE_CONFIG_DIR = './' + path.relative('.', jsonTmpDir);
    const config = new BigConfig();
    delete process.env.NODE_CONFIG_DIR;
  }

  @test 'default config location should be correct' ()
  {
    const actual = BigConfig.getConfigDir();
    const expected = path.join(process.cwd(), 'config');
    expect(actual).to.equal(expected);
  }
}
