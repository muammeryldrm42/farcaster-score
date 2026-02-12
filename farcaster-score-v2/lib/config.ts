export function normalizeCandidate(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

export function resolveAppBaseUrl(): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const candidate = normalizeCandidate(appUrl || vercelUrl || "");
  if (!candidate) return undefined;

  try {
    const parsed = new URL(candidate);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}
