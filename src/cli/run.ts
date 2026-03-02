import ora from "ora";
import type { Command } from "commander";

import { parseOptions } from "../config/options.js";
import type { RawOptions, RiskLevel } from "../config/types.js";
import { formatJsonReport, generateReport, printReport } from "../reporter.js";
import { scanDependencies } from "../scanner.js";

/**
 * The risk level at which the CLI exits with a non-zero code.
 *
 * Typed as {@link RiskLevel} so the compiler rejects any string that is not a
 * valid risk level, avoiding magic-string drift.
 */
const FAIL_RISK_LEVEL: RiskLevel = "danger";

/**
 * Runs the CLI scan process and sets an appropriate process exit code.
 *
 * @param program A parsed Commander instance used to read CLI options.
 * @returns A promise that resolves when the scan is complete.
 */
export async function run(program: Command): Promise<void> {
  program.parse();
  const opts = parseOptions(program.opts<RawOptions>());

  const spinner = ora("Scanning node_modules for license metadata...").start();

  try {
    const packages = await scanDependencies();
    spinner.succeed(`Scan completed. Found ${packages.length} package(s).`);

    const grouped = generateReport(packages);

    if (opts.json) {
      console.log(formatJsonReport(grouped));
    } else {
      printReport(grouped);
    }

    if (grouped[FAIL_RISK_LEVEL].length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    spinner.fail("License scan failed.");
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
