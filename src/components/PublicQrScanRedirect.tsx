import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../lib/apiBase";

/**
 * SPA fallback for Smart QR scans. Prefer server 302 on GET /q/:code;
 * if the SPA loads (e.g. static host), resolve destination via public API.
 */
export default function PublicQrScanRedirect() {
  const { code } = useParams<{ code: string }>();
  const [message, setMessage] = useState("Opening destination…");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const publicCode = String(code || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      if (!publicCode) {
        setMessage("QR code not found.");
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/public/qr/${encodeURIComponent(publicCode)}`), {
          cache: "no-store"
        });
        const payload = (await response.json().catch(() => null)) as {
          targetUrl?: string;
          error?: string;
          status?: string;
        } | null;

        if (cancelled) return;

        if (!response.ok || !payload?.targetUrl) {
          setMessage(
            payload?.status === "Paused"
              ? "This QR code is paused."
              : payload?.error || "QR code not found."
          );
          return;
        }

        window.location.replace(payload.targetUrl);
      } catch {
        if (!cancelled) setMessage("Could not open destination. Try again.");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-2">
        <p className="text-sm font-semibold text-slate-700">{message}</p>
        <p className="text-xs text-slate-400">KEYLINK360 Smart QR</p>
      </div>
    </div>
  );
}
