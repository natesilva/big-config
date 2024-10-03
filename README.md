# big-config [![npm](https://img.shields.io/npm/v/big-config.svg)](https://www.npmjs.com/package/big-config) [![license](https://img.shields.io/github/license/natesilva/big-config.svg)](https://github.com/natesilva/big-config/blob/master/LICENSE) [![node](https://img.shields.io/node/v/big-config.svg)](https://www.npmjs.com/package/big-config)

> Easily manage configuration settings for small to very large projects

This package provides a simple way to load and manage your project’s configuration files. Settings can be contained in a single file or spread across multiple files—your choice. They can be stored as JSON, [JSON5](https://github.com/json5/json5), JSONC (JSON with comments), YAML, or as environment variables.

This system works well for small projects, as well as huge multi-developer systems that have hundreds of settings spread across dozens of files.

Different environments—such as `development` and `production`—can have their own settings.

A key feature is that settings are **merged** with inherited default settings. This prevents a “combinatorial explosion of config”[¹](https://12factor.net/config), because each environment only needs to define values that differ from the defaults. There’s no need to specify _all_ values for a given config node, just those that deviate from the default configuration.

## Install

```
npm i big-config
```

ℹ️ If you are upgrading from version 2, please see the [release notes](https://github.com/natesilva/big-config/releases/tag/v3.0.0).

## Example

### Config tree structure

```
.
├── package.json
└── config/
    ├── default/
    │  └── database.json   { "port": 3306, "username": "bob" }
    ├── production/
    │  └── database.json   { "host": "db.production" }
    ├── development/
    │  └── database.json   { "host": "db.dev" }
    └── local/
       └── database.json   { "username": "susan", "password": "supersecret123" }
```

In your project’s top-level directory, create a `config` directory. Within that, create a `default` subdirectory, plus one directory for each environment you will use (such as `production`, `staging`, `development`, `test`, etc.).

You can also create a `local` directory with personal settings that will be applied last, overriding or extending any other settings. Typically, the `local` directory is *not* checked into Git. By default, `local` settings are applied, but you can set the `loadLocalConfig` option to `false` if you don’t want them applied. This can be useful if you want to have pre-defined `local` settings that _are_ checked into Git.

Settings from the `default` directory are read first. Then settings from the environment directory (`production` or `development`) are merged in, followed by settings from the `local` directory.

**NODE_ENV**: The selected environment is specified using the `NODE_ENV` environment variable. If `NODE_ENV` is set to `development`, then for the above example, you will end up with the following database settings:

```yaml
{
  'host': 'db.dev', # from config/development/database.json
  'port': 3306, # from config/default/database.json
  'username': 'susan', # from config/local/database.json
  'password': 'supersecret123', # from config/local/database.json
}
```

### Usage in your app

Within your app, usage would look like this:

```javascript
const config = new Config();

// Get an entire config section. The key 'database' comes from the filename 'database.json'.
const db = config.get('database');
// { "host": "db.dev", port: 3306, username: "susan", password: "supersecret123" }

// Or get just one setting using dot notation:
const port = config.get('database.port');
// 3306
```

The library is TypeScript-friendly, offering strongly-typed methods for retrieving settings:

- `getNumber`: Returns a number
- `getString`: Returns a string
- `getBoolean`: Returns a boolean
- `getArray`: Returns an array

These methods throw an `Error` if the setting isn't of the expected type:

```typescript
const port = config.getNumber('database.port');
// Returns the 'port' setting as a number, throws if not a number
```

For YAML configs, which support additional data types, two extra methods are available:

- `getBuffer`: Returns a `Buffer`, useful for binary data
- `getDate`: Returns a `Date` object

### Organizing settings

You’re free to organize settings as you wish. For a small project, you might place all settings in one file, `config/default/settings.json`. Then you would override specific settings for a particular environment. For example, custom settings for `development` would be found in `config/development/settings.json`.

For larger projects, it’s recommended to break up settings into groups. For example, `config/default/db.json` would have database settings and `config/default/logging.json` would have logging settings. If you need to override these settings for production, you would do so in `config/production/db.json` or `config/production/logging.json`.

## How to use it

Your settings tree is built synchronously when you call `new Config()`. You should only call `new Config()` once. You can do this in a module and export it so that other modules in the project can access it:

```typescript
// This is initConfig.js:
const { Config } = require('big-config');
exports.config = new Config();
```

In your other files, import from `./initConfig`:

```javascript
const { config } = require('./initConfig');

// Now you can use it:
console.log(config.get('greetings.Japanese')); // こんにちは世界 perhaps
```

> **Q:** Why is the settings tree built synchronously?
>
> **A:** This ensures that all of your settings are immediately available without having to `await` anything. In large projects, it can be tricky to arrange for a Promise to be resolved at the right time in your startup code, so we avoid that.

### Config file formats

You can mix and match JSON, [JSON5](https://github.com/json5/json5), JSONC (JSON with comments), and YAML.

It’s even okay to mix and match these file types for different environments. For example, if you have a file called `config/default/db.json5`, it’s okay to override it with `config/production/db.yaml`.

It’s _not_ okay to have multiple files with similar names in the _same_ environment. For example, if you had `db.json` and `db.yaml`, both in the `/config/staging` directory, you will get a warning. `big-config` does its best to return deterministic results if this happens, but it can lead to some very confusing situations, so it’s not recommended.

### Using a different directory for your config tree

By default, the `config` directory at the top of your project is used. To specify a different directory, pass it as an option:

```javascript
const config = new Config({ dir: '/some/other/directory' });
```

## Loading from environment variables

You should not store credentials, such as database passwords, in your config files that are checked into Git.

A common practice is to provide these sensitive bits of data to your app as environment variables. `big-config` supports this.

By default, environment variables whose names start with `CONFIG__` (`CONFIG` plus two underscores) are added to your config tree.

For example, if you have the following environment variable:

```shell
CONFIG__db__password=hunter2
```

Then its value will be merged into your configuration:

```javascript
const thePassword = config.get('db.password');
// thePassword is 'hunter2'
```

Environment variables are evaluated last, after all of your other (JSON, JSON5, JSONC, YAML) settings are processed. Therefore, they override any other settings.

### Using a different environment variable name prefix

If you don’t like `CONFIG__` as the environment variable prefix, you can use a different one:

```javascript
const config = new Config({ prefix: 'SETTINGS__' });
```
