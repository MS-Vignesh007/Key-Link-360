import React, { useRef, useState, useEffect } from "react";
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Lock,
  RotateCw,
  Share2,
  Bookmark,
  Square,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Battery,
  Wifi,
  Signal,
  Flame,
  Cpu,
  Shield,
  Zap,
  Minus,
  X,
  Sparkles
} from "lucide-react";
import type { DeviceSpec, FrameMaterialFinish } from "../../data/deviceCatalog";
import { DEFAULT_DEVICE } from "../../data/deviceCatalog";

export interface DeviceMockupFrameProps {
  device?: DeviceSpec;
  zoom?: "fit" | number;
  displayUrl?: string;
  children: React.ReactNode;
  screenRef?: React.Ref<HTMLDivElement>;
  isDropTarget?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
  isLandscape?: boolean;
  customFinish?: string;
}

/**
 * High-Definition 4K Frame Style Engine
 * Produces ultra-crisp physical materials (Anodized Titanium, High-Gloss Polymer, Ceramic, Brushed Metal)
 */
export function get4KFrameStyle(finish: string = "titanium") {
  switch (finish) {
    case "copper-titanium":
      return {
        background:
          "linear-gradient(145deg, #9b7250 0%, #fae5d8 14%, #6b4329 32%, #dcb494 50%, #482510 68%, #fbf0e8 84%, #875333 100%)",
        borderColor: "#9c755c",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 230, 210, 0.45), inset 0 1px 2.5px rgba(255, 255, 255, 0.7), 0 0 35px rgba(176, 137, 104, 0.28)",
        buttonGradient: "linear-gradient(to bottom, #dcb494, #9b7250, #6b4329)",
        accentGlow: "rgba(220, 180, 148, 0.4)"
      };
    case "cosmic-violet":
      return {
        background:
          "linear-gradient(145deg, #4c1d95 0%, #c084fc 15%, #2e1065 34%, #a855f7 50%, #1e1b4b 68%, #e9d5ff 85%, #6b21a8 100%)",
        borderColor: "#7e22ce",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(216, 180, 254, 0.55), inset 0 1px 2.5px rgba(255, 255, 255, 0.7), 0 0 45px rgba(168, 85, 247, 0.4)",
        buttonGradient: "linear-gradient(to bottom, #c084fc, #7e22ce, #3b0764)",
        accentGlow: "rgba(168, 85, 247, 0.5)"
      };
    case "oceanic-blue":
      return {
        background:
          "linear-gradient(145deg, #1e3a8a 0%, #60a5fa 15%, #172554 34%, #3b82f6 50%, #0f172a 68%, #bfdbfe 85%, #1d4ed8 100%)",
        borderColor: "#2563eb",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(147, 197, 253, 0.55), inset 0 1px 2.5px rgba(255, 255, 255, 0.7), 0 0 45px rgba(59, 130, 246, 0.4)",
        buttonGradient: "linear-gradient(to bottom, #60a5fa, #2563eb, #172554)",
        accentGlow: "rgba(59, 130, 246, 0.5)"
      };
    case "emerald-green":
      return {
        background:
          "linear-gradient(145deg, #064e3b 0%, #34d399 15%, #022c22 34%, #10b981 50%, #064e3b 68%, #a7f3d0 85%, #047857 100%)",
        borderColor: "#059669",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(110, 231, 183, 0.55), inset 0 1px 2.5px rgba(255, 255, 255, 0.7), 0 0 45px rgba(16, 185, 129, 0.4)",
        buttonGradient: "linear-gradient(to bottom, #34d399, #059669, #022c22)",
        accentGlow: "rgba(16, 185, 129, 0.5)"
      };
    case "rose-gold":
      return {
        background:
          "linear-gradient(145deg, #9d174d 0%, #fbcfe8 15%, #700731 34%, #f472b6 50%, #4c0519 68%, #fce7f3 85%, #be185d 100%)",
        borderColor: "#db2777",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(251, 207, 232, 0.6), inset 0 1px 2.5px rgba(255, 255, 255, 0.8), 0 0 40px rgba(244, 114, 182, 0.35)",
        buttonGradient: "linear-gradient(to bottom, #fbcfe8, #db2777, #700731)",
        accentGlow: "rgba(244, 114, 182, 0.4)"
      };
    case "crimson-gloss":
      return {
        background:
          "linear-gradient(145deg, #991b1b 0%, #f87171 15%, #7f1d1d 34%, #ef4444 50%, #450a0a 68%, #fecaca 85%, #dc2626 100%)",
        borderColor: "#ef4444",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(254, 202, 202, 0.65), inset 0 1px 3px rgba(255, 255, 255, 0.9), 0 0 45px rgba(239, 68, 68, 0.45)",
        buttonGradient: "linear-gradient(to bottom, #f87171, #dc2626, #7f1d1d)",
        accentGlow: "rgba(239, 68, 68, 0.5)"
      };
    case "phantom-black":
      return {
        background:
          "linear-gradient(145deg, #090d16 0%, #334155 18%, #0f172a 40%, #1e293b 60%, #020617 80%, #475569 92%, #0f172a 100%)",
        borderColor: "#334155",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.35)",
        buttonGradient: "linear-gradient(to bottom, #475569, #1e293b, #0f172a)",
        accentGlow: "rgba(100, 116, 139, 0.3)"
      };
    case "ceramic-white":
      return {
        background:
          "linear-gradient(145deg, #cbd5e1 0%, #ffffff 20%, #e2e8f0 40%, #f8fafc 60%, #94a3b8 80%, #ffffff 92%, #cbd5e1 100%)",
        borderColor: "#cbd5e1",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.95), inset 0 1px 3.5px rgba(255, 255, 255, 0.98), 0 0 35px rgba(255, 255, 255, 0.3)",
        buttonGradient: "linear-gradient(to bottom, #ffffff, #cbd5e1, #94a3b8)",
        accentGlow: "rgba(255, 255, 255, 0.6)"
      };
    case "cyber-neon":
      return {
        background:
          "linear-gradient(145deg, #1e293b 0%, #facc15 16%, #0f172a 36%, #eab308 52%, #020617 70%, #fef08a 86%, #334155 100%)",
        borderColor: "#eab308",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(254, 240, 138, 0.65), inset 0 1px 2.5px rgba(255, 255, 255, 0.7), 0 0 45px rgba(234, 179, 8, 0.4)",
        buttonGradient: "linear-gradient(to bottom, #facc15, #eab308, #854d0e)",
        accentGlow: "rgba(234, 179, 8, 0.5)"
      };
    case "titanium":
    default:
      return {
        background:
          "linear-gradient(145deg, #475569 0%, #cbd5e1 16%, #334155 35%, #94a3b8 52%, #1e293b 70%, #cbd5e1 86%, #475569 100%)",
        borderColor: "#64748b",
        boxShadow:
          "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.35), inset 0 1px 2.5px rgba(255, 255, 255, 0.5)",
        buttonGradient: "linear-gradient(to bottom, #cbd5e1, #64748b, #334155)",
        accentGlow: "rgba(203, 213, 225, 0.3)"
      };
  }
}

