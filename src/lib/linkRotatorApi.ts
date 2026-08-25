import type {
  LinkRotator,
  LinkRotatorAnalytics,
  LinkRotatorDestination
} from "../types";
import { apiUrl } from "./apiBase";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  isPreviewToken,
  refreshSession
} from "./authApi";

export class LinkRotatorApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "LINK_ROTATOR_FAILED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type LinkRotatorInput = {
  name: string;
  description?: string;
  hostDomain: string;
  /** Public path segment for /r/:slug — kept in sync with rotator name on save. */
  slug?: string;
  status: "Active" | "Inactive";
  destinations: Array<Pick<LinkRotatorDestination, "url" | "probability"> & { id?: string }>;
};

async function fetchJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  if (isPreviewToken(token)) {
    throw new LinkRotatorApiError(
      "Sign in with a real account to manage link rotators.",
      401,
      "PREVIEW_SESSION"
    );
  }

  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
  } catch {
    throw new LinkRotatorApiError("Could not reach KEYLINK360.", 0, "NETWORK_ERROR");
  }

  if (response.status === 401 && retry && getRefreshToken()) {
    try {
      await refreshSession();
      return fetchJson<T>(path, init, false);
    } catch {
      clearAuthSession("session_expired");
    }
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new LinkRotatorApiError(
      data?.error || "Request failed.",
      response.status,
      data?.code || "LINK_ROTATOR_FAILED"
    );
  }
  return data as T;
}

export async function fetchLinkRotators(): Promise<LinkRotator[]> {
  const result = await fetchJson<{ rotators: LinkRotator[] }>("/api/link-rotators");
  return result.rotators || [];
}

export async function createLinkRotator(input: LinkRotatorInput): Promise<LinkRotator> {
  const result = await fetchJson<{ rotator: LinkRotator }>("/api/link-rotators", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.rotator;
}

export async function updateLinkRotator(
  id: string,
  input: LinkRotatorInput
): Promise<LinkRotator> {
  const result = await fetchJson<{ rotator: LinkRotator }>(`/api/link-rotators/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.rotator;
}

export async function deleteLinkRotator(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/link-rotators/${id}`, { method: "DELETE" });
}

function isAnalyticsPayload(data: unknown): data is LinkRotatorAnalytics {
  if (!data || typeof data !== "object") return false;
  const row = data as LinkRotatorAnalytics;
  return Boolean(row.rotator) && Boolean(row.summary) && Array.isArray(row.destinations);
}

export async function fetchLinkRotatorAnalytics(id: string): Promise<LinkRotatorAnalytics> {
  // Prefer query on GET /:id — more compatible with proxies than nested /analytics.
  try {
    const data = await fetchJson<LinkRotatorAnalytics>(`/api/link-rotators/${id}?analytics=1`);
    if (isAnalyticsPayload(data)) return data;
  } catch {
    // Fall through to nested route.
  }
  return fetchJson<LinkRotatorAnalytics>(`/api/link-rotators/${id}/analytics`);
}
