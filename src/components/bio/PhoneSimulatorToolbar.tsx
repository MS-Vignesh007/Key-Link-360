import React, { useState } from "react";
import {
  X,
  Smartphone,
  Info,
  ZoomIn,
  Target,
  Puzzle,
  Share2,
  HelpCircle,
  Settings,
  RotateCw,
  Palette,
  Check,
  Maximize2
} from "lucide-react";
import { FRAME_FINISHES_4K, type DeviceSpec } from "../../data/deviceCatalog";
import type { DeviceTargetScope } from "../../types";

interface PhoneSimulatorToolbarProps {
  selectedDevice: DeviceSpec;
  onOpenDeviceDrawer: () => void;
  isDeviceDrawerOpen: boolean;
  isPreviewMode: boolean;
  onTogglePreviewMode: () => void;
  onCloseToolbar?: () => void;
  deviceScope?: DeviceTargetScope;
  onChangeDeviceScope?: (scope: DeviceTargetScope) => void;
  zoom: "fit" | number;
  onChangeZoom: (z: "fit" | number) => void;
  onScreenshot?: () => void;
  onShare?: () => void;
  onOpenThemePicker?: () => void;
  isLandscape?: boolean;
  onToggleOrientation?: () => void;
  activeThemeSwatch?: string;
  activeFrameFinish?: string;
  onSelectFrameFinish?: (finish: string) => void;
}

