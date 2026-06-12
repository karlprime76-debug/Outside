import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFollow } from "../use-follow";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("useFollow", () => {
  it("starts with initial following state", () => {
    const { result } = renderHook(() =>
      useFollow({ userId: "123", initialFollowing: false })
    );
    expect(result.current.following).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("starts following on toggle when not following", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() =>
      useFollow({ userId: "123", initialFollowing: false })
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.following).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "123" }),
    });
  });

  it("unfollows on toggle when following", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() =>
      useFollow({ userId: "123", initialFollowing: true })
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.following).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith("/api/follow?userId=123", {
      method: "DELETE",
    });
  });

  it("reverts state on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFollow({ userId: "123", initialFollowing: false, onError })
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.following).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  it("calls onSuccess callback", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useFollow({ userId: "123", initialFollowing: false, onSuccess })
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(onSuccess).toHaveBeenCalledWith(true);
  });

  it("prevents concurrent toggles", async () => {
    let resolveFetch: (_r: Response) => void;
    const fetchPromise = new Promise<Response>((r) => { resolveFetch = r; });
    mockFetch.mockReturnValue(fetchPromise);

    const { result } = renderHook(() =>
      useFollow({ userId: "123", initialFollowing: false })
    );

    // First toggle starts loading
    let firstTogglePromise: Promise<void>;
    await act(async () => {
      firstTogglePromise = result.current.toggle();
    });

    expect(result.current.loading).toBe(true);

    // Second toggle while loading should be a no-op
    await act(async () => {
      result.current.toggle();
    });

    // Still loading, fetch only called once
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Resolve the fetch
    await act(async () => {
      resolveFetch!({ ok: true } as Response);
      await firstTogglePromise;
    });

    expect(result.current.following).toBe(true);
  });
});
