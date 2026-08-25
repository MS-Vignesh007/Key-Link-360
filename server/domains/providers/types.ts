import type { DnsRecordInstruction } from "../dnsRecords";

export type DnsProviderId =
  | "cloudflare"
  | "godaddy"
  | "hostinger"
  | "namecheap"
  | "porkbun"
  | "squarespace"
  | "other";

export type DnsProviderCapability = {
  id: DnsProviderId;
  name: string;
  /** Auto-create DNS via API/token when available */
  supportsAutoDns: boolean;
  /** OAuth redirect available (optional; token paste may still work) */
  supportsOAuth: boolean;
  logoUrl: string;
  helpUrl: string;
  /** Short non-technical blurb for the wizard card */
  blurb: string;
};

export type ProvisionDnsInput = {
  domainName: string;
  records: DnsRecordInstruction[];
  /** KEYLINK360 user who owns this domain — required for multi-tenant OAuth token lookup */
  ownerUserId?: string;
  /** Customer API token / key for this request (optional; prefer saved OAuth connection) */
  accessToken?: string;
  apiKey?: string;
  apiSecret?: string;
};

export type ProvisionDnsResult = {
  success: boolean;
  message: string;
  providerAccountId?: string | null;
  /** When true, UI should send the user through Cloudflare OAuth. */
  needsOAuth?: boolean;
};

export interface DnsProviderAdapter {
  capability: DnsProviderCapability;
  /**
   * Create/update DNS records at the customer's registrar.
   * Throw only for hard failures; return success:false for soft fallback to manual.
   */
  provisionDns(input: ProvisionDnsInput): Promise<ProvisionDnsResult>;
}
