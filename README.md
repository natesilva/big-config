# big-config [![npm](https://img.shields.io/npm/v/big-config.svg)](https://www.npmjs.com/package/big-config) [![dependencies](https://img.shields.io/david/natesilva/big-config.svg)](https://www.npmjs.com/package/big-config) [![license](https://img.shields.io/github/license/natesilva/big-config.svg)](https://github.com/natesilva/big-config/blob/master/LICENSE) [![node](https://img.shields.io/node/v/big-config.svg)](https://www.npmjs.com/package/big-config)

> Node.js configuration loader for big projects

Load JSON, YAML, and JavaScript configuration files. Supports large projects with big configuration sets, and optionally loading configurations from Amazon S3.

## Install

```
npm i big-config
```

## Features

* Breaks large configuration sets into smaller files.
* Loads settings from local `.json`, `.yaml`, or `.js` files. Can also load settings from `.json` files on Amazon S3 or from environment variables.
* Starts with a `default` configuration and adds additional customizations for the current environment, such as `development` or `production`.
    * Without having to put all related configuration into a single huge “production” or “development” file
* Lets developers have a custom local configuration.

## Basic setup

Create an `initConfig.js` that initializes your configuration:

```javascript
// initConfig.js
const Config = require('big-config').Config;
const AWS = require('aws-sdk');

// if you are going to use AWS, it’s up to you to set your credentials first:
const credentials = new AWS.SharedIniFileCredentials({ profile: 'your-profile' });
AWS.config.credentials = credentials;

const config = new Config();

// Load settings from files:
config.load(new config.Loader.FilesLoader());
// You can also load settings from env vars:
config.load(new config.Loader.EnvironmentLoader());
// You can load settings from S3:
config.load(new config.Loader.S3Loader('your-bucket', 'your/prefix'));

module.exports = config;
```

In your other files, import `./initConfig` and use the settings:

```javascript
// app.js
const config = require('./initConfig');

// get the timezone setting from app.yaml or app.json:
console.log(config.get('app.timezone'));
// optional strong typing in TypeScript:
console.log(config.get<string>('app.name'));
```

## Example: Loading from files

In your project’s top-level directory (where `package.json` is located), create a `config` directory. Within that, create a `default` subdirectory, plus one directory for each `NODE_ENV` (such as `production` and `development`).

Finally, you can create a `local` directory with settings that will be applied last, to override/extend any other settings. Don’t check the `local` directory into Git; each developer can have her own.

```
.
├── package.json
└── config/
    ├── default/
    │── production/
    │── development/
    └── local/
```

Within the `default` directory, create as many JSON or YAML files as you want. For example, you might create `database.json` with your database config, and `redis.yaml` with your Redis settings.

If you need different settings in `production` or `development` mode, add files to those directories. You can mix and match JSON, YAML, and JavaScript. For example, if you put `database.yaml` in the `development` subdirectory, those settings will be **merged with** and override any settings from `database.json` in the `default` directory.

In `default/database.json`:

```json
{
    "host": "db.local",
    "port": 3306,
    "credentials": {
        "username": "foo"
    }
}
```

…and in `development/database.yaml`:

```yaml
host: dev.local
debug: true
credentials:
    password: supersecret123
```

In `development` mode, this results in the following configuration:

```json
{
    "host": "dev.local",
    "port": 3306,
    "debug": true,
    "credentials": {
        "username": "foo",
        "password": "supersecret123"
    }
}
```

Then use the settings!

```js
const host = config.get('database.host');
// "dev.local"
const credentials = config.get('database.credentials');
// { "username": "foo", "password": "supersecret123" }
```

If you like, you can use JavaScript instead of JSON. Just make sure it exports a
JSON-like object:

```javascript
// in a .js file
module.exports = { "timezone": "Asia/Hong_Kong" };
```

If your configuration files are located in some other directory, you can pass in the path:

```javascript
config.load(new config.Loader.FilesLoader('/some/other/directory'));
```

## Loading from Amazon S3

Loading from S3 works very much like loading from files. The main differences are:

* Only `.json` files are supported.
* The `local` folder is not supported.

Within a bucket, create a folder for your project’s configuration files. Within that folder, create a `default` folder plus `production`, `development` or any other environment-specific folder you need, and place your `.json` files in those folders.

Initialize the loader with your bucket name and prefix. (The prefix is the folder name in S3.)

```
settings-bucket
├── app1
│   ├── default
│   ├── development
│   └── production
└── app2
    ├── default
    ├── development
    ├── production
    └── staging
```

In this example, we’ve loaded settings for two different apps into an S3 bucket named `settings-bucket`. The prefix for App 1 is `app1`.

## Loading from environment variables

When loading settings from environment variables, the Node environment (such as 'production' or 'development') is ignored.

Set an environment variable with a name starting with `CONFIG__` (that’s `CONFIG` followed by two underscores), plus the path to the value, with two underscores separating each part.

It’s easier to see by example. To set `database.password`:

```bash
export CONFIG__database__password=supersecret123
```

If you prefer to use a different name prefix, other than `CONFIG__`, pass it to the loader constructor:

```javascript
config.load(new config.Loader.EnvironmentLoader('MY_VARS__'));
```

## Dealing with dependency ordering

You should always create an `initConfig` module (as shown in the example at the top of this page) and use that to import `big-config` and load your settings. Your other modules then import `initConfig`—they don’t directly import `big-config`.

To understand why, consider this scenario:

* in `app.js` you import `big-config`
* in `app.js` you import `./routes.js`
    * in `./routes.js` you import `big-config` and immediately try to initialize routes using one of the values from `big-config` (but the configuration hasn’t been loaded yet!)
* in `app.js` you load your configurations

As you can see, `./routes.js` used the config _before_ it had been loaded in the main `app.js` file. To protect you from this, `big-config` will throw an error if it detects it’s being used in this way.

The solution is simple. Create a module to load your settings. We called it `initConfig.js` in the example at the top of the page.

Node modules are idempotent, so this ensures that (a) initialization only happens once and (b) all modules get the config object _after_ it’s been initialized.