export default function PhoneSimulatorToolbar({
  selectedDevice,
  onOpenDeviceDrawer,
  isDeviceDrawerOpen,
  isPreviewMode,
  onTogglePreviewMode,
  onCloseToolbar,
  deviceScope = "auto_adaptive",
  onChangeDeviceScope,
  zoom,
  onChangeZoom,
  onScreenshot,
  onShare,
  onOpenThemePicker,
  isLandscape,
  onToggleOrientation,
  activeThemeSwatch = "#6366f1",
  activeFrameFinish = "auto",
  onSelectFrameFinish
}: PhoneSimulatorToolbarProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showFinishes, setShowFinishes] = useState(false);
  const [showScopePopover, setShowScopePopover] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard?.writeText?.(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const cycleZoom = () => {
    if (zoom === "fit") onChangeZoom(0.75);
    else if (zoom === 0.75) onChangeZoom(1);
    else onChangeZoom("fit");
  };

  return (
    <aside
      className="hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl py-2.5 px-1.5 shadow-2xl shadow-black/60 text-slate-300 select-none space-y-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Close Toolbar Button (X button) */}
      <button
        type="button"
        onClick={() => {
          if (onCloseToolbar) {
            onCloseToolbar();
          } else {
            onTogglePreviewMode();
          }
        }}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        title="Close Preview Toolbar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="w-5 h-[1px] bg-slate-800 my-0.5" />

      {/* 2. Device Switcher Button */}
      <div className="relative">
        <button
          type="button"
          onClick={onOpenDeviceDrawer}
          className={`p-2 rounded-xl transition-all cursor-pointer relative ${
            isDeviceDrawerOpen
              ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30 scale-105"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
          title="Visible Devices in the Tab (Switch Phone, Laptop, Tablet)"
        >
          <div className="relative">
            <Smartphone className="h-4 w-4" />
            <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-xs border border-slate-900 bg-cyan-400" />
          </div>
        </button>
      </div>

      {/* 3. Target Devices & Responsive Layout Scope Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowScopePopover(!showScopePopover)}
          className={`p-2 rounded-xl transition-all cursor-pointer relative ${
            showScopePopover
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Target Devices & Scope (Mobile, Tablet, All Screens)"
        >
          <Target className="h-4 w-4 text-emerald-400" />
        </button>

        {showScopePopover && (
          <div className="absolute right-12 top-0 z-50 w-64 p-3 bg-slate-950/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs text-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Target className="h-4 w-4 text-emerald-400" />
                <span>Target Devices Scope</span>
              </div>
              <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/20">
                Publish Scope
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Select which devices this page is targeted for before publishing:
            </p>
            <div className="space-y-1.5 pt-1">
              {[
                {
                  id: "mobile_only" as DeviceTargetScope,
                  title: "Mobile Only",
                  desc: "Optimized exclusively for smartphones",
                  icon: "📱"
                },
                {
                  id: "mobile_tablet" as DeviceTargetScope,
                  title: "Mobile + Tablet Only",
                  desc: "Responsive for handhelds & tablets",
                  icon: "📱📟"
                },
                {
                  id: "all_devices" as DeviceTargetScope,
                  title: "All Screens (Desktop + TV + Tablet + Mobile)",
                  desc: "Full responsive layout across all screens",
                  icon: "🖥️📺"
                }
              ].map((opt) => {
                const isSelected = deviceScope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChangeDeviceScope?.(opt.id);
                      setShowScopePopover(false);
                    }}
                    className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-emerald-950/60 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/40"
                        : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-base shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate leading-tight">
                          {opt.title}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate leading-tight">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Device Specs Info Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            showInfo ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Device Specifications"
        >
          <Info className="h-4 w-4" />
        </button>

        {showInfo && (
          <div className="absolute right-12 top-0 z-50 w-52 p-3 bg-slate-950/98 border border-slate-700/90 rounded-xl shadow-2xl backdrop-blur-2xl text-[11px] text-slate-200 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-1 text-white">
              <span>{selectedDevice.name}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                {selectedDevice.os}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Resolution:</span>
              <span className="font-mono text-slate-200">
                {selectedDevice.width} × {selectedDevice.height} px
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pixel Ratio:</span>
              <span className="font-mono text-slate-200">{selectedDevice.dpr}x DPR</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Frame Style:</span>
              <span className="font-mono text-cyan-400 uppercase text-[9px]">
                {selectedDevice.frameType}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Zoom Magnifier Button */}
      <button
        type="button"
        onClick={cycleZoom}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer group relative"
        title={`Zoom: ${zoom === "fit" ? "Fit to Screen" : `${Math.round(zoom * 100)}%`} (Click to cycle)`}
      >
        <ZoomIn className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 text-[8px] font-bold font-mono bg-slate-800 text-indigo-300 px-0.5 rounded border border-slate-700">
          {zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`}
        </span>
      </button>

      <div className="w-5 h-[1px] bg-slate-800 my-0.5" />

      {/* 7. 4K Frame Finishes & Colorful Materials */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowFinishes(!showFinishes)}
          className={`p-2 rounded-xl transition-all cursor-pointer relative ${
            showFinishes || activeFrameFinish !== "auto"
              ? "bg-gradient-to-tr from-amber-500/20 to-purple-500/20 text-white ring-1 ring-amber-400/50 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="4K Colorful Mockup Frames (Metal & Plastic)"
        >
          <Palette className="h-4 w-4 text-amber-400" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[6px] font-black uppercase px-0.5 bg-amber-500 text-black rounded font-mono">
            4K
          </span>
        </button>

        {showFinishes && (
          <div className="absolute right-12 bottom-0 z-50 w-72 p-3.5 bg-slate-950/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs text-slate-200 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Palette className="h-4 w-4 text-amber-400" />
                <span>4K Frame Finishes</span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black uppercase">
                10 Materials
              </span>
            </div>

            <p className="text-[10px] text-slate-400">
              Transform this device with ultra-definition metal or colorful engineering polymers:
            </p>

            {/* Auto / Reset Button */}
            <button
              type="button"
              onClick={() => {
                onSelectFrameFinish?.("auto");
                setShowFinishes(false);
              }}
              className={`w-full py-1.5 px-2.5 rounded-lg border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeFrameFinish === "auto"
                  ? "bg-cyan-950/60 border-cyan-500/80 text-cyan-300 shadow-sm"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-600 ring-1 ring-white/30" />
                <span>Device Original ({selectedDevice.materialFinish || "Default"})</span>
              </div>
              {activeFrameFinish === "auto" && <Check className="h-3.5 w-3.5 text-cyan-400" />}
            </button>

            {/* 10 4K Colorful Swatches Grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto no-scrollbar pt-1">
              {FRAME_FINISHES_4K.map((fin) => {
                const isSelected = activeFrameFinish === fin.id;
                return (
                  <button
                    key={fin.id}
                    type="button"
                    onClick={() => {
                      onSelectFrameFinish?.(fin.id);
                      setShowFinishes(false);
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer group hover:scale-[1.02] ${
                      isSelected
                        ? "bg-amber-950/50 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40"
                        : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full shrink-0 ring-1 ring-white/40 shadow-inner"
                      style={{ background: fin.swatch }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold block truncate leading-tight">
                        {fin.name}
                      </span>
                      <span className="text-[7px] uppercase font-mono text-slate-400 font-semibold block">
                        {fin.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 8. Theme / Puzzle Extensions */}
      <button
        type="button"
        onClick={onOpenThemePicker}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer relative"
        title="Design Themes & Covers"
      >
        <Puzzle className="h-4 w-4" />
        <span
          className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ring-1 ring-slate-900"
          style={{ background: activeThemeSwatch }}
        />
      </button>

      {/* 8. Share Live URL */}
      <button
        type="button"
        onClick={handleShareClick}
        className={`p-2 rounded-xl transition-all cursor-pointer relative ${
          copiedLink ? "text-emerald-400 bg-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
        title={copiedLink ? "Link Copied to Clipboard!" : "Share Link"}
      >
        {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
      </button>

      {/* 9. Help Question Mark */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            showHelp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Phone Simulator Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {showHelp && (
          <div className="absolute right-12 bottom-0 z-50 w-60 p-3.5 bg-slate-950/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs text-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
              <span>Phone Simulator Guide</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Experience your bio page inside 60+ real physical phone, tablet, and laptop hardware mockups.
            </p>
            <ul className="text-[10px] space-y-1 text-slate-300 border-t border-slate-800 pt-2 font-mono">
              <li>• Click (X) to toggle clean preview</li>
              <li>• Click device icon to switch device</li>
              <li>• Click (🔍) to change screen scale</li>
            </ul>
          </div>
        )}
      </div>

      <div className="w-5 h-[1px] bg-slate-800 my-0.5" />

      {/* 10. Settings Gear (Orientation toggle) */}
      <button
        type="button"
        onClick={onToggleOrientation}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          isLandscape ? "text-indigo-400 bg-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
        title={isLandscape ? "Switch to Portrait" : "Rotate to Landscape"}
      >
        <RotateCw className="h-4 w-4" />
      </button>
    </aside>
  );
}
