# big-config [![npm](https://img.shields.io/npm/v/big-config.svg)](https://www.npmjs.com/package/big-config) [![license](https://img.shields.io/github/license/natesilva/big-config.svg)](https://github.com/natesilva/big-config/blob/master/LICENSE) [![node](https://img.shields.io/node/v/big-config.svg)](https://www.npmjs.com/package/big-config)

> Easily manage configuration settings for small to very large projects

Load and manage configuration from JSON, JSON5, JSONC, YAML files, and environment variables. Settings are **merged** by environment so each environment only defines values that differ from the defaults.

## Install

```
npm i big-config
```

## Quick Start

Create a `config` directory in your project:

```
config/
├── default/
│  └── database.json   { "port": 3306, "username": "bob" }
├── production/
│  └── database.json   { "host": "db.production" }
├── development/
│  └── database.json   { "host": "db.dev" }
└── local/
   └── database.json   { "username": "susan", "password": "supersecret123" }
```

Use it in your app:

```typescript
import { Config } from "big-config";

const config = new Config();

// Get an entire section
const db = config.get("database");

// Get one value with dot notation
const port = config.getNumber("database.port");
```

Settings are merged in order: `default` → environment directory → `local` → environment variables. Each layer overrides only the values it specifies. See [Configuration](docs/configuration.md) for details.

## Documentation

| Document | Description |
|---|---|
| [API Reference](docs/api.md) | `Config` class constructor, options, and all methods |
| [CLI Reference](docs/cli.md) | `big-config` command, subcommands, and options |
| [Configuration](docs/configuration.md) | Directory structure, merge order, environments |
| [File Formats](docs/file-formats.md) | JSON, JSON5, JSONC, YAML — mixing and rules |
| [Environment Variables](docs/environment-variables.md) | `CONFIG__` prefix, dot-notation keys, custom prefix |

## License

[BSD-3-Clause](LICENSE)
