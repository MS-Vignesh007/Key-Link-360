import React, { memo, useEffect, useMemo, useState } from "react";
import {
  BlockRecord,
  computeCountdownParts,
  resolveCountdownEndAt
} from "../../lib/bioBlocks";

interface CountdownBlockViewProps {
  block: BlockRecord;
  compact?: boolean;
}

const CountdownBlockView = memo(function CountdownBlockView({
  block,
  compact = false
}: CountdownBlockViewProps) {
  const endAtMs = useMemo(() => resolveCountdownEndAt(block), [block.endAt, block.value]);
  const headline =
    (typeof block.headline === "string" && block.headline.trim()) ||
    block.label ||
    "Limited offer ends in";

  const [parts, setParts] = useState(() => computeCountdownParts(endAtMs));

  useEffect(() => {
    setParts(computeCountdownParts(endAtMs));
    const timer = window.setInterval(() => {
      setParts(computeCountdownParts(endAtMs));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endAtMs]);

  const unitClass = compact
    ? "bg-white border border-rose-100 p-1 rounded min-w-[32px] text-center shadow-sm"
    : "bg-white border border-rose-100 p-1.5 rounded-xl min-w-[40px] text-center shadow-sm";
  const numberClass = compact
    ? "font-bold text-xs block leading-none text-rose-700"
    : "font-extrabold text-sm block leading-none text-rose-700";
  const labelClass = compact
    ? "text-[6px] text-rose-500 block tracking-wide uppercase"
    : "text-[7px] text-rose-500 block tracking-wide uppercase mt-0.5";
  const titleClass = compact
    ? "text-[8px] font-bold text-rose-600 uppercase tracking-widest block"
    : "text-[10px] font-bold text-rose-600 uppercase tracking-widest block font-mono";

  if (parts.expired) {
    return (
      <div className={`bg-rose-50/70 border border-rose-100 ${compact ? "p-2.5" : "p-3.5"} rounded-2xl text-center shadow-sm`}>
        <span className={titleClass}>{headline}</span>
        <p className={`${compact ? "text-[10px]" : "text-xs"} font-bold text-rose-700 mt-1`}>Offer ended</p>
      </div>
    );
  }

  return (
    <div className={`bg-rose-50/70 border border-rose-100 ${compact ? "p-2.5 space-y-1" : "p-3.5 space-y-2"} rounded-2xl text-center shadow-sm`}>
      <span className={titleClass}>{headline}</span>
      <div className={`flex items-center justify-center ${compact ? "gap-1" : "gap-1.5"} text-rose-700`}>
        <div className={unitClass}>
          <span className={numberClass}>{String(parts.days).padStart(2, "0")}</span>
          <span className={labelClass}>DAYS</span>
        </div>
        <span className="text-rose-400 font-bold">:</span>
        <div className={unitClass}>
          <span className={numberClass}>{String(parts.hrs).padStart(2, "0")}</span>
          <span className={labelClass}>HRS</span>
        </div>
        <span className="text-rose-400 font-bold">:</span>
        <div className={unitClass}>
          <span className={numberClass}>{String(parts.mins).padStart(2, "0")}</span>
          <span className={labelClass}>MIN</span>
        </div>
        <span className="text-rose-400 font-bold">:</span>
        <div className={unitClass}>
          <span className={numberClass}>{String(parts.secs).padStart(2, "0")}</span>
          <span className={labelClass}>SEC</span>
        </div>
      </div>
    </div>
  );
});

export default CountdownBlockView;
