# big-config [![npm](https://img.shields.io/npm/v/big-config.svg)](https://www.npmjs.com/package/big-config) [![dependencies](https://img.shields.io/david/natesilva/big-config.svg)](https://www.npmjs.com/package/big-config) [![license](https://img.shields.io/github/license/natesilva/big-config.svg)](https://github.com/natesilva/big-config/blob/master/LICENSE) [![node](https://img.shields.io/node/v/big-config.svg)](https://www.npmjs.com/package/big-config)

> Easily manage configuration settings for small to very large projects

This provides a simple way to load and manage your project’s configuration files. Settings can be contained in a single file or spread across multiple files—your choice. They can be stored as JSON, [JSON5](https://github.com/json5/json5), YAML, or in environment variables.

Different environments—such as `development` and `production`—can have their own settings. Settings are **merged** with inherited default settings, making it possible to support multiple environments with a minimum of duplication.

This system works well for small projects, as well as huge multi-developer systems that have hundreds of settings spread across dozens of files.

## Install

```
npm i big-config@3.0.0-beta.3
```

## Example

### What the config tree looks like

```
.
├── package.json
└── config/
    ├── default/
    │  └── database.json   { "port": 3306, "username": "bob" }
    │── production/
    │  └── database.json   { "host": "db.production" }
    │── development/
    │  └── database.json   { "host": "db.dev" }
    └── local/
       └── database.json   { "username": "susan", "password": "supersecret123" }
```

In your project’s top-level directory, create a `config` directory. Within that, create a `default` subdirectory, plus one directory for each environment that you will use (such as `production`, `staging`, `development`, `test` and so on).

Finally, you can create a `local` directory with personal settings that will be applied last, to override/extend any other settings. Don’t check the `local` directory into Git.

Settings from the `default` directory are read first. Then settings from the environment directory (`production` or `development`) are merged in, followed by settings from the `local` directory.

The selected environment is specified using the `NODE_ENV` environment variable. If `NODE_ENV` is set to `development`, you will end up with the following database settings:

```yaml
{
  'host': 'db.dev', # from config/development/database.json
  'port': 3306, # from config/default/database.json
  'username': 'susan', # from config/local/database.json
  'password': 'supersecret123', # from config/local/database.json
}
```

### Within your app

Within your app this would look like:

```javascript
const config = new Config();

// Get an entire config section. The key 'database' comes from the name of the file,
// `database.json`.
const db = config.get('database');
// { "host": "db.dev", port: 3306, username: "susan", password: "supersecret123" }

// Or get just one setting. Use dot notation to access it:
const port = config.get('database.port');
// 3306
```

### Organizing settings

You’re free to organize settings how you wish. For a small project, you might place all settings in one file, `config/default/settings.json`. Then you would override specific settings for for a particular environment. For example, custom settings for `development` would be found in `config/development/settings.json`.

For larger projects, it’s recommended to break up settings into groups. For example, `config/default/db.json` would have database settings and `config/default/logging.json` would have logging settings. If you need to override these settings for production you would do so in `config/production/db.json` or `config/production/logging.json`.

## How to use it
Your settings tree is built synchronously when you call `new Config()`. You should only call `new Config()` once. You can do this in a module and export it so that other modules in the project can access it:

```typescript
// this is initConfig.js:
const { Config } = require('big-config');
exports.config = new Config();
```

In your other files, import from `./initConfig`:

```javascript
const { config } = require('./initConfig');

// now you can use it:
console.log(config.get('greetings.Japanese')); // こんにちは世界 perhaps
```

> **Q:** Why is the settings tree built synchronously?
>
> **A:** This ensures that all of your settings are immediately available without having to `await` anything. In large projects it can be tricky to arrange for a Promise to be resolved at the right time in your startup code, so we avoid that.

### The config files

You can mix and match JSON, [JSON5](https://github.com/json5/json5), and YAML.

It’s even okay to mix and match these file types for different environments. For example, if you have a file called `config/default/db.json5`, it’s okay to override it with `config/production/db.yaml`.

It’s *not* okay to have multiple files with similar names in the *same* environment. For example, if you had `db.json` and `db.yaml`, both in the `/config/staging` directory, you will get a warning. `big-config` does its best to return deterministic results if this happens, but it can lead to some very confusing situations, so it’s not recommended.

### Using a different directory for your config tree

By default the `config` directory at the top of your project is used. To specify a different directory, pass it as an option:

```javascript
const config = new Config({ dir: '/some/other/directory' });
```

## Loading from environment variables

You should not store credentials, such as database passwords, in your config files that are checked into Git.

A common practice is to provide these sensitive bits of data to your app as environment variables. `big-config` supports this.

By default, environment variables whose names start with `CONFIG__` (`CONFIG` plus two underscores), are added to your config tree.

For example, if you have the following environment variable:

```shell
CONFIG__db_password=hunter2
```

Then its value will be merged into your configuration:

```javascript
const dbPassword = config.get('db.password');
```

Environment variables are evaluated last, after all of your other (JSON, JSON5, YAML) settings are processed. Therefore they override any other settings.

### Using a different environment variable name prefix

If you don’t like `CONFIG__` as the environment variable prefix, you can use a different one:

```javascript
const config = new Config({ prefix: 'SETTINGS__' });
```
