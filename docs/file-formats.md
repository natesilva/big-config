# File Formats

big-config supports JSON, JSON5, JSONC, and YAML configuration files. You can mix and match formats freely across environments.

## Supported Formats

| Format | Extensions | Description |
|---|---|---|
| JSON | `.json` | Standard JSON |
| JSON5 | `.json5` | [JSON5](https://github.com/json5/json5) — unquoted keys, trailing commas, comments |
| JSONC | `.jsonc` | JSON with comments |
| YAML | `.yaml`, `.yml` | YAML 1.2 — supports additional types: `Buffer` (`!!binary`), `Date` (`!!timestamp`) |
| JavaScript | `.js` | Deprecated. Requires `enableJs: true`. Uses `require()`, which is eval-like and potentially unsafe |

## Mixing Formats

Different formats can be used for different environments. For example, it is perfectly fine to have `config/default/db.json5` and override it with `config/production/db.yaml`:

```
config/
├── default/
│  └── db.json5        # JSON5 format
├── production/
│  └── db.yaml         # YAML format overrides it
```

The basename (filename without extension) determines the config key, regardless of format. `db.json5` and `db.yaml` both produce the key `db`.

## Duplicate Basenames

Having multiple files with the same basename but different extensions **in the same environment directory** will produce a warning:

```
config/
├── staging/
│  ├── db.json
│  └── db.yaml    # WARNING: duplicate basename "db"
```

big-config does its best to return deterministic results when this happens, but it can lead to confusing behavior. **Avoid duplicate basenames within the same directory.**

## YAML Additional Types

YAML supports data types beyond what JSON offers:

- **`!!binary`** — binary data, returned as a `Buffer`. Access with `getBuffer()`.
- **`!!timestamp`** — date/time values, returned as a `Date`. Access with `getDate()`.

```yaml
# config/default/secrets.yaml
apiToken: !!binary aHVudGVyMg==
expires: !!timestamp 2025-12-31
```

```typescript
const token = config.getBuffer("secrets.apiToken");
const expires = config.getDate("secrets.expires");
```
