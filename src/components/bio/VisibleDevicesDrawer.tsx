import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Check,
  Sparkles
} from "lucide-react";
import { DEVICE_CATALOG, type DeviceSpec, type DeviceCategory } from "../../data/deviceCatalog";

const getMaterialDisplayName = (finish?: string) => {
  switch (finish) {
    case "natural-titanium":
      return "Natural Titanium Metal";
    case "copper-titanium":
      return "Desert Copper Titanium";
    case "cosmic-violet":
      return "Cosmic Violet Metal";
    case "oceanic-blue":
      return "Oceanic Cobalt Blue";
    case "emerald-green":
      return "Emerald Green Metal";
    case "rose-gold":
      return "Rose Gold Aluminum";
    case "crimson-gloss":
      return "Racing Crimson Gloss";
    case "phantom-black":
      return "Phantom Obsidian Black";
    case "ceramic-white":
      return "Glacier Ceramic White";
    case "cyber-neon":
      return "Cyber Neon Armor";
    case "cyber-armor":
      return "Cyber Armor Steel";
    case "tuf-gunmetal":
      return "Mecha Gunmetal Steel";
    case "msi-stealth":
      return "Stealth Black Alloy";
    case "aluminum":
      return "Anodized Aluminum";
    default:
      return finish ? finish.replace("-", " ") : "";
  }
};

interface VisibleDevicesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDevice: DeviceSpec;
  onSelectDevice: (device: DeviceSpec) => void;
}

