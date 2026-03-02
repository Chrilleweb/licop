import { describe, expect, it } from "vitest";
import { Command } from "commander";

import { createProgram } from "../src/cli/program.js";

describe("createProgram", () => {
  it("returns a Commander Command instance", () => {
    expect(createProgram()).toBeInstanceOf(Command);
  });

  it("program name is 'licop'", () => {
    expect(createProgram().name()).toBe("licop");
  });

  it("has a --json option", () => {
    const optionNames = createProgram().options.map((o) => o.long);
    expect(optionNames).toContain("--json");
  });

  it("has a --csv option", () => {
    const optionNames = createProgram().options.map((o) => o.long);
    expect(optionNames).toContain("--csv");
  });
});
