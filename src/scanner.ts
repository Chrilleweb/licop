import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Package } from "./config/types.js";

/**
 * Scans the current working directory's `node_modules` and returns package metadata.
 *
 * The scan handles both regular packages and scoped packages (for example
 * `@babel/core`). Dot-folders are skipped. Missing or malformed `package.json`
 * files are ignored to keep the scan resilient.
 *
 * @returns A list of discovered dependency packages with license metadata.
 */
export async function scanDependencies(): Promise<Package[]> {
  const nodeModulesPath = path.join(process.cwd(), "node_modules");
  const packages: Package[] = [];

  let entries: string[];
  try {
    entries = await readdir(nodeModulesPath);
  } catch {
    return [];
  }

  for (const entryName of entries) {
    if (entryName.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(nodeModulesPath, entryName);
    const entryStats = await safeGetStats(entryPath);

    if (!entryStats?.isDirectory()) {
      continue;
    }

    if (entryName.startsWith("@")) {
      const scopedEntries = await safeReadDir(entryPath);
      for (const scopedEntry of scopedEntries) {
        if (scopedEntry.startsWith(".")) {
          continue;
        }

        const packagePath = path.join(entryPath, scopedEntry);
        const packageStats = await safeGetStats(packagePath);
        if (!packageStats?.isDirectory()) {
          continue;
        }

        const pkg = await readPackageManifest(packagePath);
        if (pkg) {
          packages.push(pkg);
        }
      }

      continue;
    }

    const pkg = await readPackageManifest(entryPath);
    if (pkg) {
      packages.push(pkg);
    }
  }

  return packages.sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Safely reads a directory and returns an empty list when it cannot be read.
 *
 * @param dirPath Absolute path of the directory to inspect.
 * @returns Directory entry names or an empty array if unreadable.
 */
async function safeReadDir(dirPath: string): Promise<string[]> {
  try {
    return await readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * Safely gets file stats, resolving symlinks.
 *
 * @param filePath Absolute path to check.
 * @returns File stats or `null` if unreadable.
 */
async function safeGetStats(filePath: string) {
  try {
    return await stat(filePath);
  } catch {
    return null;
  }
}

/**
 * Attempts to read and parse a package manifest from a package directory.
 *
 * @param packageDir Absolute path to a package folder.
 * @returns Package metadata or `null` when missing/invalid.
 */
async function readPackageManifest(
  packageDir: string,
): Promise<Package | null> {
  const manifestPath = path.join(packageDir, "package.json");

  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch {
    return null;
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(data)) {
    return null;
  }

  const manifestName =
    typeof data.name === "string" ? data.name : path.basename(packageDir);
  const version = typeof data.version === "string" ? data.version : "unknown";
  const license = normalizeLicenseField(data);
  const repository = normalizeRepositoryField(data.repository);

  return {
    name: manifestName,
    version,
    license,
    repository,
  };
}

/**
 * Normalizes the package `repository` field to a URL string when possible.
 *
 * @param repositoryRaw Raw repository metadata from a package manifest.
 * @returns Repository URL string or `null`.
 */
function normalizeRepositoryField(repositoryRaw: unknown): string | null {
  if (typeof repositoryRaw === "string") {
    return repositoryRaw;
  }

  if (isRecord(repositoryRaw) && typeof repositoryRaw.url === "string") {
    return repositoryRaw.url;
  }

  return null;
}

/**
 * Normalizes supported package license formats.
 *
 * @param manifest Parsed package manifest data.
 * @returns A supported license value shape or `null`.
 */
function normalizeLicenseField(
  manifest: Record<string, unknown>,
): Package["license"] {
  const licenseRaw = manifest.license;

  if (typeof licenseRaw === "string") {
    return licenseRaw;
  }

  if (Array.isArray(licenseRaw)) {
    const values = licenseRaw.filter(
      (item): item is string => typeof item === "string",
    );
    return values.length > 0 ? values : null;
  }

  if (isRecord(licenseRaw) && typeof licenseRaw.type === "string") {
    return { type: licenseRaw.type };
  }

  const legacyLicenses = manifest.licenses;
  if (Array.isArray(legacyLicenses)) {
    const values = legacyLicenses
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (isRecord(item) && typeof item.type === "string") {
          return item.type;
        }
        return null;
      })
      .filter((item): item is string => item !== null);

    return values.length > 0 ? values : null;
  }

  return null;
}

/**
 * Checks whether a value is a plain object-like record.
 *
 * @param value Value to validate.
 * @returns `true` when value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
