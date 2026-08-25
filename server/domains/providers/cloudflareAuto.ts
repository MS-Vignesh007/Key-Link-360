import { getDnsProviderConnection } from "./connections";
import {
  createCloudflareOAuthAuthorizeUrl,
  isCloudflareOAuthConfigured
} from "../cloudflare/CloudflareOAuthService";
import { findZoneForHostname } from "../cloudflare/CloudflareZoneService";
import { getDnsZoneDomain, normalizeHostname } from "../hostname";

export type CloudflareBeginResult =
  | {
      mode: "oauth";
      authorizeUrl: string;
      /** True when a linked CF account exists but does not contain this domain's zone. */
      accountMismatch?: boolean;
      /** Zone already in linked account — OAuth should show permission, not force Sign in. */
      sameAccount?: boolean;
      message?: string;
    }
  | { mode: "manual"; message: string };

/**
 * Always send the user through Cloudflare OAuth after Connect Cloudflare:
 * - Zone already in linked account → Authorize/permission only (no force login)
 * - Zone NOT in linked account → Sign in (prompt=login) + mismatch alert
 * - No linked token yet → Sign in / Authorize
 *
 * Never skip the permission step with mode "ready".
 */
export async function beginCloudflareAutoSetup(input: {
  ownerUserId: string;
  domainName: string;
  pageId: string;
}): Promise<CloudflareBeginResult> {
  const hostname = normalizeHostname(input.domainName);
  const zoneHint = getDnsZoneDomain(hostname) || hostname;

  const startOauth = async (opts: {
    forceLogin: boolean;
    accountMismatch?: boolean;
    sameAccount?: boolean;
    message?: string;
  }): Promise<CloudflareBeginResult> => {
    if (!isCloudflareOAuthConfigured()) {
      return {
        mode: "manual",
        message:
          "Cloudflare one-click is not configured on the server yet (missing OAuth app). Choose Manual to add the DNS record yourself."
      };
    }
    const { authorizeUrl } = await createCloudflareOAuthAuthorizeUrl({
      userId: input.ownerUserId,
      domainName: hostname,
      pageId: input.pageId,
      forceLogin: opts.forceLogin
    });
    return {
      mode: "oauth",
      authorizeUrl,
      accountMismatch: opts.accountMismatch,
      sameAccount: opts.sameAccount,
      message: opts.message
    };
  };

  try {
    const saved = await getDnsProviderConnection(input.ownerUserId, "cloudflare");
    if (saved?.accessToken) {
      try {
        const zone = await findZoneForHostname(saved.accessToken, hostname);
        if (zone?.id) {
          // Same Cloudflare account — show permission/Approve, then Setting up {hostname}.
          return startOauth({ forceLogin: false, sameAccount: true });
        }

        return startOauth({
          forceLogin: true,
          accountMismatch: true,
          message:
            `${zoneHint} is not in the Cloudflare account currently linked to KEYLINK360. ` +
            `Sign in with the Cloudflare account that owns ${zoneHint} ` +
            `(if the next screen shows a different email, click Edit and switch accounts).`
        });
      } catch (zoneError) {
        console.warn("[cloudflare-auto] zone check failed, falling back to OAuth:", zoneError);
      }
    }

    return startOauth({ forceLogin: true });
  } catch (error) {
    console.warn("[cloudflare-auto] begin failed:", error);
    try {
      return await startOauth({ forceLogin: true });
    } catch {
      return {
        mode: "manual",
        message:
          "Could not start Cloudflare connect. Go back and choose Manual to add the DNS record yourself."
      };
    }
  }
}
