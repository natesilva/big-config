# big-config

This is a configuration loader for Node.js.

## Features

* Breaks large configuration sets into smaller files.
* Loads settings from local `.json` or `.js` files, from `.json` files on Amazon S3, and from environment variables.
* Starts with a `default` configuration and adds additional customizations for the current environment, such as `development` or `production`.
* Lets developers have a custom local configuration.

## Basic setup

Initialize your config during your main app startup:

```typescript
import { config } from '@adpearance-foureyes/big-config';
import * as AWS from 'aws-sdk';

// if you are going to use AWS, it’s up to you to set up your credentials first
const credentials = new AWS.SharedIniFileCredentials({ profile: 'your-profile' });
AWS.config.credentials = credentials;

// configs are loaded asynchronously
async function loadConfig() {
  await config.load(new config.Loader.FilesLoader());
  await config.load(new config.Loader.EnvironmentLoader());
  await config.load(new config.Loader.S3Loader('your-bucket', 'your/prefix'));
}

// start using it
loadConfig.then(() => {
  console.log(config.get('app.timezone'));
  // if you’re using TypeScript, you can optionally use this type-safe variant:
  console.log(config.get<string>('app.timezone'));
});
```

From any other file, you can now reference the same config:

```javascript
import { config } from '@adpearance-foureyes/big-config';

// no need to initialize
const dbSettings = config.get('database');
```

Once you have accessed any setting—by calling `config.get()` or `config.getAll()`—the settings become locked/readonly, and no further settings can be loaded. Settings cannot be changed at runtime; this is by design. It ensures that settings are stable and predictable, and it prevents this module from being used as a general “globals” or cache bucket. There are much better solutions for that type of data, including Redis, memoization, etc.

### Loading from files

To load configuration from local JSON or JavaScript files, in your project’s top-level directory (where `package.json` is located), create a `config` directory. Within that, create a `default` subdirectory, plus one directory for each `NODE_ENV` for which you need to override settings (such as `production` and `development`).

Finally, you can create a `local` directory which contains settings that will be applied last to override/extend any other settings. You don’t check the `local` directory into Git; each developer can have their own.

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

If your configuration files are located in some other directory, you can pass in the path:

```javascript
config.load(new config.Loader.FilesLoader('/some/other/directory'));
```

## Loading from Amazon S3

Loading from S3 works very much like loading from files. The main differences are:

* Only `.json` files are supported (no `.js`).
* The `local` folder is not supported.

To load from S3, within a bucket, create a folder for your project’s configuration files. Within that folder, create a `default` folder plus `production`, `development` or any other environment-specific folder you need and place your `.json` files in those folders.

Initialize the loader with your bucket name and prefix. The prefix is the folder name in S3.

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

In this example, the bucket name is `settings-bucket` and the prefix (for an app called “App 1”) is `app1`.

## Loading from environment variables

When loading settings from environment variables, the Node environment (such as 'production' or 'development') is not used. All relevant environment variables are always loaded.

To set or override a setting, set an environment variable with a name starting with `CONFIG__` (that’s `CONFIG` followed by two underscores), plus the path to the value with two underscores separating each part.

It’s easier to see by example. To set `database.password`:

```bash
export CONFIG__database__password=supersecret123
```

If you prefer to use a different name prefix, other than `CONFIG__`, pass it to the loader constructor:

```javascript
config.load(new config.Loader.EnvironmentLoader('MY_VARS__'));
```