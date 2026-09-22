import React, { useEffect, useState, useRef } from "react";
import { ArrowRight, Zap } from "lucide-react";

interface CinematicLogoLoaderProps {
  onComplete: () => void;
}

export const CinematicLogoLoader: React.FC<CinematicLogoLoaderProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<"charging" | "powerup" | "climax" | "moving" | "done">("charging");
  const [progress, setProgress] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(7);
  const startTimeRef = useRef<number>(Date.now());

  const handleSkip = () => {
    try {
      sessionStorage.setItem("keylink_intro_played", "true");
    } catch {
      // Safe fallback
    }
    setStage("done");
    onComplete();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // 7-second total duration
    const totalMs = 7000;
    const powerupMs = 2600;   // 0s - 2.6s: Laser scan & energy charge
    const climaxMs = 4800;    // 2.6s - 4.8s: Nexus core illumination & power burst
    const moveMs = 5400;      // 4.8s - 5.4s: HD Climax; 5.4s - 7.0s: Glide to navbar on transparent bg

    // Real-time progress ticker
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPct = Math.min(100, (elapsed / totalMs) * 100);
      setProgress(currentPct);
      setSecondsLeft(Math.max(0, Math.ceil((totalMs - elapsed) / 1000)));
    }, 35);

    // Stage timings
    const powerupTimer = setTimeout(() => {
      setStage("powerup");
    }, powerupMs);

    const climaxTimer = setTimeout(() => {
      setStage("climax");
    }, climaxMs);

    const moveTimer = setTimeout(() => {
      setStage("moving");
    }, moveMs);

    const doneTimer = setTimeout(() => {
      setStage("done");
      try {
        sessionStorage.setItem("keylink_intro_played", "true");
      } catch {
        // Safe fallback
      }
      onComplete();
    }, totalMs);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(powerupTimer);
      clearTimeout(climaxTimer);
      clearTimeout(moveTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (stage === "done") return null;

  const isMoving = stage === "moving";

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
      {/* Dark Ambient & Cyber Grid Backdrop (Fades to 100% transparent during 'moving' phase) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-out pointer-events-auto ${
          isMoving ? "opacity-0 pointer-events-none" : "opacity-100 bg-[#040711]"
        }`}
      >
        {/* Ambient Pulsing Neon Orbs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-fuchsia-600/20 rounded-full blur-[140px] animate-pulse" />
        
        {/* Subtle Cyber Perspective Grid */}
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#00f0ff_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,7,17,0)_0%,rgba(4,7,17,0.95)_100%)]" />

        {/* Top-Right Skip Intro Button */}
        {!isMoving && (
          <div className="absolute top-5 right-6 z-50 pointer-events-auto">
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono font-semibold border border-slate-700/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer group hover:border-cyan-500/50"
            >
              <span>Skip Intro ({secondsLeft}s)</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Bottom Loading Progress Status Bar */}
        {!isMoving && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] flex flex-col items-center space-y-2.5 z-40 pointer-events-auto">
            {/* Holographic Glowing Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)] p-[1px]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 transition-all duration-100 ease-linear shadow-[0_0_14px_rgba(0,240,255,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Dynamic Status Text */}
            <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                {progress < 40
                  ? "SCANNING INFINITY CORE..."
                  : progress < 70
                  ? "CHARGING NEXUS MATRIX..."
                  : progress < 90
                  ? "CALIBRATING KEYLINK 360..."
                  : "DOCKING BRAND LOGO..."}
              </span>
              <span className="text-slate-400 font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 
        AUTHORITATIVE BRAND LOGO CONTAINER
        Smoothly glides from Center -> Top-Left Navbar over a 100% transparent backdrop
      */}
      <div
        style={{
          position: "fixed",
          top: isMoving ? "14px" : "50%",
          left: isMoving ? "16px" : "50%",
          transform: isMoving
            ? "translate(0, 0) scale(0.26)"
            : "translate(-50%, -50%) scale(1)",
          transformOrigin: "top left",
          transition: "all 1600ms cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        className="z-[10000] pointer-events-none flex flex-col items-center justify-center w-[340px] sm:w-[420px] md:w-[480px] h-[340px] sm:h-[420px] md:h-[480px]"
      >
        {/* Core Brand Logo Graphic Element */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Cyber Circular Energy Shockwave Rings */}
          <div
            className={`absolute inset-0 rounded-full border border-cyan-400/30 transition-all duration-1000 ${
              stage === "charging"
                ? "scale-90 opacity-40 animate-ping"
                : stage === "powerup"
                ? "scale-105 border-fuchsia-400/40 opacity-70 animate-pulse"
                : isMoving
                ? "opacity-0 scale-50"
                : "scale-110 border-cyan-400/60 opacity-80"
            }`}
          />

          <div
            className={`absolute inset-4 rounded-full border border-dashed border-fuchsia-500/30 transition-all duration-1000 ${
              stage === "powerup" || stage === "climax"
                ? "animate-[spin_12s_linear_infinite] opacity-60"
                : "opacity-0 scale-75"
            }`}
          />

          {/* Central Glowing Nexus Glow Aura */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
              isMoving
                ? "opacity-90 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]"
                : stage === "climax"
                ? "opacity-100 filter drop-shadow-[0_0_50px_rgba(0,240,255,0.8)] drop-shadow-[0_0_80px_rgba(217,70,239,0.7)]"
                : stage === "powerup"
                ? "opacity-85 filter drop-shadow-[0_0_35px_rgba(0,240,255,0.5)]"
                : "opacity-60 filter drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            }`}
          >
            {/* The Authentic High-Resolution Brand Infinity Key Logo */}
            <img
              src="/brand-infinity-key.png"
              alt="KEYLINK360 Brand Logo"
              className="w-full h-full object-contain select-none filter contrast-110"
              draggable={false}
            />
          </div>

          {/* Particle Sparkle Embers */}
          {!isMoving && (stage === "powerup" || stage === "climax") && (
            <>
              <div className="absolute -top-2 left-1/4 w-2 h-2 bg-cyan-300 rounded-full blur-[1px] shadow-[0_0_8px_#00f0ff] animate-bounce" />
              <div className="absolute -bottom-2 right-1/4 w-2 h-2 bg-fuchsia-400 rounded-full blur-[1px] shadow-[0_0_8px_#d946ef] animate-bounce [animation-delay:0.4s]" />
              <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-sky-300 rounded-full blur-[1px] shadow-[0_0_8px_#38bdf8] animate-pulse" />
              <div className="absolute top-1/2 -left-3 w-1.5 h-1.5 bg-fuchsia-300 rounded-full blur-[1px] shadow-[0_0_8px_#d946ef] animate-pulse" />
            </>
          )}
        </div>

        {/* Brand Name Typography — Fades cleanly during docking */}
        <div
          className={`flex items-center gap-2 mt-4 transition-all duration-500 ${
            isMoving
              ? "opacity-0 translate-y-4 scale-75"
              : stage === "climax"
              ? "opacity-100 scale-100"
              : stage === "powerup"
              ? "opacity-80 scale-95"
              : "opacity-40 scale-90"
          }`}
        >
          <span
            className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            KEYLINK<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500">360</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CinematicLogoLoader;
