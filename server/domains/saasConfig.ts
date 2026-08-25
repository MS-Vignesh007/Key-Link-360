function envFlag(name: string): string {
  return (process.env[name] || "").trim().toLowerCase();
}

function isTruthy(value: string) {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isFalsy(value: string) {
  return value === "0" || value === "false" || value === "no" || value === "off";
}

function cloudflareCredentialsPresent() {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN?.trim() && process.env.CLOUDFLARE_ZONE_ID?.trim());
}

/**
 * Cloudflare for SaaS custom hostname registration.
 *
 * Env (preferred): CLOUDFLARE_CUSTOM_HOSTNAME_ENABLED=true
 * Legacy: CLOUDFLARE_REGISTER_CUSTOM_HOSTNAMES=true
 *
 * Default when Cloudflare zone+token are set: ENABLED (scalable SaaS path).
 * Set CLOUDFLARE_CUSTOM_HOSTNAME_ENABLED=false to disable SaaS registration.
 *
 * Railway only accepts Host: keylink360.mindflo.today — requires platform Origin Rule
 * (ensurePlatformOriginHostRewrite on boot).
 */
export function shouldRegisterCloudflareCustomHostnames() {
  if (!cloudflareCredentialsPresent()) return false;

  const primary = envFlag("CLOUDFLARE_CUSTOM_HOSTNAME_ENABLED");
  if (isFalsy(primary)) return false;
  if (isTruthy(primary)) return true;

  const legacy = envFlag("CLOUDFLARE_REGISTER_CUSTOM_HOSTNAMES");
  if (isFalsy(legacy)) return false;
  if (isTruthy(legacy)) return true;

  return true;
}

export function cloudflareAccountId() {
  return (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
}
