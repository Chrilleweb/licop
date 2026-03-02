import type { RawOptions } from "./types.js";

/**
 * Parses raw CLI options into structured configuration.
 * @param args - The raw CLI options to parse.
 * @returns The parsed and normalized options.
 */
export function parseOptions(args: Partial<RawOptions>): RawOptions {
  const json = toBool(args.json ?? false);
  return {
    json,
  };
}

/**
 * Converts flag value to boolean.
 * @param value - The input value.
 * @returns The boolean representation.
 */
function toBool(value: unknown): boolean {
  return value === true || value === "true";
}
