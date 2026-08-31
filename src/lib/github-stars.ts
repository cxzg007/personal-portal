const GITHUB_API_TIMEOUT_MS = 3500;

export function formatStars(stars: number): string {
  if (stars < 1000) return `${stars}+`;
  const k = stars / 1000;
  const text = k >= 100 ? `${Math.round(k)}` : `${Number(k.toFixed(1))}`;
  return `${text}k+`;
}

export async function fetchGitHubStars(snapshot: number): Promise<number> {
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch("https://api.github.com/repos/semantica-agi/semantica", {
      headers,
      signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
    });
    if (!response.ok) return snapshot;
    const payload = (await response.json()) as { stargazers_count?: unknown };
    return typeof payload.stargazers_count === "number" ? payload.stargazers_count : snapshot;
  } catch {
    return snapshot;
  }
}