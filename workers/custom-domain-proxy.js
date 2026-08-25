/**
 * KEYLINK360 — Cloudflare Worker for Cloudflare for SaaS (FREE plan).
 *
 * Deploy once on the PLATFORM zone: mindflo.today
 *
 * Required Worker route on zone mindflo.today:
 *   match ALL hosts and paths  (pattern: star / star)
 *
 * Why that catch-all route?
 * Custom hostnames (tree.ezysellonline.com, …) arrive with Host = customer domain.
 * A route like only cf-saas-origin.mindflo.today does NOT match them, so traffic
 * hits Railway with the wrong Host → "train has not arrived" 404.
 *
 * This Worker:
 * - Platform hosts (*.mindflo.today): pass through to Railway (no Host rewrite loop)
 * - Customer custom hostnames: rewrite Host → keylink360.mindflo.today + preserve
 *   key-customer-host / X-Forwarded-Host for Express routing
 *
 * Fallback Origin in Cloudflare for SaaS should remain:
 *   cf-saas-origin.mindflo.today
 *
 * IMPORTANT: never put the characters star-slash inside block comments — that
 * ends the comment early and breaks Worker deploy (SyntaxError).
 */
const PLATFORM_HOST = "keylink360.mindflo.today";
/** CNAME target of keylink360.mindflo.today — avoids Worker loops on catch-all route */
const RAILWAY_HOST = "uewsld8v.up.railway.app";

function isPlatformZoneHost(host) {
  return (
    host === PLATFORM_HOST ||
    host === "cf-saas-origin.mindflo.today" ||
    host === "mindflo.today" ||
    host === "www.mindflo.today" ||
    host.endsWith(".mindflo.today")
  );
}

function samePathRedirect(location, requestUrl) {
  try {
    const loc = new URL(location, requestUrl);
    const req = new URL(requestUrl);
    return loc.pathname === req.pathname && loc.search === req.search;
  } catch {
    return false;
  }
}

function isExternalRedirect(location, requestUrl) {
  if (!location) return false;
  try {
    const loc = new URL(location, requestUrl);
    const req = new URL(requestUrl);
    return loc.hostname.toLowerCase() !== req.hostname.toLowerCase();
  } catch {
    return false;
  }
}

async function fetchUpstream(request, customerHost) {
  const url = new URL(request.url);
  const upstreamUrl = new URL(request.url);
  upstreamUrl.protocol = "https:";
  upstreamUrl.hostname = PLATFORM_HOST;

  const headers = new Headers(request.headers);
  headers.set("Host", PLATFORM_HOST);
  headers.set("X-Forwarded-Host", customerHost);
  headers.set("key-customer-host", customerHost);

  const init = {
    method: request.method,
    headers,
    // Never follow redirects — Railway/CF can bounce on X-Forwarded-Host and loop.
    redirect: "manual",
    cf: { resolveOverride: RAILWAY_HOST }
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  let response = await fetch(upstreamUrl.toString(), init);

  // Same-path 3xx (often https://customer-host/same-path) → retry without
  // X-Forwarded-Host so Railway returns the real app response.
  // Never do this for external redirects (link rotator destinations).
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location") || "";
    if (
      location &&
      samePathRedirect(location, request.url) &&
      !isExternalRedirect(location, request.url)
    ) {
      const retryHeaders = new Headers(request.headers);
      retryHeaders.set("Host", PLATFORM_HOST);
      retryHeaders.delete("X-Forwarded-Host");
      retryHeaders.set("key-customer-host", customerHost);
      const retryInit = {
        method: request.method,
        headers: retryHeaders,
        redirect: "manual",
        cf: { resolveOverride: RAILWAY_HOST }
      };
      if (request.method !== "GET" && request.method !== "HEAD") {
        retryInit.body = request.body;
      }
      response = await fetch(upstreamUrl.toString(), retryInit);
    }
  }

  return response;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    try {
      // Own zone hostnames → Railway directly (keep original Host)
      if (isPlatformZoneHost(host)) {
        return fetch(request, {
          cf: { resolveOverride: RAILWAY_HOST },
          redirect: "manual"
        });
      }

      const response = await fetchUpstream(request, host);

      // Link rotator (/r/:slug) + short links (/l/:slug):
      // - External 302 → pass Location through (browser leaves customer host)
      // - 200 HTML redirect page → pass body through unchanged (never rewrite)
      if (url.pathname.startsWith("/r/") || url.pathname.startsWith("/l/")) {
        const headers = new Headers(response.headers);
        headers.set("cache-control", "no-store");
        if (
          response.status >= 300 &&
          response.status < 400 &&
          isExternalRedirect(response.headers.get("Location") || "", request.url)
        ) {
          return new Response(null, { status: response.status, headers });
        }
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }

      return response;
    } catch (_error) {
      return new Response(
        "KEYLINK360 edge proxy temporarily unavailable. Please retry in a moment.",
        {
          status: 502,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store"
          }
        }
      );
    }
  }
};
