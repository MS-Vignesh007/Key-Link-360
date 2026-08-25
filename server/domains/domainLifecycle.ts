import type { ProviderHostname } from "./cloudflare";
import { shouldRegisterCloudflareCustomHostnames } from "./saasConfig";
import { domainServesKeyBio } from "./dns";
import type { DomainStatus } from "./repository";

export type DomainUiPhase =
  | "connecting"
  | "dns_ok"
  | "waiting_ssl"
  | "provisioning"
  | "verified"
  | "live"
  | "failed";

export function sslIsActive(provider?: ProviderHostname | null) {
  if (!provider) return false;
  const ssl = (provider.sslStatus || "").toLowerCase();
  const status = (provider.status || "").toLowerCase();
  return (ssl === "active" || ssl === "active_redeploying") && (status === "active" || status === "pending");
}

export function sslIsPending(provider?: ProviderHostname | null) {
  if (!provider) return false;
  const ssl = (provider.sslStatus || "").toLowerCase();
  return (
    ssl.includes("pending") ||
    ssl.includes("initializing") ||
    ssl.includes("validation") ||
    ssl === "pending_validation" ||
    ssl === "pending_issuance"
  );
}

/**
 * Canonical status for DB + SSL poller.
 * LIVE/Verified only when HTTPS /api/health returns KEY ok.
 */
export async function resolveDomainLifecycleStatus(input: {
  dnsVerified: boolean;
  domainName: string;
  provider?: ProviderHostname | null;
  previousStatus?: DomainStatus;
}): Promise<DomainStatus> {
  const { dnsVerified, domainName, provider } = input;
  if (!dnsVerified) return "Pending DNS";

  const serves = await domainServesKeyBio(domainName);
  if (serves) return "Verified";

  if (shouldRegisterCloudflareCustomHostnames() && provider) {
    if (sslIsActive(provider)) return "Provisioning SSL";
    if (sslIsPending(provider) || provider.status === "pending") return "Provisioning SSL";
    return "Provisioning SSL";
  }

  return "DNS Verified";
}

export function mapStatusToUiPhase(
  status: DomainStatus,
  options?: { servesKey?: boolean; provider?: ProviderHostname | null; hasError?: boolean }
): DomainUiPhase {
  if (options?.hasError || status === "Error") return "failed";
  if (status === "Verified" || options?.servesKey) return "live";
  if (status === "Pending DNS") return "connecting";
  if (status === "DNS Verified") return "dns_ok";
  if (status === "Provisioning SSL") {
    if (sslIsActive(options?.provider)) return "waiting_ssl";
    return "provisioning";
  }
  return "connecting";
}

export function uiPhaseLabel(phase: DomainUiPhase): string {
  switch (phase) {
    case "connecting":
      return "Connecting";
    case "dns_ok":
      return "DNS OK";
    case "waiting_ssl":
      return "Waiting SSL";
    case "provisioning":
      return "Provisioning";
    case "verified":
      return "Verified";
    case "live":
      return "LIVE";
    case "failed":
      return "Failed";
    default:
      return phase;
  }
}
