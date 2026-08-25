/**
 * Browser redirect page for /l/:slug (same approach as link rotators).
 */
export function buildShortLinkRedirectHtml(targetUrl: string): string {
  const safeJson = JSON.stringify(targetUrl);
  const safeAttr = targetUrl
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${safeAttr}" />
  <title>Redirecting…</title>
  <style>
    body{font-family:Segoe UI,system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a}
    a{color:#4f46e5;font-weight:600}
    p{font-size:14px}
  </style>
  <script>location.replace(${safeJson});</script>
</head>
<body>
  <p>Redirecting to <a href="${safeAttr}">your destination</a>…</p>
</body>
</html>`;
}
