import { strict as assert } from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as td from 'testdouble';
import { ConfigValue } from '../src';
import loadFromJson from '../src/loadFromJson';

describe('loadFromEnv', () => {
  afterEach(() => {
    td.reset();
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
