# licop

licop (License Cop) is a TypeScript CLI for scanning dependency licenses and reporting risk across a project's `node_modules`.

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

## CI Behavior

- Exit code `1` when one or more dependencies are classified as `danger`.
- Exit code `0` when no `danger` licenses are detected.

## Documentation

- [Documentation Index](docs/index.md)
- [Capabilities](docs/capabilities.md)

## Tech Stack

- TypeScript (ESM)
- Node.js
- chalk (terminal colors)
- ora (spinner)
- vitest (tests)

## Feedback & contributions

Issues and pull requests are welcome.  
→ See [CONTRIBUTING](CONTRIBUTING.md) for details.

## License

Licensed under the [Apache-2.0](LICENSE) license.

Created by [chrilleweb](https://github.com/chrilleweb)