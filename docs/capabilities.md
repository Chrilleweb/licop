# licop Capabilities

licop is a TypeScript CLI that scans dependencies in `node_modules` and reports license risk.

## What licop Scans

- Reads package metadata from each dependency in the local `node_modules` directory.
- Supports scoped packages, for example `@types/node`.
- Handles `pnpm` symlink-based layouts by resolving package directories safely.
- Skips hidden folders and gracefully ignores missing or malformed `package.json` files.

## License Input Formats

licop supports common license field formats from package manifests:

- SPDX string, for example `MIT`
- SPDX expression, for example `(MIT OR Apache-2.0)`
- Object format, for example `{ "type": "MIT" }`
- Array format, for example `["MIT", "Apache-2.0"]`
- Missing or unknown values

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

## Output and CI Behavior

- Prints a table report with `Package`, `Version`, `License`, and `Risk` columns.
- Uses colorized risk labels in terminal output.
- Pass `--json` to emit the full grouped report as a JSON object to `stdout` instead
  of the table. All four risk groups (`safe`, `warning`, `danger`, `unknown`) are
  included so downstream scripts can filter as needed.
- Returns exit code `1` when at least one dependency is classified as `danger`,
  regardless of whether `--json` is active.
- Returns exit code `0` when no `danger` dependencies are found.

This makes licop suitable for local checks and CI pipeline enforcement.
