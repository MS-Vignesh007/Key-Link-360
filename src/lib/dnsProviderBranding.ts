export type ProviderBranding = {
  id: string;
  displayName: string;
  logoUrl: string;
  accentColor: string;
};

const BRANDING: Record<string, Omit<ProviderBranding, "id">> = {
  godaddy: {
    displayName: "GoDaddy",
    logoUrl: "/dns-providers/godaddy.svg",
    accentColor: "#111827"
  },
  namecheap: {
    displayName: "Namecheap",
    logoUrl: "/dns-providers/namecheap.svg",
    accentColor: "#de3723"
  },
  cloudflare: {
    displayName: "Cloudflare",
    logoUrl: "/dns-providers/cloudflare.svg",
    accentColor: "#f38020"
  },
  hostinger: {
    displayName: "Hostinger",
    logoUrl: "/dns-providers/hostinger.svg",
    accentColor: "#673de6"
  },
  porkbun: {
    displayName: "Porkbun",
    logoUrl: "/dns-providers/porkbun.svg",
    accentColor: "#e1563e"
  },
  dynadot: {
    displayName: "Dynadot",
    logoUrl: "/dns-providers/dynadot.svg",
    accentColor: "#0066cc"
  },
  namecom: {
    displayName: "Name.com",
    logoUrl: "/dns-providers/namecom.svg",
    accentColor: "#006699"
  },
  bluehost: {
    displayName: "Bluehost",
    logoUrl: "/dns-providers/bluehost.svg",
    accentColor: "#00457c"
  },
  siteground: {
    displayName: "SiteGround",
    logoUrl: "/dns-providers/siteground.svg",
    accentColor: "#449a46"
  },
  hostgator: {
    displayName: "HostGator",
    logoUrl: "/dns-providers/hostgator.svg",
    accentColor: "#2e93ee"
  },
  wix: {
    displayName: "Wix",
    logoUrl: "/dns-providers/wix.svg",
    accentColor: "#0c6efc"
  },
  squarespace: {
    displayName: "Squarespace",
    logoUrl: "/dns-providers/squarespace.svg",
    accentColor: "#000000"
  },
  google: {
    displayName: "Google Domains",
    logoUrl: "/dns-providers/google-domains.svg",
    accentColor: "#4285f4"
  },
  route53: {
    displayName: "Amazon Route 53",
    logoUrl: "/dns-providers/route53.svg",
    accentColor: "#ff9900"
  },
  ionos: {
    displayName: "IONOS",
    logoUrl: "/dns-providers/ionos.svg",
    accentColor: "#003366"
  },
  other: {
    displayName: "Manual",
    logoUrl: "/dns-providers/default.svg",
    accentColor: "#64748b"
  }
};

export function getProviderBranding(providerId: string, fallbackName?: string): ProviderBranding {
  const known = BRANDING[providerId];
  if (known) {
    return { id: providerId, ...known };
  }

  const displayName = fallbackName?.trim() || "DNS Provider";
  return {
    id: providerId || "unknown",
    displayName,
    logoUrl: "/dns-providers/default.svg",
    accentColor: "#4f46e5"
  };
}
