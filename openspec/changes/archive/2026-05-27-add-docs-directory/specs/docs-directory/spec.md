## ADDED Requirements

### Requirement: docs directory with structured documents
The `docs/` directory SHALL contain the following Markdown files: `api.md`, `cli.md`, `configuration.md`, `file-formats.md`, and `environment-variables.md`.

#### Scenario: docs directory contains all required files
- **WHEN** the `docs/` directory is inspected
- **THEN** it contains `api.md`, `cli.md`, `configuration.md`, `file-formats.md`, and `environment-variables.md`

### Requirement: API reference document
`docs/api.md` SHALL document the `Config` class constructor, all constructor options (`dir`, `loadLocalConfig`, `prefix`), and all public methods (`get`, `getOrFail`, `getString`, `getNumber`, `getBoolean`, `getArray`, `getBuffer`, `getDate`, `keys`) with parameter descriptions, return types, and usage examples.

#### Scenario: API reference covers all public methods
- **WHEN** a user reads `docs/api.md`
- **THEN** they find documentation for every public method on the `Config` class including parameters, return types, and examples

#### Scenario: API reference covers constructor options
- **WHEN** a user reads `docs/api.md`
- **THEN** they find documentation for the `Config` constructor and all its options

### Requirement: CLI reference document
`docs/cli.md` SHALL document the `big-config` CLI command, all subcommands (`env`, `get`, `keys`), and all options (`--yaml`, `--json`, `--dir`, `--prefix`, `--no-local`) with usage examples.

#### Scenario: CLI reference covers all subcommands
- **WHEN** a user reads `docs/cli.md`
- **THEN** they find documentation for the `env`, `get`, and `keys` subcommands with examples

### Requirement: Configuration guide document
`docs/configuration.md` SHALL explain the config directory structure (`default`, environment-named, `local`), the merge order (default → environment → local → env vars), the role of `NODE_ENV`, and the `local` override behavior including the `loadLocalConfig` option.

#### Scenario: Configuration guide explains merge order
- **WHEN** a user reads `docs/configuration.md`
- **THEN** they understand the order in which settings are merged and why

### Requirement: File formats document
`docs/file-formats.md` SHALL list all supported formats (JSON, JSON5, JSONC, YAML), explain the mixing rules (different formats across environments are allowed), and describe the duplicate-basename warning behavior.

#### Scenario: File formats document covers mixing rules
- **WHEN** a user reads `docs/file-formats.md`
- **THEN** they understand which file formats are supported and the rules for mixing them across environments

### Requirement: Environment variables document
`docs/environment-variables.md` SHALL document the default `CONFIG__` prefix, the dot-notation key conversion, the `prefix` constructor option, and the fact that env vars override all file-based settings.

#### Scenario: Environment variables document covers prefix customization
- **WHEN** a user reads `docs/environment-variables.md`
- **THEN** they understand how to customize the environment variable prefix

### Requirement: All existing documentation content is preserved
No information present in the current `README.md` SHALL be lost in the transition. All content SHALL either remain in `README.md` (if appropriate for an overview) or be moved to the corresponding `docs/` file.

#### Scenario: No information loss
- **WHEN** comparing the content of `README.md` plus all `docs/` files against the original `README.md`
- **THEN** every piece of information from the original README is present in at least one of the new files
