import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes an HTTPS origin by removing paths, queries, hashes, and trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.example.com/work?from=test#hero");

    expect(getSiteUrl().origin).toBe("https://portfolio.example.com");
    expect(getSiteUrl()).toMatchObject({ pathname: "/", search: "", hash: "" });
  });

  it("throws a clear production error when configuration is missing", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL.*required.*production/i);
  });

  it("uses Vercel's stable production hostname when the public URL is not configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "VERCEL_PROJECT_PRODUCTION_URL",
      "jiangjunjie-personal-portal-junjie1467-6343s-projects.vercel.app",
    );

    expect(getSiteUrl().origin).toBe(
      "https://jiangjunjie-personal-portal-junjie1467-6343s-projects.vercel.app",
    );
  });

  it("rejects a non-HTTPS production URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://portfolio.example.com");

    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL.*HTTPS/i);
  });

  it("rejects an explicitly configured non-HTTPS URL outside production too", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://portfolio.example.com");

    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL.*HTTPS/i);
  });

  it("uses a documented localhost fallback outside production", () => {
    vi.stubEnv("NODE_ENV", "test");

    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });
});
