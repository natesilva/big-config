# Configuration

big-config loads settings from a directory tree, merges them by environment, and applies environment variable overrides.

## Directory Structure

In your project's top-level directory, create a `config` directory:

```
config/
├── default/
│  └── database.json
├── production/
│  └── database.json
├── development/
│  └── database.json
└── local/
   └── database.json
```

### `default/`

Settings that apply to all environments. This is the base layer.

### Environment directories

One directory per environment, named to match the `NODE_ENV` value (e.g., `production`, `development`, `staging`, `test`). Settings here override the defaults for that environment.

### `local/`

Personal settings applied last, overriding everything else. The `local` directory is typically **not** checked into Git. This is where developers put credentials and machine-specific values.

You can disable loading from `local` by setting the `loadLocalConfig` option to `false`:

```typescript
const config = new Config({ loadLocalConfig: false });
```

This is useful if you want pre-defined `local` settings that _are_ checked into Git.

## Merge Order

Settings are merged in this order:

1. **`json` option** — if you pass a `json` option to the constructor
2. **`default/`** — the base settings
3. **Environment directory** — settings for the current `NODE_ENV`
4. **`local/`** — personal overrides (if `loadLocalConfig` is `true`)
5. **Environment variables** — any matching `CONFIG__*` variables

Each layer is deep-merged with [lodash `merge`](https://lodash.com/docs/4.17.15#merge), so nested objects are combined rather than replaced. Later layers override earlier ones for any conflicting keys.

### Example

With `NODE_ENV=development`:

```json
// config/default/database.json
{ "port": 3306, "username": "bob" }

// config/development/database.json
{ "host": "db.dev" }

// config/local/database.json
{ "username": "susan", "password": "supersecret123" }
```

Result:

```json
{
  "host": "db.dev",
  "port": 3306,
  "username": "susan",
  "password": "supersecret123"
}
```

## NODE_ENV

The selected environment is determined by the `NODE_ENV` environment variable. If `NODE_ENV` is not set, it defaults to `"development"`.

You can also set the environment explicitly via the constructor:

```typescript
const config = new Config({ env: "production" });
```

`"default"` and `"local"` are not valid environment names — they are reserved for directory names.

## Custom Config Directory

By default, big-config looks for a `config` directory at the top of your project. To use a different directory:

```typescript
const config = new Config({ dir: "/some/other/directory" });
```

## Organizing Settings

You're free to organize settings as you wish:

- **Small projects** — put all settings in one file: `config/default/settings.json`
- **Large projects** — break settings into groups: `config/default/db.json`, `config/default/logging.json`, etc.

Each file's basename (without extension) becomes the top-level key in the merged config tree. For example, `database.json` produces the key `database`.

## Synchronous Loading

The settings tree is built synchronously when you call `new Config()`. This ensures all settings are immediately available without `await`. You should only call `new Config()` once — create it in a module and export it:

```typescript
// initConfig.ts
import { Config } from "big-config";
export const config = new Config();
```

```typescript
// otherFile.ts
import { config } from "./initConfig";
console.log(config.get("database.port"));
```
