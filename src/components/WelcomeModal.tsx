import React, { useRef, useEffect } from "react";
import { ArrowRight, Sparkles, Link2 } from "lucide-react";
import { AuthUser } from "../lib/authApi";

interface WelcomeModalProps {
  user: AuthUser;
  onContinue: () => void;
}

export default function WelcomeModal({ user, onContinue }: WelcomeModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const displayName =
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    (user.email ? user.email.split("@")[0] : "Creator");

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay handled:", err);
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-slate-950/95 backdrop-blur-3xl overflow-y-auto lg:overflow-hidden select-none animate-in fade-in duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
        <div className="absolute top-1/6 left-1/5 w-[800px] h-[600px] bg-cyan-500/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-1/5 w-[800px] h-[600px] bg-indigo-500/12 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[500px] bg-sky-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Main Full-Screen Console Fitting Mobile & Desktop Gracefully */}
      <div className="relative w-full max-w-[1580px] h-auto lg:h-full lg:max-h-[96vh] rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#030508] border-2 border-cyan-500/40 shadow-[0_0_90px_rgba(0,240,255,0.28)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between overflow-hidden my-auto">
        
        {/* Specular Top Border Highlight */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(0,240,255,0.8)]" />

        {/* 2-Column Responsive Layout: Left (High-Width Video Screen) + Right (Medium Width Logo & Continue) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch h-auto lg:h-full flex-1 min-h-0">
          
          {/* ================= LEFT SECTION: HIGH-WIDTH WIDE SCREEN VIDEO & WELCOME ================= */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between h-auto lg:h-full space-y-3 min-h-0">
            
            {/* Header Area */}
            <div className="space-y-1.5 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>CONNECTION SUCCESSFUL • KEYLINK360</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 drop-shadow-[0_0_30px_rgba(0,240,255,0.5)]">
                  {displayName}
                </span>
                !
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <p className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                  Welcome to KeyLink360 Ecosystem
                </p>
                <p className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>1 Smart Link — Infinite Connections</span>
                </p>
              </div>
            </div>

            {/* High-Width Big Screen Video Box (Responsive for Mobile and Full Screen on Desktop) */}
            <div className="w-full h-48 sm:h-64 md:h-72 lg:h-full min-h-[190px] sm:min-h-[250px] lg:min-h-0 relative rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.85)] bg-black group flex-1">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent z-10" />
              
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                controls={false}
                className="w-full h-full object-cover rounded-2xl sm:rounded-3xl pointer-events-none select-none"
              >
                <source src="/welcome-yours.mp4" type="video/mp4" />
              </video>
              
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20 rounded-2xl sm:rounded-3xl" />
            </div>

          </div>

          {/* ================= RIGHT SECTION: MEDIUM WIDTH CLEAN PNG LOGO + GRATITUDE + CONTINUE BUTTON ================= */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between h-auto lg:h-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-2xl min-h-0 space-y-4">
            
            {/* Promo Emblem Section (Clean Original PNG, No Yellow Smoke Background) */}
            <div className="relative w-full flex-1 flex items-center justify-center py-2 min-h-0">
              <img
                src="/keylink360-gold-emblem.png"
                alt="KeyLink360 Gold Emblem"
                className="max-h-40 sm:max-h-48 md:max-h-56 lg:max-h-64 xl:max-h-72 w-auto object-contain transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Gratitude & Connecting Info (Strictly Center Aligned, Zero Emojis) */}
            <div className="space-y-2 text-center w-full flex flex-col items-center justify-center shrink-0">
              <div className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/60 px-3.5 py-1.5 rounded-full border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Thank You for Connecting with KeyLink360!</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto text-center">
                Your personal bio storefront, dynamic QR studio, and instant UPI payment engine are ready to accelerate your growth.
              </p>
            </div>

            {/* Continue to Dashboard Button */}
            <div className="w-full pt-1 shrink-0">
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider shadow-[0_0_35px_rgba(0,240,255,0.45)] transition-all transform hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-3"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
