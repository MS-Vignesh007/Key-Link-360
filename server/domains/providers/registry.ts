import { cloudflareProvider } from "./cloudflareProvider";
import { manualProvider } from "./manualProvider";
import {
  godaddyProvider,
  hostingerProvider,
  namecheapProvider,
  porkbunProvider,
  squarespaceProvider
} from "./stubProviders";
import type { DnsProviderAdapter, DnsProviderCapability, DnsProviderId } from "./types";

/** Kept for older domain rows that stored a stub provider id — not shown in the picker. */
const LEGACY_PROVIDERS: DnsProviderAdapter[] = [
  godaddyProvider,
  hostingerProvider,
  namecheapProvider,
  porkbunProvider,
  squarespaceProvider
];

/** Customer-facing picker: Cloudflare auto-setup + Manual DNS only. */
const LISTED_PROVIDERS: DnsProviderAdapter[] = [cloudflareProvider, manualProvider];

const ALL_PROVIDERS: DnsProviderAdapter[] = [...LISTED_PROVIDERS, ...LEGACY_PROVIDERS];

const BY_ID = new Map<DnsProviderId, DnsProviderAdapter>(
  ALL_PROVIDERS.map((provider) => [provider.capability.id, provider])
);

export function listDnsProviderCapabilities(): DnsProviderCapability[] {
  return LISTED_PROVIDERS.map((provider) => provider.capability);
}

export function getDnsProvider(id: string | null | undefined): DnsProviderAdapter {
  const key = (id || "other").toLowerCase() as DnsProviderId;
  return BY_ID.get(key) || manualProvider;
}

export function normalizeDnsProviderId(id: string | null | undefined): DnsProviderId {
  const key = (id || "").toLowerCase();
  if (key === "cloudflare") return "cloudflare";
  return "other";
}
