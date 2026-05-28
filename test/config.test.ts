/* eslint-disable @typescript-eslint/no-empty-function */
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { strict as assert } from 'node:assert';
import * as path from 'node:path';
import type { ConfigValue } from '../src/config';
import { Config } from '../src/config';

describe('Config class', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Clean up all mocks
    mock.restore();
    mock.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('should load from fixtures', () => {
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
    assert.equal(config.env, process.env.NODE_ENV);
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

  it('should load from passed-in JSON', () => {
    const mockConfig: ConfigValue = {
      key1: {
        key2: {
          key3: 'the value',
        },
      },
      settingA: 'the value',
      settingB: {
        settingC: 'the value',
      },
    };

    process.env.NODE_ENV = 'development';
    const config = new Config({ json: mockConfig, env: process.env.NODE_ENV });
    assert.equal(config.env, process.env.NODE_ENV);
    assert.deepEqual(config.get(), {
      ...mockConfig,
    });
  });

  it('should load defaults from passed-in JSON, and override with settings from files', () => {
    const mockConfig: ConfigValue = {
      key1: {
        key2: {
          key3: 'the value',
        },
      },
      settingA: 'the value',
      settingB: {
        settingC: 'the value',
      },
      environment: 'the environment',
    };

    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({
      dir: fixtureDir,
      env: process.env.NODE_ENV,
      json: mockConfig,
    });
    assert.equal(config.env, process.env.NODE_ENV);
    assert.equal(config.getString('environment'), 'development');
    assert.deepEqual(config.get(), {
      ...mockConfig,
      environment: 'development',
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: true,
      },
    });
  });

  it('should allow directly specifying the env', () => {
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
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'bigConfigLocalEnabled');
    const config = new Config({
      dir: fixtureDir,
      env: process.env.NODE_ENV,
      loadLocalConfig: true,
    });
    assert.equal(config.env, process.env.NODE_ENV);
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
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'bigConfigLocalEnabled');
    const config = new Config({
      dir: fixtureDir,
      env: process.env.NODE_ENV,
      loadLocalConfig: false,
    });
    assert.equal(config.env, process.env.NODE_ENV);
    assert.deepEqual(config.get(), {
      logging: {
        logLevel: 'debug',
        destination: 'debug.log.host',
        colorize: false,
        localEnabled: false,
      },
    });
  });

  it('should include legacy JavaScript when set in options', () => {
    spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({
      dir: fixtureDir,
      env: process.env.NODE_ENV,
      enableJs: true,
    });
    assert.equal(config.env, process.env.NODE_ENV);
    assert.deepEqual(config.get(), {
      environment: 'development',
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
    spyOn(console, 'warn').mockImplementation(() => {});
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    new Config({ dir: fixtureDir, env: process.env.NODE_ENV, enableJs: true });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/enabling potentially unsafe parsing/)
    );
  });

  it('should allow access to nested settings using dot notation', () => {
    process.env.NODE_ENV = 'development';
    const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
    const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
    assert.equal(config.env, process.env.NODE_ENV);
    assert.deepEqual(config.get('logging'), {
      logLevel: 'debug',
      destination: 'debug.log.host',
      colorize: true,
    });
    assert.deepEqual(config.get('logging.logLevel'), 'debug');
  });

  describe('getOrFail', () => {
    it('should get the requested value', () => {
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
      const result = config.getOrFail<string>('logging.destination');
      assert.equal(result, 'debug.log.host');
    });

    it('should throw if the requested value is not found', () => {
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
      assert.throws(
        () => config.getOrFail<string>('nonExistent.value'),
        /value not found/
      );
    });
  });

  describe('keys', () => {
    it('should get the top-level keys', () => {
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
      const result = config.keys();
      assert.deepEqual(result, ['logging', 'environment']);
    });

    it('should get nested keys', () => {
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
      const result = config.keys('logging');
      assert.deepEqual(result, ['logLevel', 'colorize', 'destination']);
    });

    it('should return undefined if the path value is not an object', () => {
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
      const result = config.keys('logging.destination');
      assert.deepEqual(result, undefined);
    });
  });

  describe('strongly-typed getters', () => {
    let fixtureDir: string;

    beforeEach(() => {
      fixtureDir = path.resolve(__dirname, 'fixtures', 'typeGetters');
    });

    describe('getString', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        const result = config.getString('examples.string');
        assert.equal(result, 'This is a string.');
      });

      it('should throw if the requested value is not a string', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        assert.throws(() => config.getString('examples.number'), /not a string/);
      });
    });

    describe('getNumber', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        const result = config.getNumber('examples.number');
        assert.equal(result, 42);
      });

      it('should throw if the requested value is not a number', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        assert.throws(() => config.getNumber('examples.string'), /not a number/);
      });
    });

    describe('getBoolean', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        const result = config.getBoolean('examples.boolean');
        assert.equal(result, false);
      });

      it('should throw if the requested value is not a boolean', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        assert.throws(() => config.getBoolean('examples.string'), /not a boolean/);
      });
    });

    describe('getArray', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        const result = config.getArray<string>('examples.array');
        assert.deepEqual(result, ['Nebraska', 'North Dakota', 'Nunavut']);
      });

      it('should throw if the requested value is not an array', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        assert.throws(() => config.getArray('examples.string'), /not an array/);
      });
    });

    describe('getBuffer', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        const result = config.getBuffer('examples.buffer');
        assert.deepEqual(result, Buffer.from('hello world'));
      });

      it('should throw if the requested value is not a Buffer', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        assert.throws(() => config.getBuffer('examples.string'), /not a Buffer/);
      });
    });

    describe('getDate', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        const result = config.getDate('examples.timestamp');
        assert.deepEqual(result, new Date('2001-12-15T02:59:43.1Z'));
      });

      it('should throw if the requested value is not a Date', () => {
        const config = new Config({ dir: fixtureDir, env: process.env.NODE_ENV });
        assert.throws(() => config.getDate('examples.string'), /not a Date/);
      });
    });
  });
});
