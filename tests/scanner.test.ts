import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
}));

import { readdir, readFile, stat } from "node:fs/promises";

import { scanDependencies } from "../src/scanner.js";

const mockDir = (isDir: boolean) =>
  Promise.resolve({ isDirectory: () => isDir } as Awaited<ReturnType<typeof stat>>);

function pkg(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    name: "test-pkg",
    version: "1.0.0",
    license: "MIT",
    ...overrides,
  });
}

describe("scanDependencies", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty array when node_modules does not exist", async () => {
    vi.mocked(readdir).mockRejectedValueOnce(new Error("ENOENT"));
    expect(await scanDependencies()).toEqual([]);
  });

  it("returns empty array when node_modules is empty", async () => {
    vi.mocked(readdir).mockResolvedValue([] as never);
    expect(await scanDependencies()).toEqual([]);
  });

  it("skips dot-entries without hitting stat", async () => {
    vi.mocked(readdir).mockResolvedValue([".bin", ".cache"] as never);
    expect(await scanDependencies()).toEqual([]);
    expect(stat).not.toHaveBeenCalled();
  });

  it("skips non-directory entries", async () => {
    vi.mocked(readdir).mockResolvedValue(["somefile.txt"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(false) as never);
    expect(await scanDependencies()).toEqual([]);
  });

  it("reads a regular package with string license", async () => {
    vi.mocked(readdir).mockResolvedValue(["chalk"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      pkg({ name: "chalk", version: "5.3.0", license: "MIT" }) as never,
    );

    const result = await scanDependencies();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "chalk", version: "5.3.0", license: "MIT" });
  });

  it("reads a scoped package (@scope/name)", async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce(["@types"] as never)
      .mockResolvedValueOnce(["node"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      pkg({ name: "@types/node", version: "20.0.0", license: "MIT" }) as never,
    );

    const result = await scanDependencies();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("@types/node");
  });

  it("skips dot-entries inside scoped folders", async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce(["@scope"] as never)
      .mockResolvedValueOnce([".cache", "real-pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      pkg({ name: "@scope/real-pkg", version: "1.0.0", license: "MIT" }) as never,
    );

    const result = await scanDependencies();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("@scope/real-pkg");
  });

  it("skips scoped entries that are not directories", async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce(["@scope"] as never)
      .mockResolvedValueOnce(["not-a-dir"] as never);
    vi.mocked(stat)
      .mockResolvedValueOnce(mockDir(true) as never)  // @scope itself
      .mockResolvedValueOnce(mockDir(false) as never); // not-a-dir

    const result = await scanDependencies();

    expect(result).toEqual([]);
  });

  it("skips package when package.json is missing", async () => {
    vi.mocked(readdir).mockResolvedValue(["missing-pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));

    expect(await scanDependencies()).toEqual([]);
  });

  it("skips package when package.json contains invalid JSON", async () => {
    vi.mocked(readdir).mockResolvedValue(["bad-json"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue("{ not valid json }{" as never);

    expect(await scanDependencies()).toEqual([]);
  });

  it("falls back to directory basename when name field is missing", async () => {
    vi.mocked(readdir).mockResolvedValue(["my-lib"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ version: "1.0.0", license: "MIT" }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].name).toBe("my-lib");
  });

  it("falls back to 'unknown' when version field is missing", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "pkg", license: "MIT" }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].version).toBe("unknown");
  });

  it("normalizes repository as a plain string", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        license: "MIT",
        repository: "https://github.com/user/pkg",
      }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].repository).toBe("https://github.com/user/pkg");
  });

  it("normalizes repository as an object with url", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        license: "MIT",
        repository: { type: "git", url: "https://github.com/user/pkg" },
      }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].repository).toBe("https://github.com/user/pkg");
  });

  it("returns null repository when field is absent", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "pkg", version: "1.0.0", license: "MIT" }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].repository).toBeNull();
  });

  it("normalizes license as a string array", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        license: ["MIT", "Apache-2.0"],
      }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toEqual(["MIT", "Apache-2.0"]);
  });

  it("normalizes license as an object { type }", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "pkg", version: "1.0.0", license: { type: "MIT" } }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toEqual({ type: "MIT" });
  });

  it("falls back to null when license is empty string array", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "pkg", version: "1.0.0", license: [] }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toBeNull();
  });

  it("normalizes legacy licenses field as array of strings", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "pkg", version: "1.0.0", licenses: ["MIT"] }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toEqual(["MIT"]);
  });

  it("normalizes legacy licenses field as array of objects with type", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        licenses: [{ type: "MIT" }, { type: "Apache-2.0" }],
      }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toEqual(["MIT", "Apache-2.0"]);
  });

  it("returns null license when no license or licenses field exists", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "pkg", version: "1.0.0" }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toBeNull();
  });

  it("returns packages sorted alphabetically by name", async () => {
    vi.mocked(readdir).mockResolvedValue(["zlib", "acorn", "chalk"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockImplementation(async (filePath) => {
      const p = String(filePath);
      if (p.includes("zlib")) return JSON.stringify({ name: "zlib", version: "1.0.0", license: "MIT" }) as never;
      if (p.includes("acorn")) return JSON.stringify({ name: "acorn", version: "1.0.0", license: "MIT" }) as never;
      return JSON.stringify({ name: "chalk", version: "1.0.0", license: "MIT" }) as never;
    });

    const result = await scanDependencies();
    expect(result.map((p) => p.name)).toEqual(["acorn", "chalk", "zlib"]);
  });

  it("handles stat throwing for an entry (treats as non-directory)", async () => {
    vi.mocked(readdir).mockResolvedValue(["broken-entry"] as never);
    vi.mocked(stat).mockRejectedValue(new Error("EPERM"));

    expect(await scanDependencies()).toEqual([]);
  });

  it("handles readdir throwing inside a scoped folder (returns empty)", async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce(["@scope"] as never)
      .mockRejectedValueOnce(new Error("EPERM"));
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);

    expect(await scanDependencies()).toEqual([]);
  });

  it("skips package when package.json content is not a plain object", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    // JSON.parse("42") yields a number, which fails isRecord check
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(42) as never);

    expect(await scanDependencies()).toEqual([]);
  });

  it("returns null repository when repository object has no url field", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        license: "MIT",
        repository: { type: "git" }, // valid object but no url field
      }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].repository).toBeNull();
  });

  it("returns null license when legacy licenses entries are unrecognized objects", async () => {
    vi.mocked(readdir).mockResolvedValue(["pkg"] as never);
    vi.mocked(stat).mockResolvedValue(mockDir(true) as never);
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        // object entries with no type field → all map to null → filtered → empty → null
        licenses: [{ url: "https://example.com" }],
      }) as never,
    );

    const result = await scanDependencies();
    expect(result[0].license).toBeNull();
  });
});
