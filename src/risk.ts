import type { Package, RiskLevel } from "./config/types.js";

const SAFE_LICENSES = [
  "MIT",
  "ISC",
  "APACHE-2.0",
  "BSD-2-CLAUSE",
  "BSD-3-CLAUSE",
  "UNLICENSE",
  "CC0-1.0",
];

const WARNING_LICENSES = ["LGPL-2.1", "LGPL-3.0", "MPL-2.0", "EPL-2.0"];

const DANGER_LICENSES = ["GPL-2.0", "GPL-3.0", "AGPL-3.0", "SSPL-1.0"];

/**
 * Computes a risk level from package license metadata.
 *
 * Supports license values as:
 * - SPDX strings (`MIT`)
 * - SPDX expressions (`(MIT OR Apache-2.0)`)
 * - object format (`{ type: "MIT" }`)
 * - string arrays
 * - `null`
 *
 * Risk priority follows a conservative policy: any dangerous signal results in
 * `danger`, otherwise `warning`, then `safe`, and finally `unknown`.
 *
 * @param license License metadata from a package manifest.
 * @returns The inferred risk level.
 */
export function getRisk(license: Package["license"]): RiskLevel {
  const tokens = normalizeLicenseTokens(license);

  if (tokens.length === 0) {
    return "unknown";
  }

  let hasSafe = false;
  let hasWarning = false;

  for (const token of tokens) {
    const risk = classifyToken(token);
    if (risk === "danger") {
      return "danger";
    }
    if (risk === "warning") {
      hasWarning = true;
      continue;
    }
    if (risk === "safe") {
      hasSafe = true;
    }
  }

  if (hasWarning) {
    return "warning";
  }

  if (hasSafe) {
    return "safe";
  }

  return "unknown";
}

/**
 * Converts any supported license input into normalized SPDX-like tokens.
 *
 * @param license Raw license metadata.
 * @returns Uppercase SPDX-like tokens without operators.
 */
function normalizeLicenseTokens(license: Package["license"]): string[] {
  if (license === null) {
    return [];
  }

  const rawValues: string[] = [];

  if (typeof license === "string") {
    rawValues.push(license);
  } else if (Array.isArray(license)) {
    for (const entry of license) {
      if (typeof entry === "string") {
        rawValues.push(entry);
      }
    }
  } else if (typeof license === "object" && typeof license.type === "string") {
    rawValues.push(license.type);
  }

  const tokens: string[] = [];
  for (const value of rawValues) {
    const normalized = value
      .replace(/[()]/g, " ")
      .replace(/\s+(OR|AND|WITH)\s+/gi, " ")
      .replace(/[|/,&+]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    for (const token of normalized) {
      tokens.push(token.toUpperCase());
    }
  }

  return tokens;
}

/**
 * Classifies a single license token to a risk level.
 *
 * @param token Normalized uppercase license token.
 * @returns Risk category for the token.
 */
function classifyToken(token: string): RiskLevel {
  const normalized = normalizeLicenseIdentifier(token);

  if (matchesAny(normalized, DANGER_LICENSES)) {
    return "danger";
  }

  if (matchesAny(normalized, WARNING_LICENSES)) {
    return "warning";
  }

  if (matchesAny(normalized, SAFE_LICENSES)) {
    return "safe";
  }

  return "unknown";
}

/**
 * Normalizes SPDX identifiers so common suffix variants can be matched.
 *
 * @param identifier Raw SPDX-like identifier.
 * @returns Canonical uppercase SPDX identifier.
 */
function normalizeLicenseIdentifier(identifier: string): string {
  return identifier
    .toUpperCase()
    .replace(/\+$/, "")
    .replace(/-(ONLY|OR-LATER)$/, "");
}

/**
 * Checks whether a normalized license identifier matches any known base SPDX id.
 *
 * @param value Canonical license identifier.
 * @param knownLicenses Known SPDX identifiers for one risk category.
 * @returns `true` when `value` belongs to the category.
 */
function matchesAny(value: string, knownLicenses: readonly string[]): boolean {
  return knownLicenses.some(
    (license) => value === license || value.startsWith(`${license}-`),
  );
}
