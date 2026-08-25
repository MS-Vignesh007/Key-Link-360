import React from "react";

export type FormPaymentUiState = "idle" | "processing" | "success" | "failed" | "cancelled";

export type FormPaymentCheckoutProps = {
  state: FormPaymentUiState;
  amountInr?: number;
  title?: string;
  message?: string;
  errorMessage?: string;
  compact?: boolean;
  onRetry?: () => void;
  onDone?: () => void;
};

/** In-place checkout status — never a separate URL/route. */
export default function FormPaymentCheckout({
  state,
  amountInr,
  title = "Payment successful",
  message = "Your payment was verified. Thank you!",
  errorMessage,
  compact,
  onRetry,
  onDone
}: FormPaymentCheckoutProps) {
  if (state === "idle") return null;

  const pad = compact ? "p-4 rounded-2xl space-y-2" : "p-4.5 rounded-2xl space-y-2.5";

  if (state === "processing") {
    return (
      <div className={`bg-white border border-slate-200 text-center shadow-sm ${pad}`} role="status">
        <div className="mx-auto h-8 w-8 rounded-full border-2 border-pink-200 border-t-[#ec4899] animate-spin" />
        <p className="text-xs font-bold text-slate-800 mt-2">Processing payment…</p>
        <p className="text-[10px] text-slate-500">
          {amountInr ? `Confirming ₹${amountInr} securely. Do not close this page.` : "Confirming securely. Do not close this page."}
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className={`bg-white border border-emerald-200 text-center shadow-sm ${pad}`} role="status">
        <div className="mx-auto h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black">
          ✓
        </div>
        <p className="text-sm font-bold text-slate-900 mt-2">{title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">{message}</p>
        {amountInr ? (
          <p className="text-[10px] font-bold text-emerald-700">₹{amountInr} verified</p>
        ) : null}
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl"
          >
            Done
          </button>
        ) : null}
      </div>
    );
  }

  if (state === "cancelled") {
    return (
      <div className={`bg-white border border-amber-200 text-center shadow-sm ${pad}`} role="status">
        <p className="text-sm font-bold text-slate-900">Payment cancelled</p>
        <p className="text-[11px] text-slate-500">No charge was made. You can try again.</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="w-full mt-2 bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-bold py-2 rounded-xl"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-rose-200 text-center shadow-sm ${pad}`} role="status">
      <p className="text-sm font-bold text-slate-900">Payment failed</p>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        {errorMessage || "We could not verify this payment. Please try again."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="w-full mt-2 bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-bold py-2 rounded-xl"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
