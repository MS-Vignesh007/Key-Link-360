import React from "react";

export type KeyLogo3DSize = "xs" | "sm" | "md" | "lg" | "xl";

interface KeyLogo3DProps {
  size?: KeyLogo3DSize;
  showLabel?: boolean;
  className?: string;
  variant?: "icon" | "full" | "auto";
}

const SIZE_MAP: Record<KeyLogo3DSize, { iconHeight: string; fullHeight: string; text: string; sub: string }> = {
  xs: { iconHeight: "h-7 w-7", fullHeight: "h-8 w-8", text: "text-xs", sub: "text-[8px]" },
  sm: { iconHeight: "h-9 w-9", fullHeight: "h-10 w-10", text: "text-sm", sub: "text-[9px]" },
  md: { iconHeight: "h-11 w-11", fullHeight: "h-12 w-12", text: "text-base", sub: "text-[10px]" },
  lg: { iconHeight: "h-28 w-28 sm:h-32 sm:w-32", fullHeight: "h-28 w-28 sm:h-32 sm:w-32", text: "text-2xl", sub: "text-xs" },
  xl: { iconHeight: "h-40 w-40 sm:h-48 sm:w-48", fullHeight: "h-40 w-40 sm:h-48 sm:w-48", text: "text-4xl", sub: "text-sm" }
};

export default function KeyLogo3D({
  size = "md",
  showLabel = false,
  className = "",
  variant = "auto"
}: KeyLogo3DProps) {
  const { iconHeight, fullHeight, text } = SIZE_MAP[size];

  // Auto pick: lg and xl default to full 3D logo unless explicitly set to icon
  const useFullLogo = variant === "full" || (variant === "auto" && (size === "lg" || size === "xl") && !showLabel);

  if (useFullLogo) {
    return (
      <div className={`flex flex-col items-center justify-center select-none ${className}`}>
        <img
          src="/logo.png"
          alt="KEYLINK360"
          className={`${fullHeight} object-contain drop-shadow-[0_12px_28px_rgba(0,240,255,0.4)] transition-transform duration-300 hover:scale-105`}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Transparent Emblem Icon */}
      <img
        src="/logo-icon.png"
        alt="KEYLINK360 Logo"
        className={`${iconHeight} w-auto object-contain shrink-0 drop-shadow-[0_8px_16px_rgba(0,240,255,0.25)] transition-transform duration-300 hover:scale-105`}
        draggable={false}
      />

      {showLabel && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-sans font-black tracking-tight text-white uppercase drop-shadow-md ${text}`}
            style={{
              letterSpacing: "-0.02em"
            }}
          >
            KEYLINK<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">360</span>
          </span>
        </div>
      )}
    </div>
  );
}
