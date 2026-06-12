import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cacheGet, cacheSet, cacheClear } from "../cache";

beforeEach(() => {
  cacheClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cache", () => {
  it("returns null for missing key", () => {
    expect(cacheGet("missing")).toBeNull();
  });

  it("stores and retrieves a value", () => {
    cacheSet("foo", { bar: 42 });
    expect(cacheGet("foo")).toEqual({ bar: 42 });
  });

  it("returns null after TTL expires", () => {
    cacheSet("foo", "bar", 1000);
    vi.advanceTimersByTime(1001);
    expect(cacheGet("foo")).toBeNull();
  });

  it("clears all entries when no pattern given", () => {
    cacheSet("a", 1);
    cacheSet("b", 2);
    cacheClear();
    expect(cacheGet("a")).toBeNull();
    expect(cacheGet("b")).toBeNull();
  });

  it("clears entries matching pattern", () => {
    cacheSet("feed:a", 1);
    cacheSet("feed:b", 2);
    cacheSet("user:c", 3);
    cacheClear("feed:");
    expect(cacheGet("feed:a")).toBeNull();
    expect(cacheGet("feed:b")).toBeNull();
    expect(cacheGet("user:c")).toEqual(3);
  });
});
