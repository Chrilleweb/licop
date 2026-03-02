# licop Capabilities

`licop` will scan your project's `node_modules` directory for installed dependencies, read their `package.json` files to extract license information, and classify each dependency into one of four risk levels: `safe`, `warning`, `danger`, or `unknown`.

## Example Output

licop prints a clear terminal table like this:

```text
License Report
────────────────────────────────────────────────────────
Package            Version   License         Risk
────────────────────────────────────────────────────────
chalk              5.3.0     MIT             safe
typescript         5.4.2     Apache-2.0      safe
lodash             4.17.21   MIT             safe
────────────────────────────────────────────────────────
```

### with `--json`

```json
{
  "safe": [
    {
      "name": "vitest",
      "version": "4.0.18",
      "license": "MIT",
      "repository": "git+https://github.com/vitest-dev/vitest.git",
      "risk": "safe"
    }
  ],
  "warning": [],
  "danger": [],
  "unknown": []
}
```

## Risk Levels

### safe

Permissive licenses with minimal restrictions.  
Generally safe for commercial and closed-source use.

- MIT
- ISC
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- Unlicense
- CC0-1.0

### warning

Weak copyleft or conditional licenses.  
May impose requirements such as source disclosure of modifications.  
Legal review recommended before production use.

- LGPL-2.1
- LGPL-3.0
- MPL-2.0
- EPL-2.0

### danger

Strong copyleft licenses.  
May require open-sourcing your entire project if you distribute it.

- GPL-2.0
- GPL-3.0
- AGPL-3.0
- SSPL-1.0

### unknown

Licenses that are unrecognized or missing.  
Use caution and consider legal review before use.

- Any unrecognized or missing license value.

## CI flags

### `--json`

This will output the table in json format and also include the repository of the package if it exists. 

### `--csv`

This will output the table in csv format and also include the repository of the package if it exists.

## Programmatic API

The three license classification lists are exported from the package entry point so you can import them directly into your own tooling or scripts:

```ts
import {
  SAFE_LICENSES,
  WARNING_LICENSES,
  DANGER_LICENSES,
} from "licop";
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


