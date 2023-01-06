import { afterEach, describe, it } from 'mocha';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as td from 'testdouble';
import { Config } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Config class', () => {
  afterEach(() => {
    td.reset();
  });

  it('should load from fixtures', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir });
    assert.equal(config.env, 'development');
    assert.equal(config.getString('environment'), 'development');
    assert.deepEqual(config.get(), {
      environment: 'development',
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: true,
      },
    });
  });

  it('should allow directly specifying the env', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir, env: 'custom-env' });
    assert.equal(config.env, 'custom-env');
    assert.equal(config.getString('environment'), 'custom-env');
  });

  it("should throw if the env name is 'default'", () => {
    assert.throws(() => new Config({ env: 'default' }), /not a valid env name/);
  });

  it("should throw if the env name is 'local' and local config is enabled", () => {
    assert.throws(() => new Config({ env: 'local' }), /not a valid env name/);
  });

  it("should not throw if the env name is 'local' and local config is disabled", () => {
    assert.doesNotThrow(() => new Config({ env: 'local', loadLocalConfig: false }));
  });

  it('should load local directory when loadLocalConfig is true', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'bigConfigLocalEnabled');
    const config = new Config({ dir: fixtureDir, loadLocalConfig: true });
    assert.equal(config.env, 'development');
    assert.deepEqual(config.get(), {
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: true,
        localEnabled: true,
      },
    });
  });

  it('should NOT load local directory when loadLocalConfig is false', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'bigConfigLocalEnabled');
    const config = new Config({ dir: fixtureDir, loadLocalConfig: false });
    assert.equal(config.env, 'development');
    assert.deepEqual(config.get(), {
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: false,
        localEnabled: false,
      },
    });
  });

  it('should allow access to nested settings using dot notation', () => {
    td.replace(process, 'env');
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir });
    assert.equal(config.env, 'development');
    assert.deepEqual(config.get('logging'), {
      logLevel: 'debug',
      destination: 'debug.log.host',
      colorize: true,
    });
    assert.deepEqual(config.get('logging.logLevel'), 'debug');
  });

  describe('getOrFail', () => {
    it('should get the requested value', () => {
      td.replace(process, 'env');
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir });
      const result = config.getOrFail<string>('logging.destination');
      assert.equal(result, 'debug.log.host');
    });

    it('should throw if the requested value is not found', () => {
      td.replace(process, 'env');
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir });
      assert.throws(
        () => config.getOrFail<string>('nonExistent.value'),
        /value not found/
      );
    });
  });

  describe('keys', () => {
    it('should get the top-level keys', () => {
      td.replace(process, 'env');
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir });
      const result = config.keys();
      assert.deepEqual(result, ['logging', 'environment']);
    });

    it('should get nested keys', () => {
      td.replace(process, 'env');
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir });
      const result = config.keys('logging');
      assert.deepEqual(result, ['logLevel', 'colorize', 'destination']);
    });

    it('should return undefined if the path value is not an object', () => {
      td.replace(process, 'env');
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir });
      const result = config.keys('logging.destination');
      assert.deepEqual(result, undefined);
    });
  });

  describe('strongly-typed getters', () => {
    let fixtureDir: string;

    before(() => {
      fixtureDir = path.resolve(__dirname, 'fixtures', 'typeGetters');
    });

    describe('getString', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getString('examples.string');
        assert.equal(result, 'This is a string.');
      });

      it('should throw if the requested value is not a string', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getString('examples.number'), /not a string/);
      });
    });

    describe('getNumber', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getNumber('examples.number');
        assert.equal(result, 42);
      });

      it('should throw if the requested value is not a number', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getNumber('examples.string'), /not a number/);
      });
    });

    describe('getBoolean', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getBoolean('examples.boolean');
        assert.equal(result, false);
      });

      it('should throw if the requested value is not a boolean', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getBoolean('examples.string'), /not a boolean/);
      });
    });

    describe('getArray', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getArray<string>('examples.array');
        assert.deepEqual(result, ['Nebraska', 'North Dakota', 'Nunavut']);
      });

      it('should throw if the requested value is not an array', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getArray('examples.string'), /not an array/);
      });
    });

    describe('getBuffer', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getBuffer('examples.buffer');
        assert.deepEqual(result, Buffer.from('hello world'));
      });

      it('should throw if the requested value is not a Buffer', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getBuffer('examples.string'), /not a Buffer/);
      });
    });

    describe('getDate', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getDate('examples.timestamp');
        assert.deepEqual(result, new Date('2001-12-15T02:59:43.1Z'));
      });

      it('should throw if the requested value is not a Date', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getDate('examples.string'), /not a Date/);
      });
    });
  });
});
