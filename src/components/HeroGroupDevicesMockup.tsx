import React, { useEffect } from "react";
import {
  Sparkles,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import KeyLogo3D from "./KeyLogo3D";

interface TemplateItem {
  id: string;
  category: string;
  name: string;
  bio: string;
  themeBg: string;
  coverImage: string;
  content?: React.ReactNode;
}

interface HeroGroupDevicesMockupProps {
  currentTemplate?: TemplateItem;
  templates?: TemplateItem[];
  activeTemplateIndex?: number;
  onNextTemplate?: () => void;
  onPrevTemplate?: () => void;
  onSelectTemplate?: (idx: number) => void;
  onGetStarted?: () => void;
}

export default function HeroGroupDevicesMockup({
  currentTemplate,
  templates = [],
  activeTemplateIndex = 0,
  onNextTemplate,
  onPrevTemplate,
  onSelectTemplate,
  onGetStarted
}: HeroGroupDevicesMockupProps) {
  const fallbackTemplate: TemplateItem = {
    id: "foodcreator",
    category: "Food Content Creator",
    name: "Meera Cooks 🎬",
    bio: "Recipe reels • Behind-the-scenes • Food styling tips ✨ New weekly",
    themeBg: "from-[#160c13] via-[#1c0f18] to-[#0c070a]",
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=85"
  };

  const template = currentTemplate || (templates.length > 0 ? templates[activeTemplateIndex] : fallbackTemplate);
  const totalTemplates = templates.length > 0 ? templates.length : 7;

  // Keyboard Left / Right navigation keys support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrevTemplate) {
        onPrevTemplate();
      } else if (e.key === "ArrowRight" && onNextTemplate) {
        onNextTemplate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNextTemplate, onPrevTemplate]);

  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      
      {/* ===================== 4K MOCKUP STAGE CONTAINER (-20% SIZED FOR SLEEK PROPORTIONS) ===================== */}
      <div className="relative w-full max-w-[990px] px-2 sm:px-4">
        
        {/* Main 1472 x 1068 Aspect Ratio Stage */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "1472 / 1068",
            containerType: "inline-size"
          }}
        >

          {/* ─────────────────────────────────────────────────────────────
              1. TABLET SCREEN CONTAINER (Z-Index: 5, Behind Laptop Bezel)
              Bounds: minX=135, maxX=569, minY=187, maxY=776
              % w.r.t 1472x1068: left: 9.1712%, top: 17.5094%, w: 29.5516%, h: 55.2434%
          ───────────────────────────────────────────────────────────── */}
          <div
            className="absolute rounded-[2.2%] overflow-hidden bg-gradient-to-b from-[#090e1c] via-[#0c1426] to-[#060912] text-white flex flex-col select-none shadow-2xl transition-all duration-300"
            style={{
              left: "9.1712%",
              top: "17.5094%",
              width: "29.5516%",
              height: "55.2434%",
              zIndex: 5
            }}
          >
            {/* Tablet Status Bar */}
            <div className="w-full px-[3.5%] pt-[2.5%] pb-[1.5%] flex items-center justify-between text-[clamp(6px,0.9cqw,10px)] font-bold text-slate-300 bg-slate-950/60 border-b border-white/10">
              <span className="font-mono text-cyan-300">9:41 AM</span>
              <div className="flex items-center gap-[4%]">
                <span className="text-[clamp(5px,0.75cqw,8px)] font-mono text-emerald-400 bg-emerald-950/80 px-[4px] py-[1px] rounded">
                  TOUCH POS
                </span>
                <span>100% 🔋</span>
              </div>
            </div>

            {/* Tablet Content: Touch Counter Storefront */}
            <div className="flex-1 p-[4%] flex flex-col justify-between overflow-hidden space-y-[2%]">
              {/* Header */}
              <div className="flex items-center justify-between pb-[2%] border-b border-white/10">
                <div className="flex items-center gap-[3%]">
                  <KeyLogo3D size="xs" showLabel={false} />
                  <span className="text-[clamp(7px,1cqw,12px)] font-extrabold text-white">
                    KeyLink<span className="text-cyan-400">Store</span>
                  </span>
                </div>
                <span className="text-[clamp(6px,0.8cqw,9px)] bg-cyan-500/20 text-cyan-300 px-[5px] py-[1px] rounded-full font-bold">
                  ● Live Counter
                </span>
              </div>

              {/* Tablet Product Card Highlight */}
              <div className="rounded-[6px] p-[3.5%] bg-slate-900/90 border border-slate-700/70 flex items-center gap-[4%]">
                <div className="w-[28%] aspect-square rounded-[4px] overflow-hidden relative shrink-0">
                  <img
                    src={template.coverImage}
                    alt="Product"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="flex-1 min-w-0 space-y-[1%]">
                  <p className="text-[clamp(7px,1cqw,11px)] font-bold text-white truncate">
                    {template.name}
                  </p>
                  <p className="text-[clamp(5.5px,0.8cqw,9px)] text-cyan-300 font-medium">
                    {template.category}
                  </p>
                  <p className="text-[clamp(6px,0.85cqw,10px)] font-black text-amber-300">
                    ₹1,999 <span className="text-[clamp(5px,0.7cqw,8px)] text-slate-400 font-normal line-through">₹3,499</span>
                  </p>
                </div>
              </div>

              {/* Instant Tap UPI Box */}
              <div className="p-[3%] rounded-[6px] bg-gradient-to-r from-emerald-950/70 to-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                <div className="space-y-[1px]">
                  <p className="text-[clamp(6px,0.85cqw,10px)] font-bold text-white flex items-center gap-1">
                    <CreditCard className="w-[10px] h-[10px] text-emerald-400 shrink-0 inline" />
                    Instant UPI Scan
                  </p>
                  <p className="text-[clamp(5px,0.7cqw,8px)] text-emerald-300 font-mono">
                    GPay • PhonePe • Paytm
                  </p>
                </div>
                <span className="text-[clamp(5.5px,0.8cqw,9px)] bg-emerald-400 text-slate-950 font-black px-[6px] py-[2px] rounded">
                  Pay Now →
                </span>
              </div>

              {/* Tablet Bottom Quick Tabs */}
              <div className="grid grid-cols-3 gap-[2%] pt-[1%] text-center text-[clamp(5.5px,0.75cqw,8.5px)] font-bold">
                <div className="p-[2%] rounded bg-white/10 text-white">🛍️ Catalog</div>
                <div className="p-[2%] rounded bg-white/5 text-slate-400">📊 Sales</div>
                <div className="p-[2%] rounded bg-cyan-400 text-slate-950">⚡ 1-Tap</div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. LAPTOP SCREEN CONTAINER (Z-Index: 8)
              Bounds: minX=568, maxX=1388, minY=259, maxY=731
              % w.r.t 1472x1068: left: 38.5870%, top: 24.2509%, w: 55.7745%, h: 44.2884%
          ───────────────────────────────────────────────────────────── */}
          <div
            className="absolute rounded-[0.8%] overflow-hidden bg-[#070b14] text-white flex flex-col select-none shadow-2xl transition-all duration-300"
            style={{
              left: "38.5870%",
              top: "24.2509%",
              width: "55.7745%",
              height: "44.2884%",
              zIndex: 8
            }}
          >
            {/* Laptop Studio Top Navbar */}
            <div className="w-full px-[3%] py-[1.8%] bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between text-[clamp(6px,0.85cqw,10px)]">
              <div className="flex items-center gap-[2%] min-w-0">
                <KeyLogo3D size="xs" showLabel={false} />
                <span className="font-extrabold text-white text-[clamp(7px,1cqw,12px)] tracking-tight">
                  KeyLink<span className="text-cyan-400">360</span>
                </span>
                <span className="hidden sm:inline-block ml-[8px] text-[clamp(5.5px,0.75cqw,8.5px)] bg-cyan-950/80 text-cyan-300 px-[6px] py-[1px] rounded-full border border-cyan-500/30">
                  DESKTOP STUDIO
                </span>
              </div>

              <div className="flex items-center gap-[3%] text-slate-300 font-semibold text-[clamp(5.5px,0.8cqw,9px)]">
                <span className="text-cyan-400 font-mono">
                  {activeTemplateIndex + 1} / {totalTemplates}
                </span>
                <span className="hidden md:inline">Traffic Manager</span>
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black px-[8px] py-[2px] rounded-full">
                  Publish ⚡
                </span>
              </div>
            </div>

            {/* Laptop Studio Body (2-Column Architecture) */}
            <div className="flex-1 grid grid-cols-12 gap-[2%] p-[2.5%] overflow-hidden bg-gradient-to-br from-[#080d1a] via-[#0a1224] to-[#05070d]">
              
              {/* Left Column: Command Center & Real-Time Telemetry */}
              <div className="col-span-7 flex flex-col justify-between space-y-[2%]">
                
                {/* 3 Metric Pulse Cards */}
                <div className="grid grid-cols-3 gap-[2%]">
                  <div className="p-[3%] rounded-[5px] bg-slate-900/90 border border-slate-800 space-y-[1px]">
                    <span className="text-[clamp(5px,0.7cqw,8px)] text-slate-400 uppercase">Live Clicks</span>
                    <p className="text-[clamp(8px,1.1cqw,13px)] font-black text-cyan-400">48,290</p>
                    <span className="text-[clamp(4.5px,0.65cqw,7.5px)] text-emerald-400 font-mono">+38% this wk</span>
                  </div>
                  <div className="p-[3%] rounded-[5px] bg-slate-900/90 border border-slate-800 space-y-[1px]">
                    <span className="text-[clamp(5px,0.7cqw,8px)] text-slate-400 uppercase">UPI Revenue</span>
                    <p className="text-[clamp(8px,1.1cqw,13px)] font-black text-emerald-400">₹1,84,200</p>
                    <span className="text-[clamp(4.5px,0.65cqw,7.5px)] text-cyan-300 font-mono">Direct Bank</span>
                  </div>
                  <div className="p-[3%] rounded-[5px] bg-slate-900/90 border border-slate-800 space-y-[1px]">
                    <span className="text-[clamp(5px,0.7cqw,8px)] text-slate-400 uppercase">Active Domain</span>
                    <p className="text-[clamp(7px,1cqw,11px)] font-bold text-white truncate">yourbrand.com</p>
                    <span className="text-[clamp(4.5px,0.65cqw,7.5px)] text-cyan-400 font-mono">SSL Active ✓</span>
                  </div>
                </div>

                {/* Studio Drag & Drop Modular Blocks */}
                <div className="space-y-[1.5%]">
                  <div className="flex items-center justify-between text-[clamp(5.5px,0.75cqw,8.5px)] text-slate-400 font-bold uppercase">
                    <span>ACTIVE BIO BLOCKS (27+)</span>
                    <span className="text-cyan-400 font-mono">AUTO-SYNC ON</span>
                  </div>

                  <div className="space-y-[1.5%]">
                    <div className="p-[2%] rounded-[4px] bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[clamp(6px,0.85cqw,9.5px)]">
                      <div className="flex items-center gap-[2%] truncate">
                        <span className="w-[12px] h-[12px] rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[7px] shrink-0 font-bold">1</span>
                        <span className="font-semibold text-white truncate">{template.name}</span>
                      </div>
                      <span className="text-[clamp(5px,0.7cqw,8px)] text-emerald-400 font-mono shrink-0">12.4k views</span>
                    </div>

                    <div className="p-[2%] rounded-[4px] bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[clamp(6px,0.85cqw,9.5px)]">
                      <div className="flex items-center gap-[2%] truncate">
                        <span className="w-[12px] h-[12px] rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[7px] shrink-0 font-bold">2</span>
                        <span className="font-semibold text-white truncate">Instant UPI Payment Button</span>
                      </div>
                      <span className="text-[clamp(5px,0.7cqw,8px)] text-cyan-300 font-mono shrink-0">Razorpay ✓</span>
                    </div>

                    <div className="p-[2%] rounded-[4px] bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[clamp(6px,0.85cqw,9.5px)]">
                      <div className="flex items-center gap-[2%] truncate">
                        <span className="w-[12px] h-[12px] rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[7px] shrink-0 font-bold">3</span>
                        <span className="font-semibold text-white truncate">Dynamic Smart QR Code</span>
                      </div>
                      <span className="text-[clamp(5px,0.7cqw,8px)] text-amber-300 font-mono shrink-0">Rotator Active</span>
                    </div>
                  </div>
                </div>

                {/* Traffic Real-Time Bar */}
                <div className="p-[2%] rounded-[4px] bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[clamp(5.5px,0.75cqw,8.5px)] font-mono">
                  <span className="text-slate-400">Global Edge Latency:</span>
                  <span className="text-emerald-400 font-bold">32ms (Zero-Downtime CDN)</span>
                </div>
              </div>

              {/* Right Column: Mini Live Bio Storefront Simulator */}
              <div className="col-span-5 flex flex-col justify-between p-[3%] rounded-[6px] bg-slate-950/90 border border-cyan-500/30 shadow-inner">
                <div className="text-center space-y-[1.5%]">
                  <div className="relative w-[32%] aspect-square mx-auto rounded-full overflow-hidden ring-2 ring-cyan-400/80 shadow-md">
                    <img
                      src={template.coverImage}
                      alt={template.name}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  </div>
                  <h4 className="text-[clamp(7px,1cqw,11px)] font-black text-white leading-tight">
                    {template.name}
                  </h4>
                  <p className="text-[clamp(5px,0.7cqw,8px)] text-cyan-300 font-medium truncate">
                    keylink360.today/{template.id}
                  </p>
                </div>

                <div className="space-y-[2%] pt-[2%]">
                  <div className="p-[2%] rounded-[4px] bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black text-[clamp(6px,0.85cqw,9.5px)] text-center">
                    Tap to View Storefront →
                  </div>
                  <div className="p-[2%] rounded-[4px] bg-white/10 text-white text-[clamp(5.5px,0.8cqw,8.5px)] text-center font-bold">
                    ⭐ Book Consultation
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. SMARTPHONE SCREEN CONTAINER (Z-Index: 10)
              Bounds: minX=35, maxX=236, minY=476, maxY=931
              % w.r.t 1472x1068: left: 2.3777%, top: 44.5693%, w: 13.7228%, h: 42.6966%
          ───────────────────────────────────────────────────────────── */}
          <div
            className="absolute rounded-[7%] overflow-hidden bg-gradient-to-b from-[#18120c] via-[#20170f] to-[#0d0905] text-white flex flex-col select-none shadow-2xl transition-all duration-300"
            style={{
              left: "2.3777%",
              top: "44.5693%",
              width: "13.7228%",
              height: "42.6966%",
              zIndex: 10
            }}
          >
            {/* Phone Top Status Bar */}
            <div className="w-full px-[8%] pt-[6%] pb-[2%] flex items-center justify-between text-[clamp(4.5px,0.7cqw,8px)] font-bold text-white bg-black/40">
              <span className="font-mono text-cyan-300">9:41</span>
              <div className="flex items-center gap-[4%] text-[clamp(4px,0.6cqw,7px)]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Phone Bio Storefront Body */}
            <div className="flex-1 px-[6%] py-[4%] flex flex-col justify-between overflow-hidden space-y-[3%]">
              
              {/* Profile Avatar & Bio */}
              <div className="text-center space-y-[2%]">
                <div className="w-[38%] aspect-square mx-auto rounded-full overflow-hidden ring-2 ring-amber-400 shadow-md">
                  <img
                    src={template.coverImage}
                    alt={template.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>
                <h5 className="text-[clamp(6px,0.9cqw,10px)] font-black text-white leading-tight">
                  {template.name}
                </h5>
                <span className="inline-block text-[clamp(4.5px,0.65cqw,7.5px)] font-bold bg-amber-400/20 text-amber-300 px-[4px] py-[1px] rounded-full border border-amber-400/30">
                  {template.category}
                </span>
              </div>

              {/* Action Buttons Stack */}
              <div className="space-y-[2%]">
                <div className="p-[2.5%] rounded-[4px] bg-gradient-to-r from-[#d94868] to-[#bf3452] text-white text-[clamp(5px,0.75cqw,8.5px)] font-bold text-center leading-tight shadow-sm">
                  🎬 Viral Reel (2.4M)
                </div>
                <div className="p-[2.5%] rounded-[4px] bg-gradient-to-r from-[#df973b] to-[#c67e24] text-white text-[clamp(5px,0.75cqw,8.5px)] font-bold text-center leading-tight shadow-sm">
                  ⚡ 10% Discount Code
                </div>
                <div className="p-[2.5%] rounded-[4px] bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-[clamp(5px,0.75cqw,8.5px)] font-black text-center leading-tight shadow-sm">
                  💳 Instant UPI Pay
                </div>
              </div>

              {/* Bottom Verified Badge */}
              <div className="text-center text-[clamp(4px,0.6cqw,7px)] text-slate-400 font-mono">
                ✓ Verified KeyLink360
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. DEVICE HARDWARE OVERLAY (Z-Index: 20)
              Hardware PNG Frame sitting on top with transparent display cutouts!
          ───────────────────────────────────────────────────────────── */}
          <img
            src="/HeroGroupDevices.png"
            alt="KeyLink360 Multi-Device Mockup Frame"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-[0_30px_70px_rgba(0,0,0,0.95)]"
            style={{
              zIndex: 20
            }}
          />

        </div>
      </div>

      {/* Manual Navigation Slider Controller (Matching Screenshot 1) */}
      <div className="mt-3 sm:mt-5 flex items-center justify-center gap-4 sm:gap-5 select-none">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={onPrevTemplate}
          className="w-10 h-10 rounded-full bg-[#0a0f1d]/90 hover:bg-[#11192e] border border-slate-700/80 hover:border-cyan-400/80 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
          title="Previous Blueprint (Left Arrow Key)"
          aria-label="Previous Blueprint"
        >
          <ChevronLeft className="w-4.5 h-4.5 text-slate-300 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* Dynamic Dots & Glowing Active Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {Array.from({ length: totalTemplates }).map((_, dotIdx) => {
            const isActive = activeTemplateIndex === dotIdx;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => onSelectTemplate && onSelectTemplate(dotIdx)}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-9 h-3 rounded-full bg-gradient-to-r from-[#00d2ff] via-sky-400 to-[#3a7bd5] shadow-[0_0_16px_rgba(0,210,255,0.85)] scale-105"
                    : "w-2.5 h-2.5 rounded-full bg-[#2a3854]/80 hover:bg-[#3a4d70] hover:scale-110"
                }`}
                aria-label={`Switch to blueprint ${dotIdx + 1}`}
              />
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={onNextTemplate}
          className="w-10 h-10 rounded-full bg-[#0a0f1d]/90 hover:bg-[#11192e] border border-slate-700/80 hover:border-cyan-400/80 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
          title="Next Blueprint (Right Arrow Key)"
          aria-label="Next Blueprint"
        >
          <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:text-cyan-400 transition-colors" />
        </button>
      </div>

      {/* Feature Badges under Mockup */}
      <div className="mt-3 sm:mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-4 text-[11px] sm:text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(0,240,255,1)]" />
          <span className="font-semibold text-white">Zero-Latency Edge CDN</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Instant Razorpay UPI Payments</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dynamic Smart QR Codes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-indigo-400" />
          <span>Custom Domain with Free SSL</span>
        </div>
      </div>

    </div>
  );
}
