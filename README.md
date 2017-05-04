# big-config

This is a configuration loader for Node.js.

## Features

* Break large configuration sets into smaller files.
* Load settings from local `.json` or `.js` files, from Amazon S3, and from environment variables.
* Customize a base configuration for `development` or `production` mode.
* Allow developers to have custom local configurations.

## Basic setup

```typescript
import { config } from '@adpearance-foureyes/big-config';
import * as AWS from 'aws-sdk';

const credentials = new AWS.SharedIniFileCredentials({ profile: 'your-profile' });
AWS.config.credentials = credentials;

config.loadFromFiles();
config.loadFromS3('your-bucket', 'config/');
config.loadFromEnvironment();

const timezone = config.get('app.timezone');
```

### Load from files

To load configuration from local JSON or JavaScript files, in your project’s top-level directory (where `package.json` is located), create a `config` directory. Within that, create a `default` subdirectory, plus one directory for each `NODE_ENV` for which you need to override settings (such as `production` and `development`).

Finally, you can create a `local` directory which contains settings that will always be applied last to override/extend any other settings. You don’t check the `local` directory into Git; each developer can have their own.

```
.
├── package.json
└── config/
    ├── default/
    │── production/
    │── development/
    └── local/
```

Within the `default` directory, create as many JSON files as you want, with settings. For example, you might create a `database.json` file with your database config, and a `redis.json` file with your Redis settings.

If you need different settings when running in `production` or `development` mode, add files to those directories. For example, if you put `database.json` in the `development` subdirectory, those settings will be **merged with** and override any settings from `database.json` in the `default` directory.

In `default/database.json`:

```json
{ "host": "db.local", "port": 3306 }
```

…and in `development/database.json`:

```json
{ "host": "dev.local", "debug": true }
```

In `development` mode, this results in the following configuration:

```json
{ "host": "dev.local", "port": 3306, "debug": true }
```

If you like, you can use JavaScript instead of JSON. Just make sure it exports a
JSON-like object:

```javascript
// in a .js file
module.exports = { "timezone": "Asia/Hong_Kong" };
```

## How to use

```typescript
import { config } from 'big-config';
// or the traditional way:
const config = require('big-config').config;

// get all database settings:
console.log(config.get('database'));

// get just the port (JavaScript):
console.log(config.get('database.port'));

// get just the port (w/optional strong typing in TypeScript):
console.log(config.get<number>('database.port'));
```

Each settings file, such as `database.json` or `redis.json`, is its own namespace. To retrieve its settings use the file’s basename, dot (`.`), the setting you want. If settings are in complex/nested objects, again, use `.` as separator:

```javascript
config.get('database.port');
config.get('redis.port');

config.get('session.cookie.ttl');
// same as:
config.get('session.cookie').ttl;
// same as:
config.get('session').cookie.ttl;
```

That’s pretty much it. The configuration is loaded the first time `big-config` is imported. The configuration is read-only -- it can’t be changed once it’s loaded.

## Environment variables

To override a setting with an environment variable, set a variable starting with `CONFIG__` (that’s `CONFIG` followed by **two** underscores), and the path to the value with two underscores separating each part.

It’s easier to see by example. To set `database.password`:

```bash
export CONFIG__database__password=supersecret123
```

Note that `local` settings override any other settings, including environment variables.

## Other environment variables

Finally, there are two other environment variables that provide additional customization.

* `BIGCONFIG_ROOT` - the path to your configuration directory, if it’s not called `config` or if it’s not located in your project’s top-level directory.
* `BIGCONFIG_ENV_PREFIX` - this defaults to `CONFIG__` but you can set it to something else if you want to name your environment variables with a different prefix.

## Use with S3

As a special case, you can load configurations from Amazon S3. This is meant to be used in a deployment/production scenario.
