import type { CustomDomainPlatformConfig } from "../../types";

interface CustomDomainSetupGuideProps {
  config: CustomDomainPlatformConfig | null;
  hasPages: boolean;
  onConnect: () => void;
}

export default function CustomDomainSetupGuide({
  config,
  hasPages,
  onConnect
}: CustomDomainSetupGuideProps) {
  return (
    <div className="key-custom-domain-guide">
      <h3 className="key-custom-domain-guide__title">Connect your first domain</h3>
      <p className="key-custom-domain-guide__intro">
        Use an address you already own. We&apos;ll ask where your domain is managed, then either connect it
        for you (Cloudflare) or show simple copy steps. No hosting panel. No server setup.
      </p>
      <ol className="key-custom-domain-guide__steps">
        <li>Enter your domain</li>
        <li>Choose Cloudflare, GoDaddy, Hostinger, or Other</li>
        <li>Connect automatically or copy one DNS record</li>
        <li>We verify until you&apos;re LIVE</li>
      </ol>
      <button
        type="button"
        onClick={onConnect}
        disabled={!hasPages}
        className="key-custom-domain-guide__cta key-btn-accent inline-flex items-center gap-2 disabled:opacity-50"
      >
        Connect Domain
      </button>
      {!hasPages && (
        <p className="key-custom-domain-guide__hint">Publish a bio page first, then return here.</p>
      )}
      {config?.cnameTarget && (
        <p className="key-custom-domain-guide__dns mt-3">
          Tip: most people connect a subdomain like <code>name.yourdomain.com</code> pointing to{" "}
          <code>{config.cnameTarget}</code>.
        </p>
      )}
    </div>
  );
}
