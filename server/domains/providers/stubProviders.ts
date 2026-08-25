import type { DnsProviderAdapter, DnsProviderCapability, ProvisionDnsResult } from "./types";

function stub(capability: DnsProviderCapability): DnsProviderAdapter {
  return {
    capability,
    async provisionDns(): Promise<ProvisionDnsResult> {
      return {
        success: false,
        message: `${capability.name} auto-connect is coming soon. We'll guide you with simple copy steps for now.`
      };
    }
  };
}

export const godaddyProvider = stub({
  id: "godaddy",
  name: "GoDaddy",
  supportsAutoDns: false,
  supportsOAuth: false,
  logoUrl: "/dns-providers/godaddy.svg",
  helpUrl: "https://www.godaddy.com/help/add-a-cname-record-19236",
  blurb: "Guided steps for GoDaddy DNS — auto-connect coming soon."
});

export const hostingerProvider = stub({
  id: "hostinger",
  name: "Hostinger",
  supportsAutoDns: false,
  supportsOAuth: false,
  logoUrl: "/dns-providers/hostinger.svg",
  helpUrl: "https://support.hostinger.com/en/articles/1583227-how-to-manage-dns-records-in-hpanel",
  blurb: "Guided steps for Hostinger DNS — auto-connect coming soon."
});

export const namecheapProvider = stub({
  id: "namecheap",
  name: "Namecheap",
  supportsAutoDns: false,
  supportsOAuth: false,
  logoUrl: "/dns-providers/namecheap.svg",
  helpUrl: "https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/",
  blurb: "Guided steps for Namecheap DNS — auto-connect coming soon."
});

export const porkbunProvider = stub({
  id: "porkbun",
  name: "Porkbun",
  supportsAutoDns: false,
  supportsOAuth: false,
  logoUrl: "/dns-providers/porkbun.svg",
  helpUrl: "https://kb.porkbun.com/article/22-how-to-edit-dns-records",
  blurb: "Guided steps for Porkbun DNS — auto-connect coming soon."
});

export const squarespaceProvider = stub({
  id: "squarespace",
  name: "Squarespace",
  supportsAutoDns: false,
  supportsOAuth: false,
  logoUrl: "/dns-providers/squarespace.svg",
  helpUrl: "https://support.squarespace.com/hc/en-us/articles/360002101888",
  blurb: "Guided steps for Squarespace Domains — auto-connect coming soon."
});
