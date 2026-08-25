/**
 * API base for Path A: Vercel UI → Railway backend.
 * - Dev (npm run dev on localhost): always same-origin `/api/...` (local Express)
 * - Production static (Vercel): set VITE_API_URL=https://your-app.up.railway.app
 */
export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";

  // Local / LAN dev runs Express + Vite on one port — ignore remote VITE_API_URL so
  // API + /q redirects hit the same machine the browser is on.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
    ) {
      return "";
    }
  }

  return raw.replace(/\/$/, "");
}

/** Build absolute or relative API path. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
