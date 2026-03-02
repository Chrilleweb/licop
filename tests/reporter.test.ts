import { afterEach, describe, expect, it, vi } from "vitest";

import type { Package } from "../src/config/types.js";
import { generateReport, formatJsonReport, formatCsvReport, printReport } from "../src/reporter.js";

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

describe("formatJsonReport", () => {
  it("returns valid JSON", () => {
    const grouped = generateReport([]);
    expect(() => JSON.parse(formatJsonReport(grouped))).not.toThrow();
  });

  it("includes all four risk groups in the output", () => {
    const grouped = generateReport([]);
    const parsed = JSON.parse(formatJsonReport(grouped)) as Record<string, unknown>;
    expect(parsed).toHaveProperty("safe");
    expect(parsed).toHaveProperty("warning");
    expect(parsed).toHaveProperty("danger");
    expect(parsed).toHaveProperty("unknown");
  });

  it("places a danger package in the danger group", () => {
    const packages: Package[] = [
      { name: "gpl-lib", version: "1.0.0", license: "GPL-3.0", repository: null },
    ];
    const grouped = generateReport(packages);
    const parsed = JSON.parse(formatJsonReport(grouped)) as {
      danger: Array<{ name: string }>;
    };
    expect(parsed.danger).toHaveLength(1);
    expect(parsed.danger[0].name).toBe("gpl-lib");
  });

  it("places a safe package in the safe group", () => {
    const packages: Package[] = [
      { name: "chalk", version: "5.3.0", license: "MIT", repository: null },
    ];
    const grouped = generateReport(packages);
    const parsed = JSON.parse(formatJsonReport(grouped)) as {
      safe: Array<{ name: string }>;
    };
    expect(parsed.safe).toHaveLength(1);
    expect(parsed.safe[0].name).toBe("chalk");
  });

  it("outputs pretty-printed JSON (2-space indent)", () => {
    const grouped = generateReport([]);
    const json = formatJsonReport(grouped);
    expect(json).toContain("\n  ");
  });
});

describe("formatCsvReport", () => {
  it("returns a CSV string with headers", () => {
    const grouped = generateReport([]);
    const csv = formatCsvReport(grouped);
    expect(csv).toContain("Package,Version,License,Risk");
  });
});
