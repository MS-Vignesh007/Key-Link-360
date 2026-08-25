import type { CustomDomain } from "../types";
import { isCustomDomainPublicReady } from "./bioPagePublicUrl";

export type DomainConnectionState = "live" | "connecting" | "offline";

export function isDomainDnsLinked(domain: CustomDomain): boolean {
  return (
    domain.status === "Verified" ||
    domain.status === "DNS Verified" ||
    domain.status === "Provisioning SSL"
  );
}

export { isCustomDomainPublicReady };

export function canOpenCustomDomainInBrowser(domain: CustomDomain): boolean {
  return isCustomDomainPublicReady(domain);
}

export function getDomainConnectionState(domain: CustomDomain): DomainConnectionState {
  if (domain.status === "Verified") return "live";
  if (domain.status === "DNS Verified" || domain.status === "Provisioning SSL") return "connecting";
  return "offline";
}

export function getDomainConnectionLabel(domain: CustomDomain): string {
  const state = getDomainConnectionState(domain);
  if (state === "live") return "Live";
  if (state === "connecting") return "Connecting";
  return "Offline";
}

export function getDomainStatusLabel(domain: CustomDomain): string {
  if (domain.status === "DNS Verified") return "DNS OK";
  if (domain.status === "Provisioning SSL") {
    const ssl = (domain.sslStatus || "").toLowerCase();
    if (ssl === "active" || ssl === "active_redeploying") return "Waiting SSL";
    if (ssl.includes("pending") || ssl.includes("initializing") || ssl.includes("validation")) {
      return "Provisioning";
    }
    return "Provisioning";
  }
  if (domain.status === "Verified") return "Verified";
  if (domain.status === "Pending DNS") return "Connecting";
  if (domain.status === "Error") return "Failed";
  return domain.status;
}

export function domainStatusTone(domain: CustomDomain): "success" | "warning" | "info" | "error" | "muted" {
  if (domain.status === "Verified") return "success";
  if (domain.status === "Error" || domain.providerStatus === "error") return "error";
  if (domain.status === "Provisioning SSL") return "info";
  if (domain.status === "DNS Verified") return "warning";
  return "muted";
}
