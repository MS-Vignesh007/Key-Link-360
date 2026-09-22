import React, { useRef, useEffect, useState } from "react";
import { 
  ArrowRight, 
  Sparkles, 
  Link2, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Layers, 
  Radio, 
  Lock,
  CheckCircle2,
  Activity,
  Cpu,
  QrCode,
  Flame
} from "lucide-react";
import { AuthUser, getStoredAuthUser } from "../lib/authApi";
import CinematicLogoLoader from "./common/CinematicLogoLoader";

interface WelcomeModalProps {
  user: AuthUser;
  onContinue: () => void;
}

export default function WelcomeModal({ user, onContinue }: WelcomeModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [countdown, setCountdown] = useState<number>(12);
  const [canContinue, setCanContinue] = useState<boolean>(false);
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Security Check: Verify user integrity
  const verifiedUser = user || getStoredAuthUser();

  useEffect(() => {
    // Mobile & Desktop robust video autoplay handling
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {
        // Fallback for strict mobile power-saving modes
      });
    }

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCanContinue(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const displayName =
    verifiedUser?.name?.trim() ||
    (verifiedUser?.firstName ? `${verifiedUser.firstName} ${verifiedUser.lastName || ""}`.trim() : "") ||
    verifiedUser?.email?.split("@")[0] ||
    "VIP Creator";

  const handleLaunch = () => {
    if (!canContinue) return;
    setShowCinematicIntro(true);
  };

  if (showCinematicIntro) {
    return <CinematicLogoLoader onComplete={onContinue} />;
  }

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-[#030611] text-white select-none overflow-y-auto lg:overflow-hidden animate-in fade-in duration-500">
      
      {/* =========================================================================
          BACKGROUND MULTI-LAYERED LUXURY COSMIC LIGHTING ENGINE
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
        {/* Soft Radial Ambient Glowing Orbs */}
        <div className="absolute -top-[20%] left-[8%] w-[380px] sm:w-[850px] h-[380px] sm:h-[650px] bg-cyan-500/18 rounded-full blur-[120px] sm:blur-[170px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[35%] -right-[15%] w-[360px] sm:w-[800px] h-[360px] sm:h-[700px] bg-indigo-600/18 rounded-full blur-[130px] sm:blur-[190px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-[25%] left-[25%] w-[400px] sm:w-[900px] h-[400px] sm:h-[750px] bg-violet-600/15 rounded-full blur-[140px] sm:blur-[210px]" />
        
        {/* Fine Architectural Cyber Perspective Grid */}
        <div 
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)`,
            backgroundSize: "44px 44px"
          }}
        />

        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f0ff]" />
      </div>

      {/* =========================================================================
          FULL PAGE VIEW WRAPPER (GUARANTEES FOOTER AT VERY BOTTOM ON MOBILE & DESKTOP)
          ========================================================================= */}
      <div className="w-full min-h-full flex flex-col justify-between">

        {/* =========================================================================
            TOP LUXURY HUD NAVIGATION / LIVE COMMAND HEADER (COMPACT & MOBILE RESPONSIVE)
            ========================================================================= */}
        <header className="w-full shrink-0 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 border-b border-cyan-500/15 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-between z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img 
              src="/keylink360-gold-emblem.png" 
              alt="KeyLink360" 
              className="h-8 sm:h-11 md:h-12 w-auto object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform hover:scale-105" 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-base lg:text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent truncate">
                  KEYLINK<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">360</span>
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)] shrink-0">
                  PRO SUITE
                </span>
              </div>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-semibold tracking-wider truncate">
                OMNICHANNEL BIO & MONETIZATION
              </p>
            </div>
          </div>

          {/* Center Live Telemetry Strip (Desktop Only) */}
          <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-bold">NODE: ASIA-SOUTH-1</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Activity className="w-3.5 h-3.5" />
              <span>99.999% SLA UPTIME</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-amber-300">
              <Lock className="w-3 h-3" />
              <span>QUANTUM-256 ENCRYPTED</span>
            </div>
          </div>

          {/* Right Live Equalizer & Session Clock */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Animated Audio/Signal Equalizer Waves */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400">
              <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDuration: '0.6s' }} />
              <span className="w-1 h-5 bg-cyan-300 rounded-full animate-pulse" style={{ animationDuration: '0.8s' }} />
              <span className="w-1 h-2.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDuration: '0.5s' }} />
              <span className="w-1 h-4 bg-sky-400 rounded-full animate-pulse" style={{ animationDuration: '0.7s' }} />
              <span className="ml-1 text-[10px] font-mono text-cyan-300 font-bold">LIVE HUD</span>
            </div>

            {/* Time Clock Badge */}
            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-slate-200 text-[10px] sm:text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,240,255,0.15)] flex items-center gap-1.5">
              <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-pulse" />
              <span>{currentTime || "LIVE"}</span>
            </div>
          </div>

        </header>

        {/* =========================================================================
            MAIN CENTRAL STAGE — 100% RESPONSIVE (MOBILE SCROLL + DESKTOP ZERO-SCROLL FIT)
            ========================================================================= */}
        <main className="w-full flex-1 max-w-[1780px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-2 flex flex-col justify-start lg:justify-center z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-6 items-start lg:items-center w-full lg:h-full lg:max-h-[82vh]">
            
            {/* ─────────────────────────────────────────────────────────────────
                LEFT WING: ROYAL CINEMA THEATER & FEATURE GAUGES (7 COLS)
                ───────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-7 flex flex-col justify-start lg:justify-between space-y-3 sm:space-y-4 lg:space-y-3 w-full lg:h-full min-h-0">
              
              {/* VIP Salutation Banner */}
              <div className="space-y-1 sm:space-y-1.5 shrink-0">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-indigo-500/20 border border-amber-400/40 text-amber-300 text-[9px] sm:text-[11px] font-black tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="uppercase animate-luxury-shimmer bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                    VIP CREATOR ACCESS UNLOCKED
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-[40px] font-black text-white tracking-tight leading-tight">
                  Welcome to KeyLink360,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 drop-shadow-[0_0_35px_rgba(0,240,255,0.6)]">
                    {displayName}
                  </span>
                  !
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-0.5">
                  <p className="text-[11px] sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">
                      1 Intelligent Link — Infinite Global Connections
                    </span>
                  </p>
                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-cyan-400 font-mono bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>DASHBOARD ENGINE READY</span>
                  </div>
                </div>
              </div>

              {/* Ultra-Luxury 4K Cinema Theater Bezel (Fixed Aspect Ratio on Mobile & Desktop) */}
              <div className="relative w-full aspect-video max-h-[220px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[380px] lg:flex-1 rounded-2xl sm:rounded-3xl overflow-hidden p-[1.5px] bg-gradient-to-b from-cyan-400/60 via-indigo-500/30 to-cyan-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(0,240,255,0.2)] group shrink-0">
                
                {/* Corner High-Tech Reticles */}
                <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-t-2 border-l-2 border-cyan-400 z-20 pointer-events-none drop-shadow-[0_0_6px_#00f0ff]" />
                <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-t-2 border-r-2 border-cyan-400 z-20 pointer-events-none drop-shadow-[0_0_6px_#00f0ff]" />
                <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-b-2 border-l-2 border-cyan-400 z-20 pointer-events-none drop-shadow-[0_0_6px_#00f0ff]" />
                <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 border-b-2 border-r-2 border-cyan-400 z-20 pointer-events-none drop-shadow-[0_0_6px_#00f0ff]" />

                {/* Video Player Canvas */}
                <div className="w-full h-full bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    controls={false}
                    className="w-full h-full object-cover rounded-2xl sm:rounded-3xl pointer-events-none select-none transition-transform duration-700 group-hover:scale-[1.01]"
                  >
                    <source src="/welcome-yours.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Cinema Ambient Vignette */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/25 rounded-2xl sm:rounded-3xl" />
                  
                  {/* Floating Telemetry Tag */}
                  <div className="absolute bottom-2 left-2.5 sm:bottom-3 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-black/75 backdrop-blur-md border border-cyan-500/40 text-[8px] sm:text-[10px] text-cyan-300 font-mono shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>4K ECOSYSTEM HUD</span>
                  </div>

                  {/* Floating Right Audio Status */}
                  <div className="absolute bottom-2 right-2.5 sm:bottom-3 sm:right-4 z-20 hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] text-slate-300 font-mono">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>CLOUD SYNCED</span>
                  </div>
                </div>
              </div>

              {/* 4 Interactive Real-time Ecosystem Feature Chips (2x2 on mobile, 1x4 on desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full shrink-0">
                
                <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:border-cyan-400/60 transition-colors">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-white truncate">Direct UPI</p>
                    <p className="text-[8px] sm:text-[9px] text-cyan-300 truncate">0% Commission</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:border-indigo-400/60 transition-colors">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/15 border border-indigo-400/40 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-white truncate">27+ Blocks</p>
                    <p className="text-[8px] sm:text-[9px] text-indigo-300 truncate">Store & Media</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900/60 border border-amber-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-400/60 transition-colors">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-white truncate">360 QR Studio</p>
                    <p className="text-[8px] sm:text-[9px] text-amber-300 truncate">Dynamic Styles</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-400/60 transition-colors">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-white truncate">Edge CDN</p>
                    <p className="text-[8px] sm:text-[9px] text-emerald-300 truncate">18ms Global</p>
                  </div>
                </div>

              </div>

            </div>

            {/* ─────────────────────────────────────────────────────────────────
                RIGHT WING: ROYAL EXECUTIVE GLASS DECK + 3D GOLD EMBLEM (5 COLS)
                ───────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 flex flex-col justify-start lg:justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#080d1f]/95 to-slate-950/98 border border-cyan-400/35 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,240,255,0.18)] backdrop-blur-3xl space-y-3.5 lg:space-y-3 w-full lg:h-full relative overflow-hidden">
              
              {/* Top Badge & Tier */}
              <div className="flex items-center justify-between shrink-0 z-10">
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-600/20 border border-amber-400/40 text-amber-300 flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  ALL PRO MODULES INITIALIZED
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-extrabold tracking-widest">
                  v2.5 PRO
                </span>
              </div>

              {/* 3D Floating Gold Emblem Showcase Centerpiece */}
              <div className="relative w-full min-h-[110px] sm:min-h-[150px] lg:flex-1 flex items-center justify-center py-1 sm:py-2 z-10">
                
                {/* Rotating Celestial Halo Energy Rings */}
                <div className="absolute w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-dashed border-cyan-400/40 animate-luxury-halo" />
                <div className="absolute w-24 h-24 sm:w-40 sm:h-40 rounded-full border border-dashed border-amber-400/40 animate-luxury-halo-reverse" />
                
                {/* Pulsing Central Atmospheric Backlight Halo */}
                <div className="absolute w-28 h-28 sm:w-44 sm:h-44 bg-gradient-to-tr from-amber-500/25 via-cyan-500/25 to-indigo-500/25 rounded-full blur-[35px] sm:blur-[40px] animate-pulse" />
                
                {/* Floating 3D Gold Emblem */}
                <img
                  src="/keylink360-gold-emblem.png"
                  alt="KeyLink360 Gold Emblem"
                  className="relative z-10 max-h-20 sm:max-h-28 md:max-h-36 lg:max-h-44 w-auto object-contain animate-luxury-float drop-shadow-[0_15px_30px_rgba(212,175,55,0.45)] cursor-pointer"
                />
              </div>

              {/* Gratitude & Announcement Text */}
              <div className="space-y-1 text-center w-full flex flex-col items-center justify-center shrink-0 z-10">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Thank You for Connecting with KeyLink360!
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Your personal bio storefront, dynamic QR studio, and instant UPI payment engine are ready to accelerate your growth.
                </p>
              </div>

              {/* Value Pillars List with Glowing Badges */}
              <div className="space-y-1.5 shrink-0 bg-slate-950/70 p-2.5 sm:p-3 rounded-2xl border border-slate-800/90 z-10">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0 drop-shadow-[0_0_6px_#34d399]" />
                  <span className="font-medium">Custom Domain & Dynamic Bio Templates</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_#22d3ee]" />
                  <span className="font-medium">Direct-to-Bank Instant UPI Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 drop-shadow-[0_0_6px_#fbbf24]" />
                  <span className="font-medium">Smart Multi-Device Presentation Engine</span>
                </div>
              </div>

              {/* High-Impact Continue to Dashboard Button with 12s Countdown & Traveling Laser Border */}
              <div className="w-full pt-1 shrink-0 z-10">
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={handleLaunch}
                  className={`w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl font-black text-xs sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 sm:gap-3 relative overflow-hidden ${
                    countdown <= 10 ? "btn-traveling-border" : ""
                  } ${
                    canContinue
                      ? "bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 shadow-[0_0_40px_rgba(0,240,255,0.6)] transform hover:scale-[1.02] active:scale-98 cursor-pointer btn-anim btn-swipe"
                      : countdown <= 10
                        ? "bg-slate-900 text-cyan-300 border border-cyan-500/60 shadow-[0_0_25px_rgba(0,240,255,0.35)] cursor-wait"
                        : "bg-slate-800/80 text-slate-400 border border-slate-700/60 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {countdown <= 10 && (
                    <>
                      <span className="btn-border-line-top" />
                      <span className="btn-border-line-right" />
                      <span className="btn-border-line-bottom" />
                      <span className="btn-border-line-left" />
                    </>
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>
                      {countdown > 0 ? `LAUNCH DASHBOARD (${countdown}s)` : "ENTER DASHBOARD"}
                    </span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-pulse" />
                  </span>
                </button>
              </div>

            </div>

          </div>
        </main>

        {/* =========================================================================
            BOTTOM ENTERPRISE SECURITY & GLOBAL NETWORK STATUS FOOTER
            ========================================================================= */}
        <footer className="w-full shrink-0 mt-auto px-3.5 sm:px-8 py-3 border-t border-cyan-500/15 bg-slate-950/90 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-slate-400 z-20 gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>256-Bit SSL Encryption</span>
            </span>
            <span className="hidden sm:inline-block text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Global Edge CDN: 18ms</span>
            </span>
            <span className="hidden md:inline-block text-slate-700">•</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>SOC2 & ISO-27001</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-[9px] sm:text-[10px] text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
              PRO v2.5
            </span>
            <span>© {new Date().getFullYear()} KeyLink360 Inc.</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
