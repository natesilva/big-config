# Environment Variables

You should not store credentials (such as database passwords) in config files that are checked into Git. Instead, provide sensitive data as environment variables.

## Default Behavior

By default, environment variables whose names start with `CONFIG__` (CONFIG plus two underscores) are merged into the config tree. Environment variables are evaluated **last**, after all file-based settings, so they override everything else.

The double underscore `__` in the variable name is converted to a dot-notation key. For example:

```shell
CONFIG__db__password=hunter2
```

This creates the setting at the path `db.password`:

```typescript
const password = config.get("db.password");
// "hunter2"
```

## Nested Values

Multiple `__` separators create nested paths:

```shell
CONFIG__database__primary__host=db.primary.example.com
CONFIG__database__primary__port=5432
```

These produce:

```typescript
config.get("database.primary.host"); // "db.primary.example.com"
config.get("database.primary.port"); // "5432"
```

Note: environment variable values are always strings. If you need a number or other type, convert it in your application code.

## Custom Prefix

If you don't want to use `CONFIG__` as the prefix, set the `prefix` option:

```typescript
const config = new Config({ prefix: "SETTINGS__" });
```

Now only variables starting with `SETTINGS__` will be loaded:

```shell
SETTINGS__db__password=hunter2
```

## Merge Order

Environment variables are the final layer in the merge order:

1. `json` option (constructor)
2. `default/` directory
3. Environment directory (e.g., `production/`)
4. `local/` directory
5. **Environment variables** ← applied last, overrides all

This means environment variables always win, which makes them ideal for secrets that should never be in config files.
