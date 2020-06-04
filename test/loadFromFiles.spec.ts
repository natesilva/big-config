import * as assert from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as path from 'path';
import * as td from 'testdouble';
import loadFromFiles from '../src/loadFromFiles';

describe('loadFromFiles', () => {
  afterEach(() => {
    td.reset();
  });

  describe('file types', () => {
    it('should load from a directory with a single JSON file', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'fileTypes', 'json');
      const config = loadFromFiles(fixtureDir);
      assert.deepStrictEqual(config, {
        db: {
          fileType: 'json',
          host: 'the db host',
          username: 'the db username',
          port: 3306,
        },
      });
    });

    it('should load from a directory with a single JSON5 file', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'fileTypes', 'json5');
      const config = loadFromFiles(fixtureDir);
      assert.deepStrictEqual(config, {
        db: {
          fileType: 'json5',
          host: 'the db host',
          username: 'the db username',
          port: 3306,
        },
      });
    });

    it('should load from a directory with a single YAML file with a .yaml extension', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'fileTypes', 'yaml');
      const config = loadFromFiles(fixtureDir);
      assert.deepStrictEqual(config, {
        db: {
          fileType: 'yaml',
          host: 'the db host',
          username: 'the db username',
          port: 3306,
        },
      });
    });

    it('should load from a directory with a single YAML file with a .yml extension', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'fileTypes', 'yml');
      const config = loadFromFiles(fixtureDir);
      assert.deepStrictEqual(config, {
        db: {
          fileType: 'yml',
          host: 'the db host',
          username: 'the db username',
          port: 3306,
        },
      });
    });
  });

  describe('specifying a directory', () => {
    it('should return an empty object if a non-existent directory is specified', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'does-not-exist');
      const config = loadFromFiles(fixtureDir);
      assert.deepStrictEqual(config, {});
    });

    it('should throw if a file is specified instead of a directory', () => {
      const fixtureDir = path.resolve(
        __dirname,
        'fixtures',
        'fileTypes',
        'json',
        'db.json'
      );
      assert.throws(() => loadFromFiles(fixtureDir), /not a directory/);
    });
  });

  describe('duplicate configurations', () => {
    it('should warn if duplicate configuration basenames are found', () => {
      td.replace(console, 'warn');
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'duplicates');
      loadFromFiles(fixtureDir);
      td.verify(
        console.warn(
          td.matchers.contains('not recommended'),
          td.matchers.contains({ dir: fixtureDir })
        )
      );
    });
  });

  describe('legacy JavaScript support', () => {
    it('should load from a directory with a single legacy .js file', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'fileTypes', 'js');
      const config = loadFromFiles(fixtureDir, true);
      assert.deepStrictEqual(config, {
        db: {
          fileType: 'js',
          host: 'the db host',
          username: 'the db username',
          port: 3306,
        },
      });
    });

    it('should ignore .js files if enableJs is false', () => {
      const fixtureDir = path.resolve(__dirname, 'fixtures', 'fileTypes', 'js');
      const config = loadFromFiles(fixtureDir, false); // ← ← ← this is set to false
      assert.deepStrictEqual(config, {});
    });
  });
});
