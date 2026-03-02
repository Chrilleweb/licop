# licop

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

## Documentation

→ See [Capabilities](docs/capabilities.md) for full documentation.

## Feedback & contributions

Issues and pull requests are welcome.  
→ See [CONTRIBUTING](CONTRIBUTING.md) for details.

## License

Licensed under the [Apache-2.0](LICENSE) license.

Created by [chrilleweb](https://github.com/chrilleweb)
