/**
 * CloudflareVerificationService — user-facing verify helpers after DNS write.
 */
import { verifyDomainDns, domainServesKeyBio } from "../dns";

export type DomainVerifySnapshot = {
  dnsVerified: boolean;
  dnsMessage: string;
  servesKey: boolean;
  statusHint: "pending_dns" | "dns_ok" | "live" | "ssl_pending";
};

export async function snapshotDomainVerification(hostname: string): Promise<DomainVerifySnapshot> {
  const dns = await verifyDomainDns(hostname);
  const servesKey = dns.verified ? await domainServesKeyBio(hostname) : false;

  let statusHint: DomainVerifySnapshot["statusHint"] = "pending_dns";
  if (servesKey) statusHint = "live";
  else if (dns.verified) statusHint = "dns_ok";

  return {
    dnsVerified: dns.verified,
    dnsMessage: dns.message,
    servesKey,
    statusHint
  };
}
