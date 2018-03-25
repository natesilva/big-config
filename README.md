# big-config [![npm](https://img.shields.io/npm/v/big-config.svg)](https://www.npmjs.com/package/big-config) [![dependencies](https://img.shields.io/david/natesilva/big-config.svg)](https://www.npmjs.com/package/big-config) [![license](https://img.shields.io/github/license/natesilva/big-config.svg)](https://github.com/natesilva/big-config/blob/master/LICENSE) [![node](https://img.shields.io/node/v/big-config.svg)](https://www.npmjs.com/package/big-config)

> Node.js configuration loader for big projects

Loads JSON, YAML, and JavaScript configuration files. Supports large projects with big configuration sets, in a way that you can easily manage.

## Install

```
npm i big-config
```

## Features

`big-config` solves problems that are common in large projects shared among several programmers:

* Big projects have lots of configuration. Huge configuration files are hard to manage.
    * Solution: `big-config` breaks your configuration into a set of smaller files. Divide your settings however you like.
* It’s hard to keep multiple configurations in sync for production, development, and staging.
    * Solution: `big-config` starts with a `default` configuration set and adds additional sets for the current environment, such as `development` or `production`. Settings are **merged** so that common defaults do not need to be duplicated.
* Developers need a safe way to override settings on their local system.
    * Solution: `big-config` gives developers a local configuration set that overrides existing settings. Local settings are not checked into Git, they can persist, and there is no risk of accidentally checking them into the project.

## How it works

```
.
├── package.json
└── config/
    ├── default/
    │── production/
    │── development/
    └── local/
```

In your project’s top-level directory (where `package.json` is located), create a `config` directory. Within that, create a `default` subdirectory, plus one for each `NODE_ENV` (such as `production` and `development`).

Finally, you can create a `local` directory with personal settings that will be applied last, to override/extend any other settings. Don’t check the `local` directory into Git.

### The config files

Start by creating your `default` configuration set. You can mix and match JSON, YAML, and JavaScript. For example, you might create `database.json` with your database settings, or `redis.yaml` with your Redis settings.

If you need different settings in `production` or `development` mode, add files to those directories. For example, if you put `database.json` in the `production` directory, those settings will be used in production (when `NODE_ENV` is set to `production`). The settings are **merged with** and override any settings from `database.json` in the `default` directory.

### Initialize

Create an `initConfig.js` that initializes your configuration:

```javascript
// initConfig.js
const Config = require('big-config').Config;

const config = new Config();

config.load(new config.Loader.FilesLoader());  // Load settings from files
// you can also load from env vars and from S3 (see below)

module.exports = config;
```

In your other files, import `./initConfig` and use the settings:

```javascript
const config = require('./initConfig');

// gets the timezone setting from app.yaml or app.json:
console.log(config.get('app.timezone'));
// optional strong typing in TypeScript:
console.log(config.get<string>('app.name'));
```

### Example

Config file `default/database.json`:

```json
{
    "host": "db.local",
    "port": 3306,
    "credentials": {
        "username": "foo"
    }
}
```

…and `development/database.yaml`:

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

Then use the settings:

```js
const host = config.get('database.host');
// "dev.local"
const credentials = config.get('database.credentials');
// { "username": "foo", "password": "supersecret123" }
```

### Using JavaScript instead of JSON/YAML

You can use JavaScript instead of JSON or YAML. Just make sure it exports a
JSON-like object:

```javascript
// in a .js file
module.exports = { "timezone": "Asia/Hong_Kong" };
```

### Using a different directory for your config tree

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

### Init with S3

```javascript
// initConfig.js
const Config = require('big-config').Config;
const AWS = require('aws-sdk');

// set your credentials first:
const credentials = new AWS.SharedIniFileCredentials({ profile: 'your-profile' });
AWS.config.credentials = credentials;

// init your config
const config = new Config();
config.load(new config.Loader.FilesLoader());  // optional: load settings from files first
config.load(new config.Loader.S3Loader('your-bucket', 'your/prefix'));

module.exports = config;
```


## Loading from environment variables

When loading settings from environment variables, the Node environment, such as `production` or `development` is ignored. Therefore environment variables are useful mainly to override existing settings.

You can load from both local files and from environment variables. The local files work as described above, and then the environment variables override those settings. This works in environments like Heroku and AWS Lambda, where settings like passwords can be passed in an environment variable.

Set an environment variable with a name starting with `CONFIG__` (that’s `CONFIG` followed by two underscores), plus the path to the value, with two underscores separating each part.

It’s easier to see by example. To set `database.password`:

```bash
export CONFIG__database__password=supersecret123
```

### Init with environment variables

```javascript
// initConfig.js
const Config = require('big-config').Config;

const config = new Config();

config.load(new config.Loader.FilesLoader());  // Load settings from files
config.load(new config.Loader.EnvironmentLoader());  // Then from env vars

module.exports = config;
```

### Using a different environment variable prefix

If you prefer to use a different name prefix, other than `CONFIG__`, pass it to the loader constructor:

```javascript
config.load(new config.Loader.EnvironmentLoader('MY_VARS__'));
```
