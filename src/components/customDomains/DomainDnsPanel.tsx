import { useMemo, useState } from "react";
import type { CustomDomainDnsRecordTemplate } from "../../types";
import { buildDnsRecordSet, getCustomDomainKind } from "../../lib/customDomainDns";
import DnsRecordsTable from "./DnsRecordsTable";

interface DomainDnsPanelProps {
  domainName: string;
  records: CustomDomainDnsRecordTemplate[];
  aRecordTarget: string;
  cnameTarget?: string;
  /** @deprecated Ownership TXT is not shown — users only add A (root) or CNAME (subdomain). */
  ownershipVerification?: Record<string, unknown> | null;
}

export default function DomainDnsPanel({
  domainName,
  records,
  aRecordTarget,
  cnameTarget
}: DomainDnsPanelProps) {
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const kind = getCustomDomainKind(domainName);

  const displayRecords = useMemo(() => {
    if (records.length > 0) {
      return records.filter((record) => record.type === "A" || record.type === "CNAME");
    }
    return buildDnsRecordSet(domainName, aRecordTarget, { cnameTarget }).records;
  }, [records, domainName, aRecordTarget, cnameTarget]);

  const copyValue = async (copyId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIds((current) => new Set([...current, copyId]));
    } catch {
      // ignore
    }
  };

  return (
    <div className="key-domains-lovable__dns-panel">
      <p className="key-domains-lovable__dns-panel-lead">
        {kind === "root" ? (
          <>
            Root domain — add one <strong>A</strong> record: <code>@</code> → <code>{aRecordTarget}</code>.
          </>
        ) : (
          <>
            Subdomain — add one <strong>CNAME</strong> to{" "}
            <code>{cnameTarget || "keylink360.mindflo.today"}</code>. Do not use an A record.
          </>
        )}
      </p>
      <DnsRecordsTable
        records={displayRecords}
        copiedIds={copiedIds}
        onCopy={(copyId, value) => void copyValue(copyId, value)}
        compact
      />
    </div>
  );
}
