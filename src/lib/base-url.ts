const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

export function normalizeBaseUrl(raw?: string | null): string {
  const value = (raw || "").trim().replace(/^['"]+|['"]+$/g, "").replace(/\/+$/, "");
  if (!value) return "";

  const withoutScheme = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const host = withoutScheme.split("/")[0].split("@").pop()!.split(":")[0].toLowerCase();
  const prefix = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
    ? ""
    : LOCAL_HOSTS.includes(host)
      ? "http://"
      : "https://";

  try {
    const url = new URL(`${prefix}${value}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function getBaseUrl(reqUrl?: string): string {
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  if (fromEnv) return fromEnv;

  if (reqUrl) {
    try {
      const origin = new URL(reqUrl).origin;
      if (origin && origin !== "null") return origin;
    } catch {}
  }

  return "http://localhost:3000";
}
