# CLI Flags

### `--json`

Outputs the full license report as structured JSON.

- Includes all risk categories (`safe`, `warning`, `danger`, `unknown`)
- Includes repository information when available
- Suitable for scripting and CI integrations

---

### `--csv`

Outputs the license report in CSV format.

Columns:

- `Package`
- `Version`
- `License`
- `Repository`
- `Risk`

Ideal for compliance reviews, spreadsheets, and audit exports.

---

## Default Output

Without any flags, licop prints a formatted terminal table showing:

- Package name
- Version
- License
- Risk level

---

## Programmatic API

The three license classification lists are exported from the package entry point so you can import them directly into your own tooling or scripts:

```ts
import { SAFE_LICENSES, WARNING_LICENSES, DANGER_LICENSES } from "licop";
```

| Export | Type | Description |
|---|---|---|
| `SAFE_LICENSES` | `string[]` | SPDX identifiers classified as safe (e.g. `"MIT"`, `"Apache-2.0"`) |
| `WARNING_LICENSES` | `string[]` | SPDX identifiers that trigger a warning (e.g. `"LGPL-3.0"`, `"MPL-2.0"`) |
| `DANGER_LICENSES` | `string[]` | SPDX identifiers classified as dangerous (e.g. `"GPL-3.0"`, `"AGPL-3.0"`) |

## Output and CI Behavior

- Returns exit code `1` when at least one dependency is classified as `danger`,
  regardless of whether `--json` is active.
- Returns exit code `0` when no `danger` dependencies are found.

This makes licop suitable for local checks and CI pipeline enforcement.


