import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit } from "../rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows first request", async () => {
    const result = await rateLimit("test:ip1", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks when limit exceeded", async () => {
    const results = await Promise.all([
      rateLimit("test:ip2", 3, 60000), // remaining 2
      rateLimit("test:ip2", 3, 60000), // remaining 1
      rateLimit("test:ip2", 3, 60000), // remaining 0
    ]);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);

    const blocked = await rateLimit("test:ip2", 3, 60000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    await rateLimit("test:ip3", 1, 60000);
    const blocked = await rateLimit("test:ip3", 1, 60000);
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(60001);
    const allowed = await rateLimit("test:ip3", 1, 60000);
    expect(allowed.success).toBe(true);
  });

  it("uses separate buckets for different identifiers", async () => {
    await rateLimit("user:a", 1, 60000);
    const a2 = await rateLimit("user:a", 1, 60000);
    expect(a2.success).toBe(false);

    const b1 = await rateLimit("user:b", 1, 60000);
    expect(b1.success).toBe(true);
  });
});