export default function DeviceMockupFrame({
  device = DEFAULT_DEVICE,
  zoom = "fit",
  displayUrl = "localhost:3000",
  children,
  screenRef,
  isDropTarget,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  className = "",
  isLandscape = false,
  customFinish
}: DeviceMockupFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (typeof window !== "undefined") {
        setIsMobileScreen(window.innerWidth < 768);
      }
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Compute active 4K finish (custom override or device catalog finish)
  const activeFinish =
    customFinish && customFinish !== "auto"
      ? customFinish
      : device.materialFinish || "titanium";

  const finishStyle = get4KFrameStyle(activeFinish);

  // Only Mobiles and Tablets are allowed to rotate horizontally.
  // Laptops, Desktops, TV mockups and Curved monitors are strictly fixed in their natural horizontal orientation.
  const isRotatable =
    device.category === "apple" ||
    device.category === "android" ||
    device.category === "mobile" ||
    device.category === "tablets" ||
    device.category === "tablet";

  const effectiveLandscape = Boolean(isLandscape && isRotatable);

  // Compute width and height based on device & orientation
  const baseWidth = effectiveLandscape ? Math.max(device.width, device.height) : device.width;
  const baseHeight = effectiveLandscape ? Math.min(device.width, device.height) : device.height;

  // On Mobile Viewports (< 768px), bypass heavy 4K frames/bezels and render 1:1 native canvas directly
  if (isMobileScreen) {
    return (
      <div
        ref={containerRef}
        className={`key-mockup-stage key-mockup-stage--mobile-direct w-full h-full min-h-0 overflow-y-auto no-scrollbar relative select-none p-0 flex flex-col items-center justify-start ${className}`}
      >
        <div
          ref={screenRef}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="key-mockup-screen-mobile-direct w-full h-full min-h-full overflow-y-auto overflow-x-hidden no-scrollbar relative"
        >
          {children}
        </div>
      </div>
    );
  }

  // Frame type classifications
  const isLaptopAsusRog = device.frameType === "laptop-asus-rog";
  const isLaptopAsusTuf = device.frameType === "laptop-asus-tuf";
  const isLaptopMsi = device.frameType === "laptop-msi";
  const isLaptopMacRose = device.frameType === "laptop-macbook-rose";
  const isLaptopClassic =
    device.frameType === "laptop-macbook" || device.frameType === "laptop-dell";
  const isAnyLaptop =
    isLaptopAsusRog ||
    isLaptopAsusTuf ||
    isLaptopMsi ||
    isLaptopMacRose ||
    isLaptopClassic;

  const isDesktop = device.frameType === "desktop-imac";
  const isRogCurved = device.frameType === "desktop-curved-rog";
  const isXiaomiTv = device.frameType === "tv-xiaomi";
  const isTabletClassic = device.frameType === "tablet-classic";
  const isTablet = device.frameType === "tablet-ipad" || device.frameType === "tablet-android";
  const isFoldHinge = device.frameType === "fold-hinge";
  const isS24Ultra = device.frameType === "samsung-s24-ultra";
  const isIphoneTitanium = device.frameType === "iphone-titanium";

  // Calculate target physical frame dimensions
  let frameWidth = baseWidth;
  let frameHeight = baseHeight;

  if (isAnyLaptop) {
    // Laptops are never rotated
    frameWidth = Math.min(960, Math.max(760, device.width));
    frameHeight = Math.round(frameWidth * 0.62);
  } else if (isRogCurved) {
    frameWidth = Math.min(1080, Math.max(880, device.width));
    frameHeight = Math.round(frameWidth * 0.58);
  } else if (isXiaomiTv) {
    frameWidth = Math.min(1100, Math.max(880, device.width));
    frameHeight = Math.round(frameWidth * 0.58);
  } else if (isDesktop) {
    frameWidth = Math.min(1080, Math.max(820, device.width));
    frameHeight = Math.round(frameWidth * 0.62);
  } else if (isTablet || isTabletClassic) {
    if (effectiveLandscape) {
      frameWidth = Math.min(1040, Math.max(840, Math.max(device.width, device.height)));
      frameHeight = Math.min(740, Math.max(540, Math.min(device.width, device.height)));
    } else {
      frameWidth = Math.min(680, Math.min(device.width, device.height));
      frameHeight = Math.min(880, Math.max(device.width, device.height));
    }
  } else if (isFoldHinge) {
    if (effectiveLandscape) {
      frameWidth = Math.min(780, Math.max(620, Math.max(device.width, device.height)));
      frameHeight = Math.min(480, Math.max(380, Math.min(device.width, device.height)));
    } else {
      frameWidth = Math.min(430, baseWidth);
      const aspect = baseHeight / baseWidth;
      frameHeight = Math.round(frameWidth * aspect);
    }
  } else {
    // Flagship smartphone standard
    if (effectiveLandscape) {
      frameWidth = Math.min(844, Math.max(680, Math.max(device.width, device.height)));
      frameHeight = Math.min(430, Math.max(350, Math.min(device.width, device.height)));
    } else {
      frameWidth = Math.min(390, Math.min(device.width, device.height));
      const aspect = Math.max(1.8, Math.min(2.18, Math.max(device.width, device.height) / Math.min(device.width, device.height)));
      frameHeight = Math.round(frameWidth * aspect);
    }
  }

  // Calculate dynamic scale factor so devices always fit the screen vertically and horizontally
  let scale = 1;
  const availableWidth = Math.max(280, (containerSize.width || 800) - 56);
  const availableHeight = Math.max(360, (containerSize.height || 680) - 48);

  if (zoom === "fit") {
    const scaleX = availableWidth / (frameWidth + 40);
    const scaleY = availableHeight / (frameHeight + 56);
    scale = Math.min(1, Math.min(scaleX, scaleY));
  } else if (typeof zoom === "number") {
    scale = zoom;
  }

  const screenClass = `key-mockup-screen ${effectiveLandscape ? "key-mockup-screen--landscape" : "key-mockup-screen--portrait"} flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative`;

  return (
    <div
      ref={containerRef}
      data-orientation={effectiveLandscape ? "landscape" : "portrait"}
      className={`key-mockup-stage ${effectiveLandscape ? "key-mockup-stage--landscape" : "key-mockup-stage--portrait"} flex items-center justify-center w-full h-full min-h-[500px] max-h-full overflow-hidden p-2 relative select-none transition-all duration-300 ${className}`}
    >
      <div
        className="key-mockup-scaler transition-transform duration-200 origin-center flex items-center justify-center"
        style={{
          transform: `scale(${scale})`,
          width: `${frameWidth + 40}px`,
          height: `${frameHeight + 40}px`
        }}
      >
        {/* ========================================================================= */}
        {/* 1. ASUS ROG ZEPHYRUS G16 GAMING LAPTOP (4K Cyber Frame)                   */}
        {/* ========================================================================= */}
        {isLaptopAsusRog && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* Display Lid: NanoEdge 3-Sided Real Micro-Bezel (p-1.5) */}
            <div
              className="w-full rounded-t-xl p-1.5 bg-gradient-to-b from-[#181d28] via-[#10141e] to-black border-[2.5px] border-slate-700/90 shadow-2xl relative"
              style={{
                boxShadow:
                  "0 35px 85px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(239, 68, 68, 0.3), 0 0 30px -10px rgba(239, 68, 68, 0.25)"
              }}
            >
              {/* Webcam Cluster with Dual Mics & Privacy Shutter Notch */}
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 rounded-b-md bg-slate-900 border-x border-b border-slate-700/70 z-20">
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="h-1.5 w-1.5 rounded-full bg-black ring-1 ring-red-500/50" />
                <span className="h-1 w-1 rounded-full bg-slate-700" />
              </div>

              {/* Display Screen */}
              <div
                className="rounded-lg overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black"
                style={{ height: `${frameHeight - 70}px` }}
              >
                {/* 4K Glass Sheen Reflection Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.09] z-25" />

                {/* Windows Cyber Dark Browser Bar */}
                <div className="bg-[#121620] border-b border-slate-800/90 px-3.5 py-1.5 flex items-center justify-between gap-3 shrink-0 text-slate-300">
                  <div className="flex items-center gap-1.5 bg-[#1b2232] border border-slate-700/70 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-red-400 shadow-inner">
                    <Flame className="h-3 w-3 text-red-500 animate-pulse" />
                    <span>ROG 4K Studio</span>
                  </div>

                  <div className="flex-1 max-w-md bg-slate-950/90 border border-slate-800 rounded-md px-3 py-1 flex items-center justify-between gap-2 text-xs font-mono text-slate-200 shadow-inner">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="h-3 w-3 text-red-400 shrink-0" />
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <RotateCw className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Minus className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                    <Square className="h-3 w-3 hover:text-white cursor-pointer" />
                    <X className="h-3.5 w-3.5 hover:text-red-400 cursor-pointer" />
                  </div>
                </div>


                {/* Content Viewport */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* ASUS ROG Bottom Chin with Glowing ROG Eye */}
                <div className="h-6 bg-gradient-to-r from-[#0d1017] via-[#151a24] to-[#0d1017] flex items-center justify-between px-4 shrink-0 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-3.5 w-3.5 text-red-500 fill-red-500 filter drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                      viewBox="0 0 100 100"
                    >
                      <path d="M85,25 C65,30 45,55 35,75 C45,70 65,65 85,45 C80,45 70,50 60,60 C65,48 78,35 85,25 Z M15,40 C30,35 48,32 60,35 C45,38 32,45 25,58 C22,50 18,45 15,40 Z" />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 font-mono">
                      Republic of Gamers
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-red-400/90 uppercase font-bold tracking-wider">
                    Zephyrus G16
                  </span>
                </div>
              </div>
            </div>

            {/* ASUS ROG Cyber Base Deck with Red Exhaust Glow */}
            <div
              className="w-[106%] h-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-b-xl border-t border-slate-700/80 shadow-2xl relative flex justify-between items-center px-4"
              style={{
                boxShadow:
                  "0 25px 50px -10px rgba(0, 0, 0, 0.95), 0 4px 20px rgba(239, 68, 68, 0.2)"
              }}
            >
              <div className="w-16 h-1 bg-red-600/70 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <div className="w-24 h-1.5 bg-slate-950 rounded-b-md border-b border-red-500/40" />
              <div className="w-16 h-1 bg-red-600/70 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </div>
            <div className="w-[96%] h-2.5 bg-black/80 blur-sm rounded-full mt-0.5" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ASUS TUF GAMING A15 LAPTOP (4K Mecha Armor)                            */}
        {/* ========================================================================= */}
        {isLaptopAsusTuf && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* TUF Mecha-Gray Armored Display Lid (p-1.5 micro bezel) */}
            <div
              className="w-full rounded-t-xl p-1.5 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-950 border-[2.5px] border-slate-600 shadow-2xl relative"
              style={{
                boxShadow:
                  "0 35px 85px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(245, 158, 11, 0.3)"
              }}
            >
              <div className="absolute top-1 left-1.5 h-1.5 w-1.5 rounded-full bg-slate-500 border border-slate-400/80" />
              <div className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-500 border border-slate-400/80" />

              <div
                className="rounded-lg overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black"
                style={{ height: `${frameHeight - 70}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] z-25" />

                {/* Windows TUF Browser Header */}
                <div className="bg-[#151922] border-b border-slate-800 px-3.5 py-1.5 flex items-center justify-between gap-3 shrink-0 text-slate-300">
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 font-mono">
                    <Shield className="h-3 w-3 text-amber-400" />
                    <span>TUF Armor 4K</span>
                  </div>

                  <div className="flex-1 max-w-md bg-slate-950/90 border border-slate-800 rounded-md px-3 py-1 flex items-center justify-between gap-2 text-xs font-mono text-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <RotateCw className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Minus className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                    <Square className="h-3 w-3 hover:text-white cursor-pointer" />
                    <X className="h-3.5 w-3.5 hover:text-red-400 cursor-pointer" />
                  </div>
                </div>

                {/* Viewport */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* TUF Gaming Wings Emblem Chin */}
                <div className="h-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-between px-4 shrink-0 border-t border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M3 5h8v4H7v10H3V5zm10 0h8v14h-4V9h-4V5z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 font-mono">
                      TUF GAMING
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-amber-400/90 uppercase font-bold">
                    Military Grade 4K
                  </span>
                </div>
              </div>
            </div>

            {/* Armored Base */}
            <div
              className="w-[106%] h-4 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-b-xl border-t border-slate-500/80 shadow-2xl relative flex justify-between items-center px-6"
              style={{
                boxShadow: "0 25px 50px -10px rgba(0, 0, 0, 0.95)"
              }}
            >
              <div className="w-12 h-1 bg-slate-900 rounded-full" />
              <div className="w-24 h-1.5 bg-slate-900 rounded-b-md border-b border-amber-500/50" />
              <div className="w-12 h-1 bg-slate-900 rounded-full" />
            </div>
            <div className="w-[96%] h-2.5 bg-black/80 blur-sm rounded-full mt-0.5" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MSI RAIDER / STEALTH GAMING LAPTOP (4K Stealth Matrix)                  */}
        {/* ========================================================================= */}
        {isLaptopMsi && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* MSI Stealth Core-Black Display Lid (p-1.5 micro bezel) */}
            <div
              className="w-full rounded-t-xl p-1.5 bg-gradient-to-b from-[#161a22] via-[#0d1017] to-black border-[2.5px] border-slate-700 shadow-2xl relative"
              style={{
                boxShadow:
                  "0 35px 85px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(220, 38, 38, 0.3)"
              }}
            >
              <div
                className="rounded-lg overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black"
                style={{ height: `${frameHeight - 70}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.09] z-25" />

                {/* Windows MSI Browser Header */}
                <div className="bg-[#12151d] border-b border-slate-800 px-3.5 py-1.5 flex items-center justify-between gap-3 shrink-0 text-slate-300">
                  <div className="flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-rose-400 font-mono">
                    <Zap className="h-3 w-3 text-rose-500" />
                    <span>MSI Center 4K</span>
                  </div>

                  <div className="flex-1 max-w-md bg-slate-950/90 border border-slate-800 rounded-md px-3 py-1 flex items-center justify-between gap-2 text-xs font-mono text-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="h-3 w-3 text-rose-400 shrink-0" />
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <RotateCw className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Minus className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                    <Square className="h-3 w-3 hover:text-white cursor-pointer" />
                    <X className="h-3.5 w-3.5 hover:text-red-400 cursor-pointer" />
                  </div>
                </div>

                {/* Viewport */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* MSI Dragon Crest Shield Chin */}
                <div className="h-6 bg-gradient-to-r from-slate-950 via-[#161a24] to-slate-950 flex items-center justify-between px-4 shrink-0 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-red-500 fill-current filter drop-shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.1-2.56 7.8-6 8.78-3.44-.98-6-4.68-6-8.78V6.43l6-2.25z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 font-mono">
                      MSI GAMING
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-rose-400/90 font-bold uppercase">
                    Raider GE78 4K
                  </span>
                </div>
              </div>
            </div>

            {/* MSI Aurora Matrix RGB Deck Bar */}
            <div
              className="w-[106%] h-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-b-xl border-t border-slate-700 shadow-2xl relative flex justify-center items-center px-4"
              style={{
                boxShadow:
                  "0 25px 50px -10px rgba(0, 0, 0, 0.95), 0 0 20px rgba(220, 38, 38, 0.25)"
              }}
            >
              <div className="w-full h-1 bg-gradient-to-r from-red-500 via-amber-400 to-indigo-500 rounded-full opacity-80 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <div className="absolute w-24 h-1.5 bg-slate-950 rounded-b-md" />
            </div>
            <div className="w-[96%] h-2.5 bg-black/80 blur-sm rounded-full mt-0.5" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MACBOOK NEO 2026 ROSE GOLD & CLASSIC MACBOOK (4K Ultra-Thin Bezel)     */}
        {/* ========================================================================= */}
        {(isLaptopMacRose || isLaptopClassic) && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* Display Lid: Rose Gold or Space Gray with real 4K micro-bezel (p-1.5) */}
            <div
              className={`w-full rounded-t-2xl p-1.5 shadow-2xl relative ${
                isLaptopMacRose
                  ? "bg-gradient-to-b from-[#fad5cc] via-[#e5b3a6] to-[#ba7e70] border-[2.5px] border-[#d89e90]"
                  : "bg-gradient-to-b from-slate-800 via-slate-900 to-black border-[2.5px] border-slate-700/80"
              }`}
              style={{
                boxShadow:
                  "0 35px 80px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.15)"
              }}
            >
              <div
                className="rounded-xl overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black"
                style={{ height: `${frameHeight - 68}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.09] z-25" />

                {/* Safari Browser Header Bar */}
                <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-4 shrink-0 select-none text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/90" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/90" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/90" />
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-slate-500">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 max-w-md bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-200 shadow-inner">
                    <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                    <RotateCw className="h-3 w-3 text-slate-400 hover:text-white ml-auto cursor-pointer" />
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <Share2 className="h-3.5 w-3.5" />
                  </div>
                </div>


                {/* Content Viewport */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* Bottom Bezel with MacBook Typography */}
                <div className="h-5 bg-black flex items-center justify-center shrink-0 border-t border-white/[0.04]">
                  <span className="text-[10px] font-sans font-medium tracking-wider text-slate-400 select-none">
                    {isLaptopMacRose ? "MacBook Neo 4K" : device.name.includes("Air") ? "MacBook Air" : "MacBook Pro"}
                  </span>
                </div>
              </div>
            </div>

            {/* Aluminum Keyboard Base & Hinge */}
            <div
              className={`w-[105%] h-3.5 rounded-b-xl shadow-2xl relative flex justify-center items-center ${
                isLaptopMacRose
                  ? "bg-gradient-to-b from-[#e5b3a6] via-[#c98e80] to-[#aa6e60] border-t border-[#f2c0b4]"
                  : "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-t border-slate-500/80"
              }`}
              style={{
                boxShadow: "0 25px 50px -10px rgba(0, 0, 0, 0.9)"
              }}
            >
              <div className="w-24 h-1.5 bg-slate-950/90 rounded-b-md" />
            </div>
            <div className="w-[96%] h-2 bg-black/60 blur-sm rounded-full mt-0.5" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SAMSUNG GALAXY S24 ULTRA (4K Sharp Titanium Boxy Silhouette)           */}
        {/* Real 1.4mm razor bezel, 90-degree square edges, center punch hole        */}
        {/* ========================================================================= */}
        {isS24Ultra && (
          <div
            className="key-mockup-mobile relative rounded-none p-2 shadow-2xl border-[3px] text-slate-100 transition-all duration-300 animate-in zoom-in-95"
            style={{
              width: `${frameWidth}px`,
              background: finishStyle.background,
              borderColor: finishStyle.borderColor,
              boxShadow: finishStyle.boxShadow
            }}
          >
            {/* Top Antenna Breaks */}
            <div className="absolute top-0 left-12 w-1 h-[3px] bg-slate-950" />
            <div className="absolute top-0 right-12 w-1 h-[3px] bg-slate-950" />

            {/* Right Side Physical Metal Buttons (Volume & Power) */}
            <div
              className="absolute -right-[5.5px] top-28 w-[3.5px] h-16 rounded-r-xs shadow-md"
              style={{ background: finishStyle.buttonGradient }}
            />
            <div
              className="absolute -right-[5.5px] top-48 w-[3.5px] h-10 rounded-r-xs shadow-md"
              style={{ background: finishStyle.buttonGradient }}
            />

            {/* Bottom S-Pen Silo Clicker Indicator */}
            <div className="absolute -bottom-[2px] left-5 w-3 h-1 bg-slate-900 rounded-t-xs border-t border-slate-700" />

            {/* Inner Screen Chassis: 1.4mm razor micro-bezel with rounded-[6px] display glass */}
            <div
              className="relative rounded-[6px] overflow-hidden bg-slate-950 flex flex-col shadow-inner ring-1 ring-black border border-black/80"
              style={{ height: `${frameHeight - 20}px` }}
            >
              {/* 4K Glass Sheen Reflection Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] z-25" />

              {/* Android S24 Top Status Bar */}
              <div className="relative z-30 h-8 bg-black flex items-center justify-between px-4 select-none shrink-0 border-b border-white/[0.04]">
                <span className="text-[11px] font-bold text-white/90 font-mono tracking-tight">
                  2:01 AM
                </span>

                {/* Centered Optical Punch-Hole Camera with 4K Anti-Reflective Lens Coating */}
                <div className="h-3.5 w-3.5 rounded-full bg-black ring-1 ring-slate-700/90 flex items-center justify-center shadow-inner">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-950 ring-1 ring-cyan-400/30" />
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-mono">
                  <Signal className="h-2.5 w-2.5" />
                  <Wifi className="h-2.5 w-2.5" />
                  <div className="flex items-center gap-0.5">
                    <span>100%</span>
                    <Battery className="h-3 w-3 text-emerald-400" />
                  </div>
                </div>
              </div>


              {/* Content Viewport */}
              <div
                ref={screenRef}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={screenClass}
              >
                {children}
              </div>

              {/* Android S24 Chrome Navigation Bar (Screenshot 5) */}
              <div className="relative z-20 bg-black px-3.5 py-1.5 flex flex-col shrink-0 border-t border-slate-900 gap-1">
                <div className="h-7 bg-slate-900 border border-slate-800 rounded-lg px-3 flex items-center justify-between text-[11px] text-slate-300 font-mono shadow-inner">
                  <div className="flex items-center gap-1.5 truncate">
                    <Lock className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <RotateCw className="h-3 w-3 cursor-pointer hover:text-white" />
                    <span className="h-3.5 w-3.5 rounded-xs border border-slate-700 flex items-center justify-center text-[9px] font-bold">
                      1
                    </span>
                  </div>
                </div>

                {/* Android Navigation Gesture Line */}
                <div className="h-2 flex items-center justify-center">
                  <div className="w-28 h-1 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. FOLDABLE DEVICES WITH 4K MECHANICAL CHROME HINGE SPINE                 */}
        {/* iPhone Duo folded & Pixel 10 Fold folded                                  */}
        {/* ========================================================================= */}
        {isFoldHinge && (
          <div
            className="key-mockup-mobile relative rounded-r-[2.8rem] rounded-l-[4px] p-2 pl-6 shadow-2xl border-[3px] text-slate-100 transition-all duration-300 animate-in zoom-in-95 flex items-stretch"
            style={{
              width: `${frameWidth}px`,
              background: finishStyle.background,
              borderColor: finishStyle.borderColor,
              boxShadow: finishStyle.boxShadow
            }}
          >
            {/* Exposed Mechanical Chrome Hinge Spine along Left Edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-5 rounded-l-[2px] flex flex-col justify-between items-center py-4 z-30 border-r border-black/80"
              style={{
                background:
                  "linear-gradient(to right, #475569 0%, #cbd5e1 25%, #f8fafc 45%, #94a3b8 72%, #334155 100%)",
                boxShadow: "inset 0 0 5px rgba(0, 0, 0, 0.65)"
              }}
            >
              <div className="w-3.5 h-3 rounded-xs bg-gradient-to-b from-slate-400 to-slate-700 border border-slate-900" />
              <div className="w-[1.5px] h-24 bg-slate-900/60 rounded-full" />
              <div className="w-[1.5px] h-24 bg-slate-900/60 rounded-full" />
              <div className="w-3.5 h-3 rounded-xs bg-gradient-to-b from-slate-700 to-slate-400 border border-slate-900" />
            </div>

            {/* Right Side Physical Buttons */}
            <div
              className="absolute -right-[5.5px] top-24 w-[3.5px] h-14 rounded-r-xs shadow-md"
              style={{ background: finishStyle.buttonGradient }}
            />
            <div
              className="absolute -right-[5.5px] top-42 w-[3.5px] h-10 rounded-r-xs shadow-md"
              style={{ background: finishStyle.buttonGradient }}
            />

            {/* Inner Screen Chassis */}
            <div
              className="relative w-full rounded-r-[2.4rem] rounded-l-[2px] overflow-hidden bg-slate-950 flex flex-col shadow-inner ring-1 ring-black border border-black/80"
              style={{ height: `${frameHeight - 20}px` }}
            >
              {/* 4K Glass Sheen */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.10] z-25" />

              {/* Top Status Bar: iOS or Android Fold */}
              <div className="relative z-30 h-9 bg-black flex items-center justify-between px-5 select-none shrink-0 border-b border-white/[0.04]">
                <span className="text-[11px] font-bold text-white/90 font-mono">
                  {device.os === "iOS" ? "9:41" : "2:01 AM"}
                </span>

                {device.os === "iOS" ? (
                  <div className="h-5 w-24 rounded-full bg-black ring-1 ring-white/20 flex items-center justify-between px-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                ) : (
                  <div className="h-3 w-3 rounded-full bg-black ring-1 ring-slate-700 flex items-center justify-center">
                    <span className="h-1 w-1 rounded-full bg-indigo-950" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-white/90">
                  <Signal className="h-2.5 w-2.5" />
                  <Wifi className="h-2.5 w-2.5" />
                  <Battery className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Viewport */}
              <div
                ref={screenRef}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={screenClass}
              >
                {children}
              </div>

              {/* Bottom Browser Bar */}
              <div className="relative z-20 bg-slate-950/95 border-t border-slate-800/80 px-4 py-1.5 flex flex-col shrink-0 gap-1">
                <div className="h-7 bg-slate-900 border border-slate-800 rounded-xl px-3 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <Lock className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                  <RotateCw className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer" />
                </div>
                <div className="h-2 flex items-center justify-center">
                  <div className="w-28 h-1 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. APPLE IPHONE TITANIUM & 4K FLAGSHIPS (Screenshot 1 & 3)                */}
        {/* Real 1.2mm ultra-thin razor bezel, Dynamic Island, 4K Glass Sheen         */}
        {/* ========================================================================= */}
        {!isAnyLaptop && !isDesktop && !isRogCurved && !isXiaomiTv && !isTablet && !isTabletClassic && !isS24Ultra && !isFoldHinge && (
          <div
            className="key-mockup-mobile relative rounded-[3.2rem] p-2 shadow-2xl text-slate-100 transition-all duration-300 animate-in zoom-in-95 border-[3px]"
            style={{
              width: `${frameWidth}px`,
              background: finishStyle.background,
              borderColor: finishStyle.borderColor,
              boxShadow: finishStyle.boxShadow
            }}
          >
            {/* Left Hardware Buttons: Action Button + Volume Up + Volume Down (hidden in landscape) */}
            {!effectiveLandscape && (
              <>
                <div
                  className="absolute -left-[5.5px] top-22 w-[3.5px] h-7 rounded-l-xs shadow-md"
                  style={{ background: finishStyle.buttonGradient }}
                />
                <div
                  className="absolute -left-[5.5px] top-34 w-[3.5px] h-12 rounded-l-xs shadow-md"
                  style={{ background: finishStyle.buttonGradient }}
                />
                <div
                  className="absolute -left-[5.5px] top-50 w-[3.5px] h-12 rounded-l-xs shadow-md"
                  style={{ background: finishStyle.buttonGradient }}
                />
              </>
            )}

            {/* Right Hardware Buttons: Power / Siri + Flush Camera Control (hidden in landscape) */}
            {!effectiveLandscape && (
              <>
                <div
                  className="absolute -right-[5.5px] top-32 w-[3.5px] h-16 rounded-r-xs shadow-md"
                  style={{ background: finishStyle.buttonGradient }}
                />
                <div className="absolute -right-[4px] bottom-32 w-[2px] h-14 bg-slate-400/80 rounded-r-xs border border-white/20" />
              </>
            )}

            {/* Inner Screen Chassis: 1.2mm razor bezel (rounded-[2.8rem]) */}
            <div
              className={`relative ${effectiveLandscape ? "rounded-[2rem]" : "rounded-[2.8rem]"} overflow-hidden bg-slate-950 flex flex-col shadow-inner ring-1 ring-black border border-black/80`}
              style={{ height: `${frameHeight - (effectiveLandscape ? 12 : 20)}px` }}
            >
              {/* 4K Glass Sheen Top Reflection Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] z-25 rounded-[2.8rem]" />

              {/* Dynamic Island Header for iPhone */}
              {(device.frameType === "iphone-titanium" ||
                device.frameType === "iphone-island" ||
                device.os === "iOS") && (
                <div className={`relative z-30 ${effectiveLandscape ? "h-7 px-4" : "h-11 px-6"} bg-black flex items-center justify-between select-none shrink-0 border-b border-white/[0.04]`}>
                  <span className={`${effectiveLandscape ? "text-[10px]" : "text-[12px]"} font-bold tracking-tight text-white/90 font-mono`}>
                    1:59 AM
                  </span>
                  {/* Dynamic Island Pill with 4K camera optics */}
                  <div className={`${effectiveLandscape ? "h-4.5 w-20" : "h-6 w-28"} rounded-full bg-black ring-1 ring-white/15 flex items-center justify-between px-2 shadow-inner`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-950 border border-white/20" />
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 ${effectiveLandscape ? "text-[9px]" : "text-[11px]"} text-white/90`}>
                    <Signal className="h-2.5 w-2.5" />
                    <Wifi className="h-2.5 w-2.5" />
                    <Battery className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              {/* Android Punch Hole Header */}
              {device.os === "Android" && (
                <div className="relative z-30 h-8 bg-black flex items-center justify-between px-4 select-none shrink-0 border-b border-white/[0.04]">
                  <span className="text-[11px] font-semibold text-white/90 font-mono">2:01 AM</span>
                  <div className="h-3.5 w-3.5 rounded-full bg-black ring-2 ring-slate-800 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/90">
                    <span>100%</span>
                    <Battery className="h-3 w-3 text-emerald-400" />
                  </div>
                </div>
              )}


              {/* Screen Viewport Content */}
              <div
                ref={screenRef}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={screenClass}
              >
                {children}
              </div>

              {/* iPhone Safari Bottom Navigation Bar (Screenshot 1 & 3) */}
              {device.os === "iOS" && (
                <div className="relative z-20 bg-slate-950/95 border-t border-slate-800/80 px-4 py-1.5 flex flex-col shrink-0 backdrop-blur-md gap-1">
                  {/* Floating Address Pill */}
                  <div className="h-7 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 flex items-center justify-between text-[11px] text-slate-300 font-mono shadow-inner">
                    <span className="text-[10px] text-slate-500 font-sans">AA</span>
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <RotateCw className="h-3 w-3 text-slate-400 hover:text-white transition-colors cursor-pointer" />
                  </div>

                  {/* Safari Controls */}
                  <div className="flex items-center justify-between text-slate-400 px-2 pt-0.5">
                    <ChevronLeft className="h-4 w-4 cursor-pointer hover:text-white" />
                    <ChevronRight className="h-4 w-4 cursor-pointer hover:text-white" />
                    <Share2 className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                    <Bookmark className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                    <Square className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                  </div>

                  {/* Home Bar Indicator */}
                  <div className="h-2 flex items-center justify-center mt-0.5">
                    <div className="w-32 h-1 bg-white/40 rounded-full" />
                  </div>
                </div>
              )}

              {/* Android Bottom Bar */}
              {device.os === "Android" && (
                <div className="relative z-20 bg-black px-4 py-1.5 flex flex-col shrink-0 border-t border-slate-900 gap-1">
                  <div className="h-7 bg-slate-900 border border-slate-800 rounded-lg px-3 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <RotateCw className="h-3 w-3 text-slate-400 cursor-pointer" />
                  </div>
                  <div className="h-2 flex items-center justify-center">
                    <div className="w-28 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8A. MODERN TABLET: IPAD PRO 11" & ANDROID TABLET (4K Symmetrical Bezel)   */}
        {/* ========================================================================= */}
        {isTablet && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* iPad Pro Symmetrical 8mm Bezel */}
            <div
              className="w-full rounded-[2rem] p-2.5 shadow-2xl border-[3px] relative"
              style={{
                background: finishStyle.background,
                borderColor: finishStyle.borderColor,
                boxShadow: finishStyle.boxShadow
              }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-slate-900 ring-1 ring-white/10" />

              <div
                className="rounded-[1.5rem] overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black border border-black/80"
                style={{ height: `${frameHeight - 34}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] z-25" />

                {/* Tablet Browser Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 max-w-sm bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-300 shadow-inner">
                    <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{device.name}</span>
                </div>

                {/* Viewport */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* Home Bar */}
                <div className="h-3.5 bg-black flex items-center justify-center shrink-0">
                  <div className="w-36 h-1 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8B. CLASSIC TABLET: IPAD CLASSIC & GALAXY TAB (Prominent Top & Bottom Bezels) */}
        {/* ========================================================================= */}
        {isTabletClassic && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* Classic Tablet Chassis with Prominent Forehead and Chin Bezels */}
            <div
              className="w-full rounded-[2.2rem] p-3 shadow-2xl border-[3px] relative flex flex-col"
              style={{
                background: finishStyle.background,
                borderColor: finishStyle.borderColor,
                boxShadow: finishStyle.boxShadow
              }}
            >
              {/* Prominent Top Forehead Bezel with Camera & Sensor */}
              <div className="h-10 w-full flex items-center justify-center gap-2 shrink-0 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900 ring-1 ring-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-black ring-1 ring-slate-700/80 flex items-center justify-center">
                  <span className="h-1 w-1 rounded-full bg-indigo-950" />
                </span>
              </div>

              {/* Display Screen Viewport */}
              <div
                className="rounded-lg overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black border border-black/80"
                style={{ height: `${frameHeight - 96}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] z-25" />

                {/* Tablet Browser Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 max-w-sm bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-300 shadow-inner">
                    <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{device.name}</span>
                </div>

                {/* Viewport Content */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>
              </div>

              {/* Prominent Bottom Chin Bezel with Tactile Physical Circular Home Button */}
              <div className="h-12 w-full flex items-center justify-center shrink-0">
                <div
                  className="h-8 w-8 rounded-full bg-slate-950 border border-slate-700/90 shadow-inner flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
                  style={{
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 0 1.5px rgba(255, 255, 255, 0.25)"
                  }}
                >
                  <div className="h-3 w-3 rounded-xs border border-slate-600/80" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9A. DESKTOP: IMAC 24" & STUDIO DISPLAY                                    */}
        {/* ========================================================================= */}
        {isDesktop && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            <div
              className="w-full rounded-2xl p-2.5 bg-slate-950 border-[2.5px] border-slate-700 shadow-2xl relative"
              style={{
                boxShadow:
                  "0 35px 80px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)"
              }}
            >
              <div
                className="rounded-xl overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black"
                style={{ height: `${frameHeight - 70}px` }}
              >
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 max-w-lg bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-300 shadow-inner">
                    <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                  <span className="text-xs text-indigo-400 font-mono font-bold">{device.name}</span>
                </div>

                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>
              </div>

              {/* iMac Chin */}
              <div className="h-6 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-b-lg mt-1" />
            </div>

            {/* Stand */}
            <div className="w-32 h-10 bg-gradient-to-b from-slate-600 to-slate-800 shadow-md" />
            <div className="w-48 h-2.5 bg-slate-700 rounded-t-md shadow-xl" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9B. ASUS ROG CURVED GAMING MONITOR 34" (Republic of Gamers Brand & Stand) */}
        {/* ========================================================================= */}
        {isRogCurved && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* Curved Monitor Frame with Panoramic Arc Styling */}
            <div
              className="w-full rounded-2xl p-2.5 shadow-2xl border-[3px] relative"
              style={{
                background: finishStyle.background,
                borderColor: finishStyle.borderColor,
                boxShadow:
                  "0 35px 95px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(239, 68, 68, 0.35), 0 0 45px rgba(239, 68, 68, 0.25)"
              }}
            >
              {/* Display Screen */}
              <div
                className="rounded-xl overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black border border-black/80"
                style={{ height: `${frameHeight - 70}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.09] z-25" />

                {/* Curved Panoramic Cyber Header */}
                <div className="bg-[#121620] border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-4 shrink-0 text-slate-300">
                  <div className="flex items-center gap-2 bg-[#1c2232] border border-slate-700/80 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-red-400 shadow-inner">
                    <Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                    <span>ROG SWIFT 34&quot; 1800R CURVED</span>
                  </div>

                  <div className="flex-1 max-w-lg bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-between gap-2 text-xs font-mono text-slate-200 shadow-inner">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <RotateCw className="h-3.5 w-3.5 text-slate-400 hover:text-white cursor-pointer shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Minus className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                    <Square className="h-3 w-3 hover:text-white cursor-pointer" />
                    <X className="h-3.5 w-3.5 hover:text-red-400 cursor-pointer" />
                  </div>
                </div>

                {/* Screen Viewport */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* ASUS ROG Curved Bottom Chin with Glowing Eye & Brand Name */}
                <div className="h-7 bg-gradient-to-r from-[#0d1017] via-[#161a24] to-[#0d1017] flex items-center justify-between px-6 shrink-0 border-t border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <svg
                      className="h-4 w-4 text-red-500 fill-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]"
                      viewBox="0 0 100 100"
                    >
                      <path d="M85,25 C65,30 45,55 35,75 C45,70 65,65 85,45 C80,45 70,50 60,60 C65,48 78,35 85,25 Z M15,40 C30,35 48,32 60,35 C45,38 32,45 25,58 C22,50 18,45 15,40 Z" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-200 font-mono">
                      REPUBLIC OF GAMERS
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider">
                    <span>175Hz OLED</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-black text-[8px]">
                      ROG SWIFT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ASUS ROG Cyber Tripod Metal Stand */}
            <div className="flex flex-col items-center relative">
              {/* Stand Column with Red Cyber Accent */}
              <div className="w-14 h-12 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-x border-slate-600 shadow-xl relative flex justify-center items-center">
                <div className="w-1.5 h-7 bg-red-600 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>
              {/* Central Glowing LED Projection Ring */}
              <div className="w-10 h-2 bg-red-600/80 rounded-full blur-[2px] -mb-1 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
              {/* Heavy-Duty Tri-Wing Aluminum Base Legs */}
              <div className="w-72 h-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-t-md border-t border-slate-500 shadow-2xl flex justify-between px-4">
                <div className="w-10 h-1.5 bg-slate-950 rounded-b" />
                <div className="w-16 h-1.5 bg-red-600/50 rounded-b shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <div className="w-10 h-1.5 bg-slate-950 rounded-b" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9C. XIAOMI MI TV 4K 55" (Metallic Frame, Illuminated "mi" Logo, Branch Feet) */}
        {/* ========================================================================= */}
        {isXiaomiTv && (
          <div
            className="flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            style={{ width: `${frameWidth}px` }}
          >
            {/* TV Screen Outer Frame */}
            <div
              className="w-full rounded-lg p-2 shadow-2xl border-[3px] relative"
              style={{
                background: finishStyle.background,
                borderColor: finishStyle.borderColor,
                boxShadow: finishStyle.boxShadow
              }}
            >
              {/* Display Viewport */}
              <div
                className="rounded-md overflow-hidden bg-slate-950 flex flex-col relative ring-1 ring-black border border-black/80"
                style={{ height: `${frameHeight - 65}px` }}
              >
                {/* 4K Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] z-25" />

                {/* Android TV Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-1.5 py-0.2 rounded bg-orange-600 text-white font-mono shadow-xs">
                      mi
                    </span>
                    <span className="text-xs font-bold text-slate-200">Xiaomi PatchWall 4K</span>
                  </div>
                  <div className="flex-1 max-w-lg bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-300 shadow-inner">
                    <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                  <span className="text-xs text-orange-400 font-mono font-bold">55&quot; UHD</span>
                </div>

                {/* Screen Content */}
                <div
                  ref={screenRef}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={screenClass}
                >
                  {children}
                </div>

                {/* Bottom TV Bezel with Illuminated Metallic "mi" Brand Logo */}
                <div className="h-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative shrink-0 border-t border-slate-800/80">
                  {/* Central "mi" Metallic Brand Logo Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-0.5 rounded bg-slate-950 border border-slate-700/80 shadow-inner">
                    <span className="text-[10px] font-black tracking-tight text-white/95 font-sans">
                      mi
                    </span>
                    {/* White LED Power Glow Indicator */}
                    <span className="h-1 w-1 rounded-full bg-white shadow-[0_0_4px_#ffffff] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Metallic Branch Stand Feet (Left & Right) */}
            <div className="w-[90%] flex justify-between items-start -mt-0.5 px-6">
              {/* Left Branch Foot */}
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-5 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-xs shadow-md" />
                <div className="w-14 h-2 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 rounded-sm shadow-xl" />
              </div>
              {/* Right Branch Foot */}
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-5 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-xs shadow-md" />
                <div className="w-14 h-2 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 rounded-sm shadow-xl" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
