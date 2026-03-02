import { Command } from 'commander';

/**
 * Creates the command-line program for licop.
 * @returns The configured commander program instance
 */
export function createProgram() {
  return new Command()
    .name('licop')
    .description('License Cop — scan your npm dependencies for risky licenses')
    .option('--json', 'Output report as JSON')
    .option('--csv', 'Output report as CSV');
}
