import { useEffect, useMemo, useState } from "react";
import { analyzeDomain } from "../../lib/domainApi";
import {
  customDomainValidationError,
  getCustomDomainKind,
  type DnsInstructionSet
} from "../../lib/customDomainDns";
import { normaliseHostname } from "../../storage/publishStorage";

export function useDomainInputPreview(
  domainName: string,
  dnsSet: DnsInstructionSet | null,
  enabled: boolean
) {
  const normalized = normaliseHostname(domainName);
  const validationError = normalized ? customDomainValidationError(normalized) : null;
  const kind = normalized ? getCustomDomainKind(normalized) : null;
  const isValid = Boolean(normalized && !validationError && kind);

  const [checking, setChecking] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isValid || !normalized) {
      setChecking(false);
      setProviderId(null);
      setProviderName(null);
      setCheckError(null);
      return;
    }

    let cancelled = false;
    setChecking(true);
    setCheckError(null);

    const timer = window.setTimeout(() => {
      void analyzeDomain(normalized)
        .then((result) => {
          if (cancelled) return;
          setProviderId(result.providerId);
          setProviderName(result.providerName);
        })
        .catch(() => {
          if (cancelled) return;
          setCheckError("Could not analyze DNS provider yet.");
          setProviderId(null);
          setProviderName(null);
        })
        .finally(() => {
          if (!cancelled) setChecking(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, isValid, normalized]);

  const kindLabel = useMemo(() => {
    if (kind === "root") return "Root domain";
    if (kind === "subdomain") return "Subdomain";
    return null;
  }, [kind]);

  const recordSummary = useMemo(() => {
    if (!dnsSet) return "";
    if (dnsSet.kind === "root") return "A record (@)";
    return "CNAME to KEYLINK360";
  }, [dnsSet]);

  return {
    normalized,
    validationError,
    kind,
    kindLabel,
    isValid,
    checking,
    providerId,
    providerName,
    checkError,
    recordSummary,
    isAvailable: isValid && !checking && !checkError
  };
}
