import { describe, expect, it } from "vitest";

import type { Package } from "../src/index.js";
import { getRisk } from "../src/risk.js";

describe("getRisk", () => {
  it("returns safe for safe SPDX string", () => {
    expect(getRisk("MIT")).toBe("safe");
    expect(getRisk("ISC")).toBe("safe");
    expect(getRisk("Apache-2.0")).toBe("safe");
    expect(getRisk("BSD-2-Clause")).toBe("safe");
    expect(getRisk("BSD-3-Clause")).toBe("safe");
    expect(getRisk("Unlicense")).toBe("safe");
    expect(getRisk("CC0-1.0")).toBe("safe");
  });

  it("returns warning for warning SPDX string", () => {
    expect(getRisk("LGPL-2.1")).toBe("warning");
    expect(getRisk("LGPL-2.1-only")).toBe("warning");
    expect(getRisk("LGPL-3.0")).toBe("warning");
    expect(getRisk("MPL-2.0")).toBe("warning");
    expect(getRisk("EPL-2.0")).toBe("warning");
  });

  it("returns danger for danger SPDX string", () => {
    expect(getRisk("GPL-2.0")).toBe("danger");
    expect(getRisk("GPL-3.0")).toBe("danger");
    expect(getRisk("GPL-3.0-only")).toBe("danger");
    expect(getRisk("AGPL-3.0")).toBe("danger");
    expect(getRisk("AGPL-3.0-only")).toBe("danger");
    expect(getRisk("SSPL-1.0")).toBe("danger");
  });

  it("supports object license format", () => {
    const typedLicense: Package["license"] = { type: "MIT" };
    expect(getRisk(typedLicense)).toBe("safe");
  });

  it("supports array license format", () => {
    const typedLicense: Package["license"] = ["MIT", "Apache-2.0"];
    expect(getRisk(typedLicense)).toBe("safe");
  });

  it("handles SPDX OR expressions", () => {
    expect(getRisk("(MIT OR Apache-2.0)")).toBe("safe");
    expect(getRisk("(MIT OR GPL-3.0-only)")).toBe("danger");
  });

  it("handles unknown and null licenses", () => {
    expect(getRisk(null)).toBe("unknown");
    expect(getRisk("UNLICENSED")).toBe("unknown");
  });

  it("strips + suffix before classification (MIT+ → safe, GPL-3.0+ → danger)", () => {
    expect(getRisk("MIT+")).toBe("safe");
    expect(getRisk("GPL-3.0+")).toBe("danger");
    expect(getRisk("LGPL-2.1+")).toBe("warning");
  });

  it("strips -OR-LATER suffix before classification", () => {
    expect(getRisk("GPL-3.0-OR-LATER")).toBe("danger");
    expect(getRisk("LGPL-2.1-OR-LATER")).toBe("warning");
  });

  it("supports slash-separated license strings", () => {
    expect(getRisk("MIT/Apache-2.0")).toBe("safe");
    expect(getRisk("GPL-3.0/MIT")).toBe("danger");
  });

  it("supports pipe-separated license strings", () => {
    expect(getRisk("MIT|ISC")).toBe("safe");
    expect(getRisk("GPL-2.0|MIT")).toBe("danger");
  });

  it("supports comma-separated license strings", () => {
    expect(getRisk("MIT, Apache-2.0")).toBe("safe");
    expect(getRisk("GPL-3.0, MIT")).toBe("danger");
  });

  it("supports object license with danger type", () => {
    expect(getRisk({ type: "GPL-3.0" })).toBe("danger");
  });

  it("supports object license with warning type", () => {
    expect(getRisk({ type: "LGPL-3.0" })).toBe("warning");
  });

  it("danger takes priority over safe in array", () => {
    expect(getRisk(["MIT", "GPL-3.0"])).toBe("danger");
  });

  it("warning takes priority over safe in array", () => {
    expect(getRisk(["MIT", "LGPL-2.1"])).toBe("warning");
  });

  it("danger takes priority over warning in array", () => {
    expect(getRisk(["LGPL-3.0", "GPL-2.0"])).toBe("danger");
  });

  it("returns unknown for empty string array", () => {
    expect(getRisk([])).toBe("unknown");
  });

  it("returns unknown for unrecognised license string", () => {
    expect(getRisk("PROPRIETARY")).toBe("unknown");
    expect(getRisk("SEE LICENSE IN LICENSE.md")).toBe("unknown");
  });

  it("handles SPDX AND expressions (both safe → safe)", () => {
    expect(getRisk("MIT AND Apache-2.0")).toBe("safe");
  });
});
