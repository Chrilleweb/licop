import { describe, expect, it } from "vitest";

import { parseOptions } from "../src/config/options.js";

describe("parseOptions", () => {
  it("defaults json to false when no options are provided", () => {
    const opts = parseOptions({});
    expect(opts.json).toBe(false);
  });

  it("passes through json: true", () => {
    const opts = parseOptions({ json: true });
    expect(opts.json).toBe(true);
  });

  it("passes through json: false", () => {
    const opts = parseOptions({ json: false });
    expect(opts.json).toBe(false);
  });

  it('coerces the string "true" to boolean true', () => {
    // Commander may produce strings in edge cases; toBool must handle this.
    const opts = parseOptions({ json: "true" as unknown as boolean });
    expect(opts.json).toBe(true);
  });

  it('coerces a non-"true" string to boolean false', () => {
    const opts = parseOptions({ json: "yes" as unknown as boolean });
    expect(opts.json).toBe(false);
  });
});
