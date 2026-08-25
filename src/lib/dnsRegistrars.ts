export interface DnsRegistrarHint {
  id: string;
  name: string;
  dnsHelpUrl: string;
}

/** Common registrars — users open their provider and add the records KEY shows. */
export const DNS_REGISTRAR_HINTS: DnsRegistrarHint[] = [
  { id: "godaddy", name: "GoDaddy", dnsHelpUrl: "https://www.godaddy.com/help/manage-dns-records-680" },
  { id: "namecheap", name: "Namecheap", dnsHelpUrl: "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" },
  { id: "cloudflare", name: "Cloudflare", dnsHelpUrl: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" },
  { id: "hostinger", name: "Hostinger", dnsHelpUrl: "https://support.hostinger.com/en/articles/1583249-how-to-manage-dns-records" },
  { id: "porkbun", name: "Porkbun", dnsHelpUrl: "https://kb.porkbun.com/article/68-how-to-edit-dns-records" },
  { id: "dynadot", name: "Dynadot", dnsHelpUrl: "https://www.dynadot.com/community/help/question/set-DNS-settings" },
  { id: "namecom", name: "Name.com", dnsHelpUrl: "https://www.name.com/support/articles/205934547-Managing-DNS-records" }
];

export function registrarNamesLine(): string {
  return DNS_REGISTRAR_HINTS.map((item) => item.name).join(", ");
}
