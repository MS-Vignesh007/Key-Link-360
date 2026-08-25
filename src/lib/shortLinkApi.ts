import type { ShortLinkAnalytics, SmartLink } from "../types";
import { apiUrl } from "./apiBase";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  isPreviewToken,
  refreshSession
} from "./authApi";

export class ShortLinkApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "SHORT_LINK_FAILED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type ShortLinkInput = {
  title: string;
  slug?: string;
  hostDomain: string;
  destinationUrl: string;
  status: "Live" | "Paused";
  retargeting: SmartLink["retargeting"];
};

async function fetchJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  if (isPreviewToken(token)) {
    throw new ShortLinkApiError(
      "Sign in with a real account to manage short links.",
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
    throw new ShortLinkApiError("Could not reach KEYLINK360.", 0, "NETWORK_ERROR");
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
    throw new ShortLinkApiError(
      data?.error || "Request failed.",
      response.status,
      data?.code || "SHORT_LINK_FAILED"
    );
  }
  return data as T;
}

export async function fetchShortLinks(): Promise<SmartLink[]> {
  const result = await fetchJson<{ links: SmartLink[] }>("/api/short-links");
  return result.links || [];
}

export async function createShortLink(input: ShortLinkInput): Promise<SmartLink> {
  const result = await fetchJson<{ link: SmartLink }>("/api/short-links", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.link;
}

export async function updateShortLink(id: string, input: ShortLinkInput): Promise<SmartLink> {
  const result = await fetchJson<{ link: SmartLink }>(`/api/short-links/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.link;
}

export async function deleteShortLink(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/short-links/${id}`, { method: "DELETE" });
}

export async function fetchShortLinkAnalytics(id: string): Promise<ShortLinkAnalytics> {
  return fetchJson<ShortLinkAnalytics>(`/api/short-links/${id}/analytics`);
}
