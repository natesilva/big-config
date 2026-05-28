# CLI Reference

big-config includes a command-line tool for inspecting your configuration from the terminal.

```shell
npx big-config <command> [options]
```

## Global Options

| Option | Short | Default | Description |
|---|---|---|---|
| `--dir <path>` | `-d` | `"config"` (relative to project root) | Base directory from which to load configurations |
| `--prefix <prefix>` | `-p` | `"CONFIG__"` | Prefix for environment variable names |
| `--env <environment>` | `-e` | `NODE_ENV` or `"development"` | The environment to use |
| `--skip-local` | | `false` | Skip loading values from `config/local` |
| `--enable-js` | | `false` | Enable loading from JavaScript files (potentially unsafe) |
| `--yaml` | `-y` | `false` | Output in YAML format |
| `--json` | `-j` | `false` | Output in JSON format |
| `--version` | | | Print the version number |
| `--help` | | | Print help text |

## Commands

### `env`

Print the environment that will be used by the config system.

```shell
npx big-config env
# development

NODE_ENV=production npx big-config env
# production
```

### `get [dottedPath]`

Get the value at the given dot-notation path, or the entire config tree if no path is supplied.

```shell
# Print the entire config tree
npx big-config get

# Get a specific value
npx big-config get database.port
# 3306

# Output as JSON
npx big-config get database --json

# Output as YAML
npx big-config get database --yaml
```

When neither `--yaml` nor `--json` is specified, the output includes metadata header lines (config root, environment, key path, etc.) followed by the value.

### `keys [dottedPath]`

Get the key names at the given dot-notation path, or the top-level keys if no path is supplied.

```shell
# Top-level keys
npx big-config keys
# ["database", "logging", "features"]

# Keys within a section
npx big-config keys database
# ["host", "port", "username", "password"]

# Output as JSON
npx big-config keys database --json
```

If the path does not exist or the value is not an object, the command prints an error and exits with code 1.
