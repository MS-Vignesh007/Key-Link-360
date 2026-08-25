import type { DnsProviderAdapter, ProvisionDnsResult } from "./types";

export const manualProvider: DnsProviderAdapter = {
  capability: {
    id: "other",
    name: "Manual",
    supportsAutoDns: false,
    supportsOAuth: false,
    logoUrl: "/dns-providers/default.svg",
    helpUrl: "https://www.google.com/search?q=how+to+add+CNAME+DNS+record",
    blurb: "Copy the CNAME or A records and add them at your DNS host yourself."
  },

  async provisionDns(): Promise<ProvisionDnsResult> {
    return {
      success: false,
      message: "Manual DNS setup — follow the guided copy steps."
    };
  }
};
