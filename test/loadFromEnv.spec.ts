import { strict as assert } from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as td from 'testdouble';
import loadFromEnv from '../src/loadFromEnv';

describe('loadFromEnv', () => {
  afterEach(() => {
    td.reset();
  });

  it('should load from the environment', () => {
    td.replace(process, 'env');
    process.env = { CONFIG__key1__key2__key3: 'the value' };
    const result = loadFromEnv('CONFIG__');
    assert.deepEqual(result, { key1: { key2: { key3: 'the value' } } });
  });

  it('should accept an alternate prefix', () => {
    td.replace(process, 'env');
    process.env = { MyPrefix__key1__key2: 'the value' };
    const result = loadFromEnv('MyPrefix__');
    assert.deepEqual(result, { key1: { key2: 'the value' } });
  });

  it('should ignore non-prefix keys', () => {
    td.replace(process, 'env');
    process.env = { CONFIG__key1__key2: 'the value', OTHER_KEY: 'other value' };
    const result = loadFromEnv('CONFIG__');
    assert.deepEqual(result, { key1: { key2: 'the value' } });
  });

  it('should ignore undefined values', () => {
    td.replace(process, 'env');
    process.env = { CONFIG__key1__key2: undefined };
    const result = loadFromEnv('CONFIG__');
    assert.deepEqual(result, {});
  });
});
