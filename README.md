# big-config [![npm](https://img.shields.io/npm/v/big-config.svg)](https://www.npmjs.com/package/big-config) [![dependencies](https://img.shields.io/david/natesilva/big-config.svg)](https://www.npmjs.com/package/big-config) [![license](https://img.shields.io/github/license/natesilva/big-config.svg)](https://github.com/natesilva/big-config/blob/master/LICENSE) [![node](https://img.shields.io/node/v/big-config.svg)](https://www.npmjs.com/package/big-config)

> Node.js configuration loader for big projects

Loads JSON, YAML, and JavaScript configuration files. Supports large projects with big configuration sets. Settings can also be loaded from S3 or from environment variables.

## Install

```
npm i big-config
```

## How it works

### Example

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

In your project’s top-level directory (where `package.json` is located), create a `config` directory. Within that, create a `default` subdirectory, plus one directory for each `NODE_ENV` (such as `production` and `development`).

Finally, you can create a `local` directory with personal settings that will be applied last, to override/extend any other settings. Don’t check the `local` directory into Git.

Settings from the `default` directory are read first. Then settings from the environment directory (`production` or `development`) are merged in, followed by settings from the `local` directory.

If `NODE_ENV` is `development`, you end up with the following database settings:

```json
{
    "host": "db.dev",
    "port": 3306,
    "username": "susan",
    "password": "supersecret123"
}
```

### Code

Create an `initConfig.js` that initializes your configuration and exports the Config object:

```javascript
// this is initConfig.js
const { Config, Loaders } = require('big-config');
module.exprts = Config.create(new Loaders.FilesLoader());
```

In your other files, import `./initConfig` and use the settings:

```javascript
const config = require('./initConfig');
const db = config.get('database');
// { "host": "db.dev", port: 3306, username: "bob", password: "supersecret123" }
const port = config.get('database.port');
// 3306
```

### The config files

You can mix and match JSON, YAML, and JavaScript.

If you use JavaScript, export a JSON-like object:

```javascript
module.exports = { "timezone": "Asia/Hong_Kong" };
```

### Using a different directory for your config tree

```javascript
Config.create(new Loaders.FilesLoader('/some/other/directory'));
```

## Loading from Amazon S3

Loading from S3 is similar to loading from files. The main differences are:

* Only `.json` files are supported.
* The `local` folder is not supported.

Initialize the loader with your bucket name and prefix. (The prefix is the folder name in S3.)

```
settings-bucket
└── app1
    ├── default
    ├── development
    └── production
```

In this example, we’ve loaded settings into an S3 bucket named `settings-bucket`. The prefix is `app1`.

### Init with S3

```javascript
// this is initConfig.js
const { Config, Loaders } = require('big-config');
const AWS = require('aws-sdk');

// set your credentials:
const credentials = new AWS.SharedIniFileCredentials({ profile: 'your-profile' });
AWS.config.credentials = credentials;

module.exports = Config.create([
  config.load(new Loaders.FilesLoader()),  // optional: load settings from files first
  config.load(new Loaders.S3Loader('your-bucket', 'your/prefix'))
]);
```

## Loading from environment variables

When loading settings from environment variables, the Node environment, such as `production` or `development` is ignored. Environment variables are useful when most of your settings are loaded from standard JSON/YAML files, but you use environment variables to augment or override a few settings. This can be used to provide passwords or other data that you don’t want to commit to a file in your Git repository.

Set an environment variable with a name starting with `CONFIG__` (that’s `CONFIG` followed by two underscores), plus the path to the value, with two underscores separating each part.

It’s easier to see by example. To set `database.password`:

```bash
export CONFIG__database__password=supersecret123
```

### Init with environment variables

```javascript
// this is initConfig.js
const { Config, Loaders } = require('big-config');
module.exports = Config.create([
  new Loaders.FilesLoader(),  // Load settings from files
  new Loaders.EnvironmentLoader()  // then from env vars
]);
```

### Using a different environment variable name prefix

```javascript
new Loaders.EnvironmentLoader('MY_CONFIG__'));
```
