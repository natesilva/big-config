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

  describe('getOrFail', () => {
    it('should get the requested value', () => {
      td.replace(process, 'env');
      process.env.NODE_ENV = 'development';
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'basic');
      const config = new Config({ dir: fixtureDir });
      const result = config.getOrFail<string>('logging.destination');
      assert.strictEqual(result, 'debug.log.host');
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

  describe('strongly-typed getters', () => {
    let fixtureDir: string;

    before(() => {
      fixtureDir = path.resolve(__dirname, 'fixtures', 'typeGetters');
    });

    describe('getString', () => {
      it('should get the requested value', () => {
        const config = new Config({ dir: fixtureDir });
        const result = config.getString('examples.string');
        assert.strictEqual(result, 'This is a string.');
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
        assert.strictEqual(result, 42);
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
        assert.strictEqual(result, false);
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
        assert.deepStrictEqual(result, ['Nebraska', 'North Dakota', 'Nunavut']);
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
        assert.deepStrictEqual(result, Buffer.from('hello world'));
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
        assert.deepStrictEqual(result, new Date('2001-12-15T02:59:43.1Z'));
      });

      it('should throw if the requested value is not a Date', () => {
        const config = new Config({ dir: fixtureDir });
        assert.throws(() => config.getDate('examples.string'), /not a Date/);
      });
    });
  });
});
