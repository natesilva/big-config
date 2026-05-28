## Context

big-config is an npm package (v7.0.0) for managing Node.js/TypeScript configuration. All user-facing documentation currently resides in a single 165-line `README.md`. The project has no `docs/` directory. As the project matures, a single README becomes harder to navigate and maintain.

The codebase is TypeScript, built with tsdown, tested with Bun, and linted with Biome. There are no documentation-specific tooling or pipelines in place.

## Goals / Non-Goals

**Goals:**
- Create a `docs/` directory with focused, comprehensive documentation
- Organize content by topic so users can find what they need quickly
- Refactor `README.md` into a concise overview with links into `docs/`
- Preserve all existing documentation content (no information loss)

**Non-Goals:**
- Auto-generated API docs from TypeScript source (e.g., TypeDoc)
- Documentation website or static site generator (e.g., Docusaurus, VitePress)
- Internationalization or multi-language docs
- Search functionality for documentation

## Decisions

### 1. Flat file structure under `docs/`

**Decision**: Use a flat directory with descriptive filenames (e.g., `docs/api.md`, `docs/cli.md`, `docs/configuration.md`) rather than nested subdirectories.

**Rationale**: The project's documentation surface is small enough that a flat structure is navigable. Nested directories add complexity without benefit at this scale.

**Alternatives considered**:
- Nested structure (e.g., `docs/api/`, `docs/guides/`): Overkill for ~6 documents.
- Single-page docs: Defeats the purpose of splitting README content.

### 2. Markdown files, no documentation tooling

**Decision**: Plain Markdown files with no build pipeline, linter, or generator.

**Rationale**: Keeps things simple. Markdown renders natively on GitHub. No additional dependencies or CI steps.

**Alternatives considered**:
- Docusaurus/VitePress: Adds build tooling, deployment, and maintenance overhead.
- MDX: Requires a build step and React knowledge.

### 3. Document inventory

**Decision**: Create the following documents in `docs/`:

| File | Content |
|---|---|
| `docs/api.md` | API reference for the `Config` class (constructor, options, all getter methods) |
| `docs/cli.md` | CLI reference (`big-config` command, subcommands, options) |
| `docs/configuration.md` | Configuration directory structure, merge order, environment directories, `local` override |
| `docs/file-formats.md` | Supported formats (JSON, JSON5, JSONC, YAML), mixing rules, duplicate warnings |
| `docs/environment-variables.md` | Env var loading, prefix customization, merge behavior |

**Rationale**: These map directly to the major sections of the current README, giving each topic room to breathe.

### 4. README becomes overview + links

**Decision**: Shorten README to ~50-70 lines covering: badge, tagline, install, minimal example, and links to each `docs/` file.

**Rationale**: README should get users started quickly and point them to detailed docs. The current 165-line README mixes overview with reference material.

## Risks / Trade-offs

- **[Risk] Content drift between README and docs** → README will link rather than duplicate; detailed content lives only in `docs/`
- **[Risk] Broken links if docs are moved** → Use relative links from README; keep flat structure to minimize moves
- **[Trade-off] More files to maintain** → Acceptable because each file is focused and shorter than a monolithic README
