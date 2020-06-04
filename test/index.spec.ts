import * as assert from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as path from 'path';
import * as td from 'testdouble';
import { Config } from '../src';

describe('Config class', () => {
  afterEach(() => {
    td.reset();
  });

  it('should load from fixtures', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir });
    assert.strictEqual(config.env, 'development');
    assert.deepStrictEqual(config.get(), {
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: true,
      },
    });
  });

  it('should include legacy JavaScript when set in options', () => {
    td.replace(process, 'env');
    td.replace(console, 'warn');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir, enableJs: true });
    assert.strictEqual(config.env, 'development');
    assert.deepStrictEqual(config.get(), {
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: true,
      },
      legacy: {
        legacyJavaScript: 'hello',
      },
    });
  });

  it('should warn about unsafe legacy JavaScript parsing', () => {
    td.replace(console, 'warn');
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    new Config({ dir: fixtureDir, enableJs: true });
    td.verify(console.warn(td.matchers.contains('enabling potentially unsafe parsing')));
  });

  it('should allow access to nested settings using dot notation', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir });
    assert.strictEqual(config.env, 'development');
    assert.deepStrictEqual(config.get('logging'), {
      logLevel: 'debug',
      destination: 'debug.log.host',
      colorize: true,
    });
    assert.deepStrictEqual(config.get('logging.logLevel'), 'debug');
  });
});
