import { afterEach, beforeEach, describe, it, mock } from 'bun:test';
import { strict as assert } from 'node:assert';
import loadFromEnv from '../src/loadFromEnv';

describe('loadFromEnv', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
    mock.restore();
    mock.clearAllMocks();
  });

  it('should load from the environment', () => {
    process.env = { CONFIG__key1__key2__key3: 'the value' };
    const result = loadFromEnv('CONFIG__');
    assert.deepEqual(result, { key1: { key2: { key3: 'the value' } } });
  });

  it('should accept an alternate prefix', () => {
    process.env = { MyPrefix__key1__key2: 'the value' };
    const result = loadFromEnv('MyPrefix__');
    assert.deepEqual(result, { key1: { key2: 'the value' } });
  });

  it('should ignore non-prefix keys', () => {
    process.env = { CONFIG__key1__key2: 'the value', OTHER_KEY: 'other value' };
    const result = loadFromEnv('CONFIG__');
    assert.deepEqual(result, { key1: { key2: 'the value' } });
  });

  it('should ignore undefined values', () => {
    process.env = { CONFIG__key1__key2: undefined };
    const result = loadFromEnv('CONFIG__');
    assert.deepEqual(result, {});
  });
});
