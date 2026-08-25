import {

  getCustomDomainKind,

  getSubdomainHostLabel,

  normalizeHostname,

  resolveCnameTarget,

  resolveCustomDomainATarget

} from "./hostname";



/**

 * DNS record rules (default across KEYLINK360):

 * - Root domain (example.com): A record @ → hosting IP only

 * - Subdomain (king.example.com, www.example.com): CNAME → hosting hostname only

 */



export type DnsRecordInstruction = {

  id: string;

  type: "A" | "CNAME";

  hostLabel: string;

  hostDisplay: string;

  value: string;

};



export function buildDnsRecordSet(domainName: string): {

  domainName: string;

  records: DnsRecordInstruction[];

  kind: "root" | "subdomain";

} {

  const host = normalizeHostname(domainName);

  const kind = getCustomDomainKind(host);

  const aTarget = resolveCustomDomainATarget();

  const cnameTarget = resolveCnameTarget();



  if (kind === "root") {

    return {

      domainName: host,

      kind: "root",

      records: [

        {

          id: "root-apex-a",

          type: "A",

          hostLabel: "@",

          hostDisplay: "@ (root)",

          value: aTarget

        }

      ]

    };

  }



  const hostLabel = getSubdomainHostLabel(host);

  return {

    domainName: host,

    kind: "subdomain",

    records: [

      {

        id: "subdomain-cname",

        type: "CNAME",

        hostLabel,

        hostDisplay: hostLabel,

        value: cnameTarget

      }

    ]

  };

}

