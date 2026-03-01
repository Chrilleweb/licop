import { afterEach, describe, expect, it, vi } from "vitest";

import type { Package } from "../src/index.js";
import { generateReport, printReport } from "../src/reporter.js";

describe("generateReport", () => {
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
});
