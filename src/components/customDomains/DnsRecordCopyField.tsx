interface DnsRecordCopyFieldProps {
  value: string;
  display?: string;
  copyId: string;
  copied: boolean;
  onCopy: (copyId: string, value: string) => void;
}

export default function DnsRecordCopyField({
  value,
  display,
  copyId,
  copied,
  onCopy
}: DnsRecordCopyFieldProps) {
  const shown = display ?? value;

  return (
    <div className="key-dns-copy-field">
      <span className="key-dns-copy-field__value" title={value}>
        {shown}
      </span>
      <button
        type="button"
        className={`key-dns-copy-field__btn ${copied ? "is-copied" : ""}`}
        onClick={() => onCopy(copyId, value)}
        aria-label={copied ? `Copied ${shown}` : `Copy ${shown}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
