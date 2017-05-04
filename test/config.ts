// tslint:disable:no-unused-expression

// In this test suite we use the Config (capital C) class directly. In user code, they’ll
// use the single global config (lowercase c) object, which is an instance of Config.

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as uuid from 'uuid';

import { suite, test } from 'mocha-typescript';

import { Config } from '../src';
import { expect } from 'chai';
import { ConfigError } from '../src/error';

import merge = require('lodash.merge');
import cloneDeep = require('lodash.clonedeep');

// at runtime our __dirname will be <top dir>/prod/test
const awsConfigPath = path.join(__dirname, '..', '..', 'test', 'aws.json');
const useAws = fs.existsSync(awsConfigPath);
let s3Prefix: string = null;
let awsConfig: any = null;
if (useAws) {
  AWS.config.loadFromPath(awsConfigPath);
  awsConfig = require(awsConfigPath);
  s3Prefix = awsConfig.prefix;
  if (!s3Prefix.endsWith('/')) { s3Prefix += '/'; }
  s3Prefix += uuid.v4();
}

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


const { name: jsonTmpDir } = tmp.dirSync({unsafeCleanup: true});
const { name: jsTmpDir } = tmp.dirSync({unsafeCleanup: true});

@suite('big-config configuration parser')
export class ConfigTests {
  static s3KeysCreated: string[] = [];

  // setup that runs once before any tests
  static async before() {
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

    // drop the files on to AWS
    if (useAws) {
      const s3 = new AWS.S3();

      let prefix = s3Prefix;
      if (!prefix.endsWith('/')) { prefix += '/'; }

      for (let fixtureName of Object.keys(fixtures)) {
        const fixture = fixtures[fixtureName].input;
        const fixtureDir = path.join(jsTmpDir, fixtureName);

        for (let envName of Object.keys(fixture)) {
          if (envName === 'local') {
            // the S3 loader doesn’t use 'local'
            continue;
          }
          const env = fixture[envName];
          const ourPrefix = `${prefix}${fixtureName}/${envName}`;

          for (let filename of Object.keys(env)) {
            const values = env[filename];
            const key = `${ourPrefix}/${filename}.json`;
            await s3.putObject({
              Bucket: awsConfig.bucketName,
              Key: key,
              Body: JSON.stringify(values),
              ContentType: 'application/json'
            }).promise();
            this.s3KeysCreated.push(key);
          }
        }
      }
    }
  }

  // cleanup that runs once after all tests are completed
  static async after() {
    // remove S3 files
    if (useAws) {
      const s3 = new AWS.S3();
      await s3.deleteObjects({
        Bucket: awsConfig.bucketName,
        Delete: {
          Objects: this.s3KeysCreated.map(key => ({ Key: key }))
        }
      }).promise();
    }
  }

  // cleanup that runs after each test
  after() {
    let keys = Object.keys(process.env).filter(k => k.startsWith('CONFIG__'));
    keys.forEach(key => delete process.env[key]);

    keys = Object.keys(process.env).filter(k => k.startsWith('BIGCONFIG_'));
    keys.forEach(key => delete process.env[key]);
  }

