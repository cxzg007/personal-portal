const LOCAL_FALLBACK = "http://localhost:3000";

/**
 * Returns the canonical site origin. Local development and tests deliberately
 * fall back to localhost; production must set a real HTTPS origin.
 */
export function getSiteUrl(): URL {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const configured =
    publicSiteUrl ||
    (vercelProductionHost
      ? vercelProductionHost.startsWith("https://")
        ? vercelProductionHost
        : `https://${vercelProductionHost}`
      : "");

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL is required in production",
      );
    }
    return new URL(LOCAL_FALLBACK);
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS when configured");
  }

  return new URL(parsed.origin);
}
