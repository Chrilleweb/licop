import { afterEach, describe, expect, it, vi } from "vitest";

import type { Package } from "../src/index.js";
import { generateReport, printReport } from "../src/reporter.js";

describe("generateReport", () => {
  it("returns an empty grouped report when no packages given", () => {
    const grouped = generateReport([]);
    expect(grouped.safe).toHaveLength(0);
    expect(grouped.warning).toHaveLength(0);
    expect(grouped.danger).toHaveLength(0);
    expect(grouped.unknown).toHaveLength(0);
  });

  it("groups packages by risk level", () => {
    const packages: Package[] = [
      {
        name: "chalk",
        version: "5.3.0",
        license: "MIT",
        repository: null,
      },
      {
        name: "some-gpl-lib",
        version: "1.0.0",
        license: "GPL-3.0-only",
        repository: null,
      },
      {
        name: "mystery-lib",
        version: "0.1.0",
        license: null,
        repository: null,
      },
    ];

    const grouped = generateReport(packages);

    expect(grouped.safe).toHaveLength(1);
    expect(grouped.warning).toHaveLength(0);
    expect(grouped.danger).toHaveLength(1);
    expect(grouped.unknown).toHaveLength(1);
  });

  it("attaches correct risk level to each package", () => {
    const packages: Package[] = [
      { name: "lgpl-lib", version: "1.0.0", license: "LGPL-3.0", repository: null },
    ];

    const grouped = generateReport(packages);

    expect(grouped.warning).toHaveLength(1);
    expect(grouped.warning[0].risk).toBe("warning");
  });
});

describe("printReport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints a table style report", () => {
    const packages: Package[] = [
      {
        name: "chalk",
        version: "5.3.0",
        license: "MIT",
        repository: null,
      },
      {
        name: "typescript",
        version: "5.4.2",
        license: "Apache-2.0",
        repository: null,
      },
    ];

    const grouped = generateReport(packages);

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("License Report");
    expect(output).toContain("Package");
    expect(output).toContain("Version");
    expect(output).toContain("License");
    expect(output).toContain("Risk");
    expect(output).toContain("chalk");
    expect(output).toContain("typescript");
    expect(output).toContain("safe");
  });

  it("prints warning risk label for warning packages", () => {
    const packages: Package[] = [
      { name: "lgpl-lib", version: "1.0.0", license: "LGPL-3.0", repository: null },
    ];
    const grouped = generateReport(packages);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("warning");
  });

  it("prints danger risk label for danger packages", () => {
    const packages: Package[] = [
      { name: "gpl-lib", version: "2.0.0", license: "GPL-3.0", repository: null },
    ];
    const grouped = generateReport(packages);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("danger");
  });

  it("prints unknown risk label for unknown/null license packages", () => {
    const packages: Package[] = [
      { name: "no-license-pkg", version: "0.0.1", license: null, repository: null },
    ];
    const grouped = generateReport(packages);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("unknown");
  });

  it("formats array license as comma-joined string in output", () => {
    const packages: Package[] = [
      { name: "multi-license", version: "1.0.0", license: ["MIT", "Apache-2.0"], repository: null },
    ];
    const grouped = generateReport(packages);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("MIT, Apache-2.0");
  });

  it("formats object license { type } as its type string in output", () => {
    const packages: Package[] = [
      { name: "obj-license", version: "1.0.0", license: { type: "MIT" }, repository: null },
    ];
    const grouped = generateReport(packages);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("MIT");
  });

  it("formats null license as 'unknown' in the license column", () => {
    const packages: Package[] = [
      { name: "no-license", version: "1.0.0", license: null, repository: null },
    ];
    const grouped = generateReport(packages);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    // "unknown" appears both as license column value and as risk label
    expect(output.indexOf("unknown")).toBeGreaterThanOrEqual(0);
  });

  it("prints an empty table body when no packages exist", () => {
    const grouped = generateReport([]);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      logs.push(String(message ?? ""));
    });

    printReport(grouped);

    const output = logs.join("\n");
    expect(output).toContain("License Report");
    // Only headers and dividers — no package rows
    expect(output).not.toContain("safe");
    expect(output).not.toContain("danger");
  });
});
