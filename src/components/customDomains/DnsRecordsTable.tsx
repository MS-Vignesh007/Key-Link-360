import type { DnsRecordInstruction } from "../../lib/customDomainDns";
import DnsRecordCopyField from "./DnsRecordCopyField";

interface DnsRecordsTableProps {
  records: DnsRecordInstruction[];
  copiedIds?: Set<string>;
  onCopy?: (copyId: string, value: string) => void;
  compact?: boolean;
  readOnly?: boolean;
}

export default function DnsRecordsTable({
  records,
  copiedIds = new Set(),
  onCopy,
  compact,
  readOnly
}: DnsRecordsTableProps) {
  return (
    <div className={`key-domain-wizard__dns-table ${compact ? "key-domain-wizard__dns-table--compact" : ""}`}>
      <div className="key-domain-wizard__dns-head">
        <span>Record type</span>
        <span>Host name</span>
        <span>Required value</span>
      </div>
      {records.map((record) => (
        <div key={record.id} className="key-domain-wizard__dns-row">
          <span className="font-semibold">{record.type}</span>
          {readOnly ? (
            <>
              <span className="key-dns-copy-field__value">{record.hostDisplay}</span>
              <span className="key-dns-copy-field__value">{record.value}</span>
            </>
          ) : (
            <>
              <DnsRecordCopyField
                value={record.hostLabel}
                display={record.hostDisplay}
                copyId={record.id}
                copied={copiedIds.has(record.id)}
                onCopy={onCopy || (() => {})}
              />
              <DnsRecordCopyField
                value={record.value}
                copyId={`${record.id}-val`}
                copied={copiedIds.has(`${record.id}-val`)}
                onCopy={onCopy || (() => {})}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function countFullyCopiedRecords(records: DnsRecordInstruction[], copiedIds: Set<string>): number {
  return records.filter((record) => copiedIds.has(record.id) && copiedIds.has(`${record.id}-val`)).length;
}
