## 1. Create docs directory and API reference

- [x] 1.1 Create `docs/` directory
- [x] 1.2 Write `docs/api.md` — document Config constructor, all options (`dir`, `loadLocalConfig`, `prefix`), and all public methods (`get`, `getOrFail`, `getString`, `getNumber`, `getBoolean`, `getArray`, `getBuffer`, `getDate`, `keys`) with parameters, return types, and examples

## 2. Create CLI reference

- [x] 2.1 Write `docs/cli.md` — document `big-config` command, subcommands (`env`, `get`, `keys`), and options (`--yaml`, `--json`, `--dir`, `--prefix`, `--no-local`) with examples

## 3. Create configuration and file format guides

- [x] 3.1 Write `docs/configuration.md` — document directory structure (`default`, environment-named, `local`), merge order, `NODE_ENV`, and `loadLocalConfig` option
- [x] 3.2 Write `docs/file-formats.md` — document supported formats (JSON, JSON5, JSONC, YAML), mixing rules across environments, and duplicate-basename warning

## 4. Create environment variables guide

- [x] 4.1 Write `docs/environment-variables.md` — document `CONFIG__` prefix, dot-notation key conversion, `prefix` option, and env var override behavior

## 5. Refactor README

- [x] 5.1 Rewrite `README.md` as concise overview (~50-70 lines) with badges, install, minimal example, and links to all `docs/` files
- [x] 5.2 Verify no information from the original README is lost (all content exists in either README or docs/ files)
