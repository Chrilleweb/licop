# CLI flags

### `--json`

This will output the table in json format and also include the repository of the package if it exists. 

### `--csv`

This will output the table in csv format and also include the repository of the package if it exists.

## Programmatic API

The three license classification lists are exported from the package entry point so you can import them directly into your own tooling or scripts:

```ts
export { SAFE_LICENSES, WARNING_LICENSES, DANGER_LICENSES } from "./risk.js";
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