export default function VisibleDevicesDrawer({
  isOpen,
  onClose,
  selectedDevice,
  onSelectDevice
}: VisibleDevicesDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | DeviceCategory>("all");

  const filteredDevices = useMemo(() => {
    return DEVICE_CATALOG.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.os.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || d.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const androidPhones = useMemo(
    () => filteredDevices.filter((d) => d.category === "android"),
    [filteredDevices]
  );
  const applePhones = useMemo(
    () => filteredDevices.filter((d) => d.category === "apple"),
    [filteredDevices]
  );
  const tablets = useMemo(
    () => filteredDevices.filter((d) => d.category === "tablets"),
    [filteredDevices]
  );
  const specials = useMemo(
    () => filteredDevices.filter((d) => d.category === "specials"),
    [filteredDevices]
  );

  if (!isOpen) return null;

  const renderDeviceCard = (device: DeviceSpec) => {
    const isSelected = selectedDevice.id === device.id;
    return (
      <button
        key={device.id}
        type="button"
        onClick={() => {
          onSelectDevice(device);
        }}
        className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
          isSelected
            ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-cyan-500 ring-2 ring-cyan-500/40 shadow-md"
            : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-2xs"
        }`}
        title={`${device.name} (${device.width}x${device.height} - ${device.os})`}
      >
        {/* Color Material Dot Indicator (Hover shows text-[5px]) */}
        {device.materialFinish && (
          <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
            <div className="relative group/colordot flex items-center justify-center cursor-help">
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/60 shadow-xs transition-transform group-hover/colordot:scale-125"
                style={{
                  background:
                    device.materialFinish === "copper-titanium"
                      ? "#c29b7f"
                      : device.materialFinish === "cosmic-violet"
                      ? "#8b5cf6"
                      : device.materialFinish === "oceanic-blue"
                      ? "#2563eb"
                      : device.materialFinish === "emerald-green"
                      ? "#10b981"
                      : device.materialFinish === "rose-gold"
                      ? "#f472b6"
                      : device.materialFinish === "crimson-gloss"
                      ? "#ef4444"
                      : device.materialFinish === "cyber-neon"
                      ? "#eab308"
                      : device.materialFinish === "ceramic-white"
                      ? "#f8fafc"
                      : device.materialFinish === "cyber-armor"
                      ? "#dc2626"
                      : device.materialFinish === "tuf-gunmetal"
                      ? "#d97706"
                      : device.materialFinish === "msi-stealth"
                      ? "#991b1b"
                      : "#94a3b8"
                }}
              />
              <span className="pointer-events-none absolute -top-4.5 right-0 hidden group-hover/colordot:flex px-1.5 py-0.5 rounded bg-slate-950 text-[5px] font-bold text-white border border-slate-700 whitespace-nowrap shadow-lg z-30 capitalize tracking-tight leading-none">
                {getMaterialDisplayName(device.materialFinish)}
              </span>
            </div>
          </div>
        )}

        {/* Device Wireframe Icon */}
        <div className="my-1 text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors">
          {device.frameType === "laptop-macbook" ||
          device.frameType === "laptop-macbook-rose" ||
          device.frameType === "laptop-dell" ||
          device.frameType === "laptop-asus-rog" ||
          device.frameType === "laptop-asus-tuf" ||
          device.frameType === "laptop-msi" ? (
            <Laptop className={`h-6 w-6 ${isSelected ? "text-cyan-500" : ""}`} />
          ) : device.frameType === "desktop-imac" ||
            device.frameType === "desktop-curved-rog" ||
            device.frameType === "tv-xiaomi" ? (
            <Monitor className={`h-6 w-6 ${isSelected ? "text-cyan-500" : ""}`} />
          ) : device.frameType === "tablet-ipad" ||
            device.frameType === "tablet-android" ||
            device.frameType === "tablet-classic" ? (
            <Tablet className={`h-6 w-6 ${isSelected ? "text-cyan-500" : ""}`} />
          ) : (
            <Smartphone className={`h-6 w-6 ${isSelected ? "text-cyan-500" : ""}`} />
          )}
        </div>

        {/* Device Name */}
        <span className={`text-[10px] font-bold line-clamp-2 leading-tight ${
          isSelected ? "text-cyan-700 dark:text-cyan-300" : "text-slate-700 dark:text-slate-300 group-hover:text-white"
        }`}>
          {device.name}
        </span>

        {/* Dimensions */}
        <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
          {device.width} × {device.height}
        </span>

        {isSelected && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-xs">
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-[360px] sm:w-[420px] max-w-[90vw] bg-white dark:bg-slate-950/98 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Visible Devices in the Tab
            </h2>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {DEVICE_CATALOG.length} Available
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Click any device to transform into a realistic 3D object mockup
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close device selector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Active Device Quick Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-500/10 text-cyan-500 shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Current Device:
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
              {selectedDevice.name}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const random = DEVICE_CATALOG[Math.floor(Math.random() * DEVICE_CATALOG.length)];
            onSelectDevice(random);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all hover:scale-[1.02] cursor-pointer shrink-0"
          title="Switch to random device"
        >
          <Sparkles className="h-3 w-3" />
          <span>Surprise Me</span>
        </button>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Galaxy, iPhone 16, MacBook, iPad..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "all" as const, label: "All Devices" },
            { id: "apple" as const, label: "Apple Phones" },
            { id: "android" as const, label: "Android" },
            { id: "tablets" as const, label: "Tablets" },
            { id: "specials" as const, label: "Mac / PC" }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-cyan-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Device List Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Android Phones */}
        {androidPhones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
                <span>Android Phones</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 ml-auto">
                {androidPhones.length} models
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {androidPhones.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {/* Apple Phones */}
        {applePhones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-indigo-400" />
                <span>Apple Phones</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 ml-auto">
                {applePhones.length} models
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {applePhones.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {/* Tablets */}
        {tablets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tablet className="h-3.5 w-3.5 text-purple-400" />
                <span>Tablets</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 ml-auto">
                {tablets.length} models
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tablets.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {/* Specials & Computers */}
        {specials.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-cyan-400" />
                <span>Specials & Laptops</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 ml-auto">
                {specials.length} models
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {specials.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {filteredDevices.length === 0 && (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Smartphone className="h-8 w-8 mx-auto opacity-40 animate-pulse" />
            <p className="text-xs font-bold text-slate-300">No matching devices found</p>
            <p className="text-[10px]">Try searching for &quot;iPhone&quot;, &quot;MacBook&quot;, or &quot;Galaxy&quot;</p>
          </div>
        )}
      </div>

      {/* Footer Request Note */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-center shrink-0">
        <p className="text-[10px] text-slate-500">
          The device you&apos;re looking for isn&apos;t in the list?{" "}
          <span className="text-cyan-500 hover:underline cursor-pointer font-semibold">Let us know!</span>
        </p>
      </div>
    </div>
  );
}