  @test async 'load configs from .json' () {
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        const config = new Config(env);
        const filesPath = path.join(jsonTmpDir, fixtureName);
        await config.load(new config.Loader.FilesLoader(filesPath));
        const expected = fixture.merged[env];
        expect(config.getAll(), `${fixtureName}/${env} getAll`).to.deep.equal(expected);
        Object.keys(expected).forEach(key => {
          expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
        });
      }
    }
  }

  @test async 'load configs from .js' () {
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        const config = new Config(env);
        const filesPath = path.join(jsTmpDir, fixtureName);
        await config.load(new config.Loader.FilesLoader(filesPath));
        const expected = fixture.merged[env];
        expect(config.getAll(), `${fixtureName}/${env} getAll`).to.deep.equal(expected);
        Object.keys(expected).forEach(key => {
          expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
        });
      }
    }
  }

  @test async 'load configs from S3' () {
    if (!useAws) { throw new Error('AWS not configured'); }
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        if (env === 'local') {
          // the S3 loader doesn’t support 'local'
          continue;
        }
        const config = new Config(env);
        let prefix = s3Prefix;
        if (!prefix.endsWith('/')) { prefix += '/'; }
        prefix += fixtureName;
        await config.load(new config.Loader.S3Loader(awsConfig.bucketName, prefix));

        // calculate the expected result; can’t use the `merged` value that we used for
        // JSON and .js -- it incorporates any changes made by the `local` config, which
        // is not available in the S3 loader
        let expected = cloneDeep(fixture.input['default']);
        expected = merge(expected, cloneDeep(fixture.input[env]));

        expect(config.getAll(), `${fixtureName}/${env} getAll`).to.deep.equal(expected);
        Object.keys(expected).forEach(key => {
          expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
        });
      }
    }
  }

  @test async 'load configs from S3 (prefix ends with slash)' () {
    if (!useAws) { throw new Error('AWS not configured'); }
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        if (env === 'local') {
          // the S3 loader doesn’t support 'local'
          continue;
        }
        const config = new Config(env);
        let prefix = s3Prefix;
        if (!prefix.endsWith('/')) { prefix += '/'; }
        prefix += fixtureName + '/';
        await config.load(new config.Loader.S3Loader(awsConfig.bucketName, prefix));

        // calculate the expected result; can’t use the `merged` value that we used for
        // JSON and .js -- it incorporates any changes made by the `local` config, which
        // is not available in the S3 loader
        let expected = cloneDeep(fixture.input['default']);
        expected = merge(expected, cloneDeep(fixture.input[env]));

        expect(config.getAll(), `${fixtureName}/${env} getAll`).to.deep.equal(expected);
        Object.keys(expected).forEach(key => {
          expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
        });
      }
    }
  }

  @test async 'augment settings with environment variables' () {
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        const password = uuid.v4();
        const host = uuid.v4();
        process.env.CONFIG__database__host = host;
        process.env.CONFIG__database__password = password;

        const config = new Config(env);
        const filesPath = path.join(jsonTmpDir, fixtureName);
        await config.load(new config.Loader.FilesLoader(filesPath));
        await config.load(new config.Loader.EnvironmentLoader());

        expect(config.get('database.password')).to.equal(password);
        expect(config.get('database.host')).to.equal(host);

        delete process.env.CONFIG__database__host;
        delete process.env.CONFIG__database__password;
      }
    }
  }

  @test async 'environment variables can be renamed' () {
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        const password = uuid.v4();
        const host = uuid.v4();
        process.env.MY_CONFIG_database__host = host;
        process.env.MY_CONFIG_database__password = password;

        const config = new Config(env);
        const filesPath = path.join(jsonTmpDir, fixtureName);
        await config.load(new config.Loader.FilesLoader(filesPath));
        await config.load(new config.Loader.EnvironmentLoader('MY_CONFIG_'));

        expect(config.get('database.password')).to.equal(password);
        expect(config.get('database.host')).to.equal(host);

        delete process.env.CONFIG__database__host;
        delete process.env.CONFIG__database__password;
      }
    }
  }

  @test async 'missing config directory should throw' () {
    const fn = () => {
      const config = new Config();
      config.load(
        new config.Loader.FilesLoader('/nonexistent-path/' + uuid.v4())
      );
    };
    expect(fn).to.throw(ConfigError);

    const fn2 = () => {
      const config = new Config();
      // look for this very project’s config dir; this project doesn’t have one
      config.load(new config.Loader.FilesLoader());
    };
    expect(fn2).to.throw(ConfigError);
  }

  @test 'should throw if config dir name is a file instead of a dir' () {
    const fn = () => {
      const config = new Config();
      config.load(new config.Loader.FilesLoader(__filename));
    };
    expect(fn).to.throw(ConfigError);
  }

  @test async 'settings can’t be changed after they are accessed' () {
    for (let fixtureName of Object.keys(fixtures)) {
      const fixture = fixtures[fixtureName];
      const envs = Object.keys(fixture.merged);

      for (let env of envs) {
        const config = new Config(env);
        const filesPath = path.join(jsonTmpDir, fixtureName);
        await config.load(new config.Loader.FilesLoader(filesPath));
        expect(config.get('database.host')).to.equal(fixture.merged[env].database.host);

        let didThrow = false;
        await config.load(new config.Loader.FilesLoader(filesPath))
          .catch(err => { didThrow = true; })
        ;

        expect(didThrow).to.be.true;
      }
    }
  }
}
