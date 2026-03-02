import chalk from 'chalk';
import type {
  GroupedReport,
  Package,
  PackageWithRisk,
} from './config/types.js';
import { getRisk } from './risk.js';

/**
 * Groups scanned packages by computed risk level.
 *
 * @param packages Raw package metadata to evaluate.
 * @returns Grouped report keyed by risk level.
 */
export function generateReport(packages: Package[]): GroupedReport {
  const grouped: GroupedReport = {
    safe: [],
    warning: [],
    danger: [],
    unknown: [],
  };

  for (const pkg of packages) {
    const withRisk: PackageWithRisk = {
      ...pkg,
      risk: getRisk(pkg.license),
    };

    grouped[withRisk.risk].push(withRisk);
  }

  return grouped;
}

/**
 * Serializes the full grouped report to a formatted JSON string.
 *
 * Outputs all four risk groups so callers (e.g. CI scripts) can process the
 * complete result set rather than a human-filtered subset.
 *
 * @param grouped Grouped risk report from {@link generateReport}.
 * @returns Formatted JSON string ready for `console.log`.
 */
export function formatJsonReport(grouped: GroupedReport): string {
  return JSON.stringify(grouped, null, 2);
}

/**
 * Serializes the grouped report to CSV format.
 *
 * The CSV includes all packages sorted alphabetically by name, with columns for
 * package name, version, formatted license, and risk level.
 * @param grouped Grouped risk report from {@link generateReport}.
 * @returns CSV string ready for `console.log` or file output.
 */
export function formatCsvReport(grouped: GroupedReport): string {
  const rows = [
    ...grouped.safe,
    ...grouped.warning,
    ...grouped.danger,
    ...grouped.unknown,
  ].sort((left, right) => left.name.localeCompare(right.name));

  const csvRows = rows.map((pkg) =>
    [
      pkg.name,
      pkg.version,
      formatLicense(pkg.license),
      pkg.repository ?? '',
      pkg.risk,
    ].join(','),
  );

  return ['Package,Version,License,Repository,Risk', ...csvRows].join('\n');
}

/**
 * Prints a color-coded license table report to standard output.
 *
 * The report includes all scanned packages in a compact tabular layout with
 * aligned columns for package name, version, detected license, and risk.
 *
 * @param grouped Grouped risk report.
 */
export function printReport(grouped: GroupedReport): void {
  const rows = [
    ...grouped.safe,
    ...grouped.warning,
    ...grouped.danger,
    ...grouped.unknown,
  ].sort((left, right) => left.name.localeCompare(right.name));

  const packageHeader = 'Package';
  const versionHeader = 'Version';
  const licenseHeader = 'License';
  const riskHeader = 'Risk';

  const packageWidth = Math.max(
    packageHeader.length,
    ...rows.map((pkg) => pkg.name.length),
    12,
  );
  const versionWidth = Math.max(
    versionHeader.length,
    ...rows.map((pkg) => pkg.version.length),
    7,
  );
  const licenseWidth = Math.max(
    licenseHeader.length,
    ...rows.map((pkg) => formatLicense(pkg.license).length),
    14,
  );
  const riskWidth = Math.max(
    riskHeader.length,
    ...rows.map((pkg) => pkg.risk.length),
    7,
  );

  const dividerLength =
    packageWidth + versionWidth + licenseWidth + riskWidth + 9;
  const divider = '─'.repeat(dividerLength);

  console.log(chalk.bold('\nLicense Report'));
  console.log(divider);

  // Special case for no dependencies to avoid printing just headers and divider.
  if (rows.length === 0) {
    console.log(chalk.green('No dependencies detected.'));
    console.log(divider);
    return;
  }

  console.log(
    `${packageHeader.padEnd(packageWidth)}  ${versionHeader.padEnd(versionWidth)}  ${licenseHeader.padEnd(licenseWidth)}  ${riskHeader.padEnd(riskWidth)}`,
  );
  console.log(divider);

  for (const pkg of rows) {
    const riskText = colorRisk(pkg.risk.padEnd(riskWidth), pkg.risk);
    console.log(
      `${pkg.name.padEnd(packageWidth)}  ${pkg.version.padEnd(versionWidth)}  ${formatLicense(pkg.license).padEnd(licenseWidth)}  ${riskText}`,
    );
  }

  console.log(divider);
}

/**
 * Colors the risk label by severity.
 *
 * @param text Display text to colorize.
 * @param risk Risk level used for choosing color.
 * @returns Risk label with terminal color.
 */
function colorRisk(text: string, risk: PackageWithRisk['risk']): string {
  if (risk === 'safe') {
    return chalk.green(text);
  }
  if (risk === 'warning') {
    return chalk.yellow(text);
  }
  if (risk === 'danger') {
    return chalk.red(text);
  }
  return chalk.gray(text);
}

/**
 * Formats mixed-shape license values for human-friendly terminal output.
 *
 * @param license Raw license value.
 * @returns Renderable license string.
 */
function formatLicense(license: Package['license']): string {
  if (license === null) {
    return 'unknown';
  }
  if (typeof license === 'string') {
    return license;
  }
  if (Array.isArray(license)) {
    return license.join(', ');
  }
  return license.type;
}
