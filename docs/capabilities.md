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

- MIT
- ISC
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- Unlicense
- CC0-1.0

### warning

- LGPL-2.1
- LGPL-3.0
- MPL-2.0
- EPL-2.0

### danger

- GPL-2.0
- GPL-3.0
- AGPL-3.0
- SSPL-1.0

### unknown

- Any unrecognized or missing license value.

## CI flags

### `--json`

This will output the table in json format and also include the repository of the package if it exists. 

### `--csv`

This will output the table in csv format and also include the repository of the package if it exists.

## Output and CI Behavior

- Returns exit code `1` when at least one dependency is classified as `danger`,
  regardless of whether `--json` is active.
- Returns exit code `0` when no `danger` dependencies are found.

This makes licop suitable for local checks and CI pipeline enforcement.


