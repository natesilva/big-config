## ADDED Requirements

### Requirement: README is a concise overview with links
`README.md` SHALL be a concise overview (~50-70 lines) containing: project name and badges, one-line description, install instructions, a minimal usage example, and links to each document in `docs/`. It SHALL NOT contain detailed reference content that belongs in `docs/` files.

#### Scenario: README links to all docs
- **WHEN** a user reads `README.md`
- **THEN** they find a link to every file in `docs/` (`api.md`, `cli.md`, `configuration.md`, `file-formats.md`, `environment-variables.md`)

#### Scenario: README does not duplicate detailed content
- **WHEN** a user reads `README.md`
- **THEN** it does not contain full API method documentation, CLI subcommand details, or exhaustive configuration explanations

### Requirement: README retains essential quick-start content
`README.md` SHALL retain the install command, a minimal config tree example, and a basic usage snippet sufficient for a new user to get started, even without following links.

#### Scenario: New user can get started from README alone
- **WHEN** a new user reads only `README.md`
- **THEN** they can install the package and perform a basic `new Config()` + `config.get()` call
