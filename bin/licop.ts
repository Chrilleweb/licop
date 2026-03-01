#!/usr/bin/env node
import ora from "ora";
import { generateReport, printReport } from "../src/reporter.js";
import { scanDependencies } from "../src/scanner.js";

/**
 * Runs the CLI scan process and sets an appropriate process exit code.
 */
async function run(): Promise<void> {
  const spinner = ora("Scanning node_modules for license metadata...").start();

  try {
    const packages = await scanDependencies();
    spinner.succeed(`Scan completed. Found ${packages.length} package(s).`);

    const grouped = generateReport(packages);
    printReport(grouped);

    if (grouped.danger.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    spinner.fail("License scan failed.");
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

void run();
