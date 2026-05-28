import { afterEach, beforeEach, describe, it, mock } from 'bun:test';
import { strict as assert } from 'node:assert';
import type { ConfigValue } from '../src';
import loadFromJson from '../src/loadFromJson';

describe('loadFromJson', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    mock.restore();
    mock.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('should load from a given JSON object', () => {
    const fixture: ConfigValue = {
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

    const result = loadFromJson(fixture);
    assert.deepEqual(result, {
      key1: { key2: { key3: 'the value' } },
      settingA: 'the value',
      settingB: { settingC: 'the value' },
    });
  });
});
