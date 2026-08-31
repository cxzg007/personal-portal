// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { fetchGitHubStars, formatStars } from "./github-stars";

describe("formatStars", () => {
  it("formats compact star counts with a plus suffix", () => {
    expect(formatStars(11400)).toBe("11.4k+");
    expect(formatStars(1200)).toBe("1.2k+");
    expect(formatStars(999)).toBe("999+");
    expect(formatStars(1000)).toBe("1k+");
  });
});

describe("fetchGitHubStars", () => {
  it("returns the live count when the GitHub API responds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 12345 }),
    }));
    expect(await fetchGitHubStars(11400)).toBe(12345);
  });

  it("falls back to the snapshot when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchGitHubStars(11400)).toBe(11400);
  });

  it("falls back to the snapshot when the API rejects the request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    expect(await fetchGitHubStars(11400)).toBe(11400);
  });
});