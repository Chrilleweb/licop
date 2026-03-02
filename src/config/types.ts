/**
 * Represents the computed license risk for a dependency package.
 */
export type RiskLevel = 'safe' | 'warning' | 'danger' | 'unknown';

/**
 * Configuration and type definitions for the license risk analysis tool.
 */
export interface RawOptions {
  json: boolean;
  csv: boolean;
}

/**
 * Represents the subset of package metadata needed for license risk analysis.
 */
export interface Package {
  /**
   * Full package name, including scope when present.
   */
  name: string;

  /**
   * Package version as declared in the package manifest.
   */
  version: string;

  /**
   * License value from package metadata.
   *
   * Supports common forms used in package manifests:
   * - SPDX string (`"MIT"`)
   * - SPDX expression (`"(MIT OR Apache-2.0)"`)
   * - String arrays
   * - Object form (`{ type: "MIT" }`)
   * - `null` when missing or unreadable
   */
  license: string | string[] | { type: string } | null;

  /**
   * Repository URL when available; otherwise `null`.
   */
  repository: string | null;
}

/**
 * A dependency package enriched with its computed risk level.
 */
export interface PackageWithRisk extends Package {
  /**
   * Risk level derived from the package license metadata.
   */
  risk: RiskLevel;
}

/**
 * Grouped scan output by risk category.
 */
export type GroupedReport = Record<RiskLevel, PackageWithRisk[]>;
