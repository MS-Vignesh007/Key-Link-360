/**
 * Browser redirect page for /r/:slug.
 *
 * Some edges (Cloudflare for SaaS / proxies) follow HTTP 302s and return the
 * destination HTML under the custom hostname — CSS/assets then break.
 * A 200 HTML page with location.replace() is executed only in the browser.
 */
export function buildLinkRotatorRedirectHtml(targetUrl: string): string {
  const safeJson = JSON.stringify(targetUrl);
  const safeAttr = targetUrl
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Single client-side redirect only (no meta-refresh) — avoids extra navigations
  // that some browsers/previews treat as additional hits on the rotator URL.
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting…</title>
  <style>
    body{font-family:Segoe UI,system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a}
    a{color:#4f46e5;font-weight:600}
    p{font-size:14px}
  </style>
  <script>location.replace(${safeJson});</script>
</head>
<body>
  <p>Redirecting to <a href="${safeAttr}" rel="noreferrer">your destination</a>…</p>
  <noscript><meta http-equiv="refresh" content="0;url=${safeAttr}" /></noscript>
</body>
</html>`;
}
