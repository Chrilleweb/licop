import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Command } from "commander";

// Mocks must be declared before the imports they affect.
// Vitest hoists vi.mock() calls to the top of the file automatically.
vi.mock("ora");
vi.mock("../src/scanner.js");
vi.mock("../src/reporter.js");

import ora from "ora";
import { scanDependencies } from "../src/scanner.js";
import {
  formatCsvReport,
  formatJsonReport,
  generateReport,
  printReport,
} from "../src/reporter.js";

import { run } from "../src/cli/run.js";
import type { GroupedReport, RawOptions } from "../src/config/types.js";

/** A report with no packages — the "happy path" baseline. */
const EMPTY_REPORT: GroupedReport = {
  safe: [],
  warning: [],
  danger: [],
  unknown: [],
};

/** A report containing one danger package — triggers non-zero exit. */
const DANGER_REPORT: GroupedReport = {
  safe: [],
  warning: [],
  danger: [
    {
      name: "evil-lib",
      version: "1.0.0",
      license: "GPL-3.0",
      repository: null,
      risk: "danger",
    },
  ],
  unknown: [],
};

/**
 * Builds a minimal Commander-compatible stub from a partial set of raw options.
 *
 * @param opts Partial CLI options to return from `program.opts()`.
 * @returns A Commander-compatible stub.
 */
function makeProgram(opts: Partial<RawOptions> = {}): Command {
  return {
    parse: vi.fn().mockReturnThis(),
    opts: vi.fn().mockReturnValue({ json: false, csv: false, ...opts }),
  } as unknown as Command;
}

describe("run", () => {
  let mockSpinner: {
    start: ReturnType<typeof vi.fn>;
    succeed: ReturnType<typeof vi.fn>;
    fail: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockSpinner = {
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
    };

    // Configure module-level mocks after reset.
    vi.mocked(ora).mockReturnValue(mockSpinner as unknown as ReturnType<typeof ora>);
    vi.mocked(scanDependencies).mockResolvedValue([]);
    vi.mocked(generateReport).mockReturnValue(EMPTY_REPORT);
    vi.mocked(formatJsonReport).mockReturnValue("{}");
    vi.mocked(formatCsvReport).mockReturnValue("csv");

    process.exitCode = undefined;
  });

  afterEach(() => {
    // Ensure a failing test never leaks its exit code into the next test.
    process.exitCode = undefined;
  });

  it("calls printReport in default (table) mode", async () => {
    await run(makeProgram());

    expect(printReport).toHaveBeenCalledWith(EMPTY_REPORT);
    expect(formatJsonReport).not.toHaveBeenCalled();
    expect(formatCsvReport).not.toHaveBeenCalled();
  });

  it("calls formatJsonReport and logs its output when --json is set", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await run(makeProgram({ json: true }));

    expect(formatJsonReport).toHaveBeenCalledWith(EMPTY_REPORT);
    expect(logSpy).toHaveBeenCalledWith("{}");
    logSpy.mockRestore();
  });

  it("calls formatCsvReport and logs its output when --csv is set", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await run(makeProgram({ csv: true }));

    expect(formatCsvReport).toHaveBeenCalledWith(EMPTY_REPORT);
    expect(logSpy).toHaveBeenCalledWith("csv");
    logSpy.mockRestore();
  });

  it("sets process.exitCode to 1 when danger packages are present", async () => {
    vi.mocked(generateReport).mockReturnValue(DANGER_REPORT);

    await run(makeProgram());

    expect(process.exitCode).toBe(1);
  });

  it("does not set process.exitCode when no danger packages are found", async () => {
    await run(makeProgram());

    expect(process.exitCode).toBeUndefined();
  });

  it("passes isSilent: true to ora when --json is set", async () => {
    await run(makeProgram({ json: true }));

    expect(ora).toHaveBeenCalledWith(expect.objectContaining({ isSilent: true }));
  });

  it("passes isSilent: true to ora when --csv is set", async () => {
    await run(makeProgram({ csv: true }));

    expect(ora).toHaveBeenCalledWith(expect.objectContaining({ isSilent: true }));
  });

  it("passes isSilent: false to ora in table mode", async () => {
    await run(makeProgram({ json: false, csv: false }));

    expect(ora).toHaveBeenCalledWith(expect.objectContaining({ isSilent: false }));
  });

  it("calls spinner.fail and sets exitCode 1 when scan throws an Error", async () => {
    vi.mocked(scanDependencies).mockRejectedValue(new Error("ENOENT: no such file"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await run(makeProgram());

    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith("ENOENT: no such file");
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("logs stringified value and sets exitCode 1 when scan throws a non-Error", async () => {
    vi.mocked(scanDependencies).mockRejectedValue("disk full");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await run(makeProgram());

    expect(errSpy).toHaveBeenCalledWith("disk full");
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });
});
