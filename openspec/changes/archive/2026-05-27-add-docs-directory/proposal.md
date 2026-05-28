## Why

The project has no dedicated `docs/` directory. All user-facing documentation lives in a single `README.md`, which is becoming a bottleneck as the project grows. A structured `docs/` directory will improve discoverability, maintainability, and onboarding for new users.

## What Changes

- Create a `docs/` directory with structured, comprehensive documentation
- Split `README.md` content into focused documents (API reference, CLI guide, configuration guide, file formats, etc.)
- Update `README.md` to serve as a concise overview with links into `docs/`
- Add an API reference covering all public methods on the `Config` class
- Add a CLI reference documenting all subcommands and options
- Add a configuration guide explaining directory structure, merge order, and environment variables

## Capabilities

### New Capabilities
- `docs-directory`: Structure, content, and organization of the `docs/` directory and its documents
- `readme-refactor`: Refactoring README.md to be a concise entry point linking to detailed docs

### Modified Capabilities

## Impact

- `README.md` will be shortened and restructured (content moves to `docs/`)
- New files added under `docs/`
- No code changes, no API changes, no dependency changes
