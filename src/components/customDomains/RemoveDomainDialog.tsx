interface RemoveDomainDialogProps {
  domainName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isRemoving: boolean;
}

export default function RemoveDomainDialog({
  domainName,
  onCancel,
  onConfirm,
  isRemoving
}: RemoveDomainDialogProps) {
  return (
    <div className="key-modal-backdrop">
      <div className="key-domain-remove-dialog animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-950">Remove {domainName}?</h3>
        <p className="mt-2 text-sm text-slate-600">
          This removes the domain from KEYLINK360 and, when Cloudflare is connected, also deletes the matching
          DNS record (CNAME/A) from your Cloudflare account. You can reconnect later if needed.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} disabled={isRemoving} className="key-domain-remove-dialog__cancel">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isRemoving} className="key-domain-remove-dialog__remove">
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
