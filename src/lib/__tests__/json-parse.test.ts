import { describe, it, expect } from "vitest";
import { safeJsonParse } from "../json-parse";

describe("safeJsonParse", () => {
  it("parses valid JSON string", () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null for null input", () => {
    expect(safeJsonParse(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(safeJsonParse(undefined)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(safeJsonParse("{invalid}")).toBeNull();
  });

  it("parses JSON array", () => {
    expect(safeJsonParse("[1,2,3]")).toEqual([1, 2, 3]);
  });
});
