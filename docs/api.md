# API Reference

The `Config` class is the sole export of `big-config`.

```typescript
import { Config } from "big-config";
```

## Constructor

```typescript
new Config(options?: Options)
```

Synchronously builds the entire configuration tree. Call `new Config()` only once, then reuse the instance.

```typescript
const config = new Config();
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `dir` | `string` | `"config"` (relative to project root) | Base directory from which to load configuration files |
| `env` | `string` | `process.env.NODE_ENV` or `"development"` | The environment to use |
| `loadLocalConfig` | `boolean` | `true` | Whether to load config from the `local` directory |
| `prefix` | `string` | `"CONFIG__"` | Prefix for environment variable names that override file-based settings |
| `enableJs` | `boolean` | `false` | Enable loading from `.js` files via `require()`. Deprecated and potentially unsafe |
| `json` | `ConfigValue` | `{}` | JSON configuration to use as the base, merged with files and environment variables |

```typescript
const config = new Config({ dir: "/some/other/directory" });
```

### Errors

The constructor throws an `Error` if `env` is `"default"` or `"local"` (these are reserved directory names, not valid environment names).

## Methods

### `get()`

```typescript
get(): ConfigValue
get<T>(key: string): T | undefined
```

Get the complete settings tree, or a specific setting using a dot-separated path.

- **No argument** — returns a deep copy of the entire settings tree
- **With key** — returns the value at the given path, or `undefined` if not found

```typescript
const db = config.get("database");
// { host: "db.dev", port: 3306, username: "susan", password: "supersecret123" }

const port = config.get("database.port");
// 3306
```

### `getOrFail()`

```typescript
getOrFail<T>(key: string): T
```

Get a specific setting. Throws an `Error` if the key is not found.

```typescript
const port = config.getOrFail("database.port");
// 3306

config.getOrFail("nonexistent.key");
// Error: [big-config] value not found for key nonexistent.key
```

### `getString()`

```typescript
getString(key: string): string
```

Get a setting as a `string`. Throws an `Error` if the key is not found or the value is not a string.

```typescript
const host = config.getString("database.host");
```

### `getNumber()`

```typescript
getNumber(key: string): number
```

Get a setting as a `number`. Throws an `Error` if the key is not found or the value is not a number.

```typescript
const port = config.getNumber("database.port");
```

### `getBoolean()`

```typescript
getBoolean(key: string): boolean
```

Get a setting as a `boolean`. Throws an `Error` if the key is not found or the value is not a boolean.

```typescript
const enabled = config.getBoolean("features.darkMode");
```

### `getArray()`

```typescript
getArray<T>(key: string): T[]
```

Get a setting as an `Array`. Throws an `Error` if the key is not found or the value is not an array.

```typescript
const tags = config.getArray<string>("metadata.tags");
```

### `getBuffer()`

```typescript
getBuffer(key: string): Buffer
```

Get a setting as a `Buffer`. Throws an `Error` if the key is not found or the value is not a `Buffer` or `Uint8Array`. Buffer values are only available when using YAML files with `!!binary` tags.

```typescript
const secret = config.getBuffer("secrets.token");
```

### `getDate()`

```typescript
getDate(key: string): Date
```

Get a setting as a `Date`. Throws an `Error` if the key is not found or the value is not a `Date`. Date values are only available when using YAML files with `!!timestamp` tags.

```typescript
const expires = config.getDate("certificate.expires");
```

### `keys()`

```typescript
keys(): string[]
keys(atKey: string): string[] | undefined
```

Get the top-level key names, or the key names at a specific config path. Returns `undefined` if the path does not exist or the value at that path is not an object.

```typescript
config.keys();
// ["database", "features", "metadata"]

config.keys("database");
// ["host", "port", "username", "password"]
```

## Properties

### `env`

```typescript
readonly env: string
```

The currently-active environment name (e.g., `"development"`, `"production"`).

```typescript
console.log(config.env);
// "development"
```
