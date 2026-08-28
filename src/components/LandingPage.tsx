import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Smartphone,
  Link2,
  QrCode,
  Globe,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CreditCard,
  Shuffle,
  Users,
  ShoppingBag,
  MessageSquare,
  HelpCircle,
  Menu,
  X,
  Calendar,
  Gift,
  Cpu,
  Clock,
  MapPin,
  Heart,
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";
import KeyLogo3D from "./KeyLogo3D";

interface LandingPageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const navigate = useNavigate();
  const [handleInput, setHandleInput] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isHoveringTestimonial, setIsHoveringTestimonial] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isHoveringPhone, setIsHoveringPhone] = useState(false);
  const [liveTime, setLiveTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guarantee video playback immediately on load
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay handled:", err);
      });
    }
  }, []);


  // Auto-rotate testimonials when not hovered
  useEffect(() => {
    if (isHoveringTestimonial) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % 6);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHoveringTestimonial]);

  // Live device clock — updates every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Standard window scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight || 1;
      const clientHeight = window.innerHeight || 1;
      const docHeight = scrollHeight - clientHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

      setScrollProgress(progress);
      setIsScrolled(scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Mouse tracker with interactive element hover detection and click response
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Check if mouse is hovering over an interactive element
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest('button, a, input, select, textarea, label, [role="button"], .cursor-pointer');
      setIsHoveringInteractive(interactive);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Interactive template rotation slider
  useEffect(() => {
    if (isHoveringPhone) return;
    const interval = setInterval(() => {
      setActiveTemplate((prev) => (prev + 1) % templates.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHoveringPhone]);

  // Instant Snappy Username claim navigation
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = handleInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    window.scrollTo({ top: 0, behavior: "instant" });
    navigate(`/login?mode=register${clean ? `&handle=${encodeURIComponent(clean)}` : ""}`);
  };

  // Instant Snappy Navigation to Login
  const handleGoToLogin = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      navigate("/login");
    }
  };

  // Instant Snappy Navigation to Register
  const handleGoToRegister = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      navigate("/login?mode=register");
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const nextTemplate = () => {
    setActiveTemplate((prev) => (prev + 1) % templates.length);
  };

  const prevTemplate = () => {
    setActiveTemplate((prev) => (prev - 1 + templates.length) % templates.length);
  };

  // 7 4K Photorealistic & Conversion-Optimized Live Blueprints
  const templates = [
    // ── 1. Meera Cooks (Food Creator) ──
    {
      id: "foodcreator",
      category: "Food Content Creator",
      name: "Meera Cooks 🎬",
      bio: "Recipe reels • Behind-the-scenes • Food styling tips ✨ New weekly",
      themeBg: "from-[#160c13] via-[#1c0f18] to-[#0c070a]",
      coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-2xl bg-white/[0.08] border border-white/15 flex flex-col items-center justify-center text-center gap-1 backdrop-blur-sm shadow-sm">
            <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <p className="text-[10px] font-bold text-white leading-tight">🔥 Latest Reel: 2-Minute Mango Salsa</p>
          </div>

          <div className="text-center pt-0.5 pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">
              🍱 TRENDING REELS
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#d94868] to-[#bf3452] text-white shadow-md text-center">
            <p className="text-[11px] font-bold leading-tight">🎬 Butter Chicken in 60 Seconds</p>
            <p className="text-[8.5px] text-pink-100 mt-0.5 font-medium">2.4M views • My most viral reel</p>
          </div>

          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#df973b] to-[#c67e24] text-white shadow-md text-center">
            <p className="text-[11px] font-bold leading-tight">🎬 5 Chutneys You Need to Know</p>
            <p className="text-[8.5px] text-amber-100 mt-0.5 font-medium">1.1M views • Save this one!</p>
          </div>
        </div>
      )
    },

    // ── 2. Arjun Eats (Restaurant Reviewer) ──
    {
      id: "foodreviewer",
      category: "Restaurant Reviewer",
      name: "Arjun Eats 🍽️",
      bio: "Restaurant reviewer • Hidden gems • Honest ratings ⭐ Explorer",
      themeBg: "from-[#18120c] via-[#20170f] to-[#0d0905]",
      coverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#d08c69] to-[#b97451] text-white shadow-md text-center">
            <p className="text-[10px] font-bold leading-tight">🔥 NEW: Best Biryani in Hyderabad — Ranked</p>
            <p className="text-[8.5px] text-orange-100 mt-0.5 font-medium">I tried 12 places so you don't have to</p>
          </div>

          <p className="text-[9px] text-slate-300 text-center px-1 leading-snug font-medium">
            No paid reviews. No sponsored ratings. Just honest food opinions from someone who eats out 5 nights
          </p>

          <div className="text-center pt-0.5 pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">⭐ LATEST REVIEWS</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#d08c69] to-[#b97451] text-white shadow-md text-center">
            <p className="text-[10.5px] font-bold leading-tight">🍛 Maharaja Thali House — 9.2/10</p>
            <p className="text-[8.5px] text-orange-100 mt-0.5 font-medium">Unlimited thali that's actually worth it</p>
          </div>
        </div>
      )
    },

    // ── 3. Radiance Bridal Studio ──
    {
      id: "bridal",
      category: "Bridal Studio & Salon",
      name: "Radiance Bridal Studio 💍",
      bio: "Bridal makeup • Hairstyling • Making every bride feel like royalty",
      themeBg: "from-[#1c1219] via-[#241620] to-[#0e090d]",
      coverImage: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="text-center pt-0.5 pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-pink-100">
              👰 BRIDAL PACKAGES
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#d9aa8f] to-[#c69375] text-[#2c150e] shadow-md text-center">
            <p className="text-[11px] font-bold leading-tight">Complete Bridal Package</p>
            <p className="text-[8.5px] mt-0.5 font-medium text-[#4a261a]">HD makeup, styling, jewellery setting, touch-ups • ₹35,000</p>
          </div>

          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#d9aa8f] to-[#c69375] text-[#2c150e] shadow-md text-center">
            <p className="text-[11px] font-bold leading-tight">Reception Look</p>
            <p className="text-[8.5px] mt-0.5 font-medium text-[#4a261a]">Glamour makeup, hair restyling, outfit draping • ₹18,000</p>
          </div>

          <div className="p-2 rounded-2xl bg-white/[0.08] border border-white/15 text-white shadow-sm text-center backdrop-blur-sm">
            <p className="text-[10.5px] font-bold leading-tight">Engagement / Sangeet • ₹12,000</p>
          </div>
        </div>
      )
    },

    // ── 4. Our Collection (Organic Skincare) ──
    {
      id: "skincare",
      category: "D2C Skincare Brand",
      name: "Our Collection",
      bio: "Explore our complete range of botanical products. Tap to shop",
      themeBg: "from-[#111915] via-[#16211c] to-[#0a110e]",
      coverImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="text-center pt-0.5">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-200">BESTSELLERS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 px-1">
            {["Radiance Serum", "Refreshing Toner", "Nourishing Cream"].map((tag) => (
              <button key={tag} type="button"
                className="px-2.5 py-1 rounded-full bg-[#486358] text-[8.5px] font-bold text-white shadow-sm cursor-pointer hover:bg-[#567568]">
                {tag}
              </button>
            ))}
          </div>

          <div
            onClick={() => copyCode("COLLECTION10")}
            className="p-2.5 rounded-2xl bg-gradient-to-br from-[#3e564d] to-[#2b3d36] border border-dashed border-emerald-300/40 text-white text-center space-y-1 cursor-pointer shadow-md"
          >
            <p className="text-[10.5px] font-bold">10% Off Your Next Order</p>
            <p className="text-[11px] font-mono font-black tracking-widest text-emerald-200">COLLECTION10</p>
            <span className="inline-block px-3 py-1 rounded-lg bg-emerald-400 text-slate-950 text-[9px] font-bold shadow-sm">
              {copiedCoupon === "COLLECTION10" ? "✓ Copied!" : "Shop Now →"}
            </span>
          </div>
        </div>
      )
    },

    // ── 5. FitPulse Pro (Health & Personal Trainer) ──
    {
      id: "fitness",
      category: "Fitness & Nutrition Coach",
      name: "FitPulse Studio 💪",
      bio: "Transformation coach • Customized diet • 1,200+ clients sculpted",
      themeBg: "from-[#11141a] via-[#161a22] to-[#0a0c10]",
      coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-md text-center">
            <p className="text-[10.5px] font-bold leading-tight">🔥 30-Day Fat Loss & Shred Challenge</p>
            <p className="text-[8.5px] text-blue-100 mt-0.5 font-medium">Daily workouts, meal plans & WhatsApp accountability</p>
          </div>

          <div className="text-center pt-0.5 pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">⚡ PROGRAMS & CONSULTING</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.08] border border-blue-400/30 text-white shadow-sm text-center">
            <p className="text-[10.5px] font-bold leading-tight">1:1 Video Diet Consultation — ₹1,999</p>
            <p className="text-[8.5px] text-slate-300 mt-0.5">45-min deep dive + personalized nutrition chart</p>
          </div>

          <button
            type="button"
            onClick={() => alert("Book your fitness consultation!")}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-[10px] shadow-md flex items-center justify-center gap-1 cursor-pointer"
          >
            📅 Book 1:1 Consultation
          </button>
        </div>
      )
    },

    // ── 6. DevStudio Cloud (Software & Tech Creator) ──
    {
      id: "techcreator",
      category: "Tech & Architecture Consultant",
      name: "DevStudio Labs ⚡",
      bio: "Fullstack architecture • Cloud blueprints • 45k+ Dev community",
      themeBg: "from-[#0d141d] via-[#101b27] to-[#070b10]",
      coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-md text-center">
            <p className="text-[10.5px] font-bold leading-tight">🚀 Next.js 15 SaaS Starter Boilerplate</p>
            <p className="text-[8.5px] text-sky-100 mt-0.5 font-medium">Auth, Stripe, Supabase & Tailwind ready • ₹799</p>
          </div>

          <div className="text-center pt-0.5 pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300">💻 DIGITAL ASSETS</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.08] border border-cyan-400/30 text-white shadow-sm text-center">
            <p className="text-[10.5px] font-bold leading-tight">System Design & Tech Advisory — ₹2,499</p>
            <p className="text-[8.5px] text-slate-300 mt-0.5">1-Hour Architecture Review & Cloud Strategy</p>
          </div>

          <button
            type="button"
            onClick={() => alert("Digital assets downloaded!")}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[10px] shadow-md flex items-center justify-center gap-1 cursor-pointer"
          >
            ⚡ Download SaaS Boilerplate
          </button>
        </div>
      )
    },

    // ── 7. Elysian Luxury Villas (Real Estate & Luxury Stays) ──
    {
      id: "realestate",
      category: "Luxury Real Estate & Estates",
      name: "Elysian Luxury Villas 🏡",
      bio: "Private pool villas • Panoramic cliffside views • VIP concierge",
      themeBg: "from-[#19150f] via-[#211b14] to-[#0c0a07]",
      coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=85",
      content: (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#b45309] to-[#92400e] text-white shadow-md text-center">
            <p className="text-[10.5px] font-bold leading-tight">🌟 Signature Palm Grove Estate — 5 BHK</p>
            <p className="text-[8.5px] text-amber-100 mt-0.5 font-medium">Private Infinity Pool, Helipad & Smart Automation</p>
          </div>

          <div className="text-center pt-0.5 pb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">🌴 VIP BOOKING & TOURS</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.08] border border-amber-400/30 text-white shadow-sm text-center">
            <p className="text-[10.5px] font-bold leading-tight">Download Exclusive Villa Brochure (.PDF)</p>
            <p className="text-[8.5px] text-slate-300 mt-0.5">Floor plans, amenities & investment prospectus</p>
          </div>

          <button
            type="button"
            onClick={() => alert("WhatsApp concierge connected for VIP site visit!")}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] shadow-md flex items-center justify-center gap-1 cursor-pointer"
          >
            🏡 Schedule Private Site Visit
          </button>
        </div>
      )
    }
  ];

  const currentTemplate = templates[activeTemplate];

  const faqs = [
    {
      q: "Can I connect my own website name (like mybrand.com)?",
      a: "Yes, absolutely! You can link any domain you already own (like yourname.com or links.yourname.com). KeyLink360 automatically gives you free lifetime SSL security so all your visitors see a secure green padlock."
    },
    {
      q: "What if I print my QR code on 10,000 product boxes and want to change the link later?",
      a: "That's the magic of KeyLink360 Dynamic QR codes! You can change the target website or offer link anytime right from your dashboard. Even after you print thousands of boxes, flyers, or business cards, the QR code instantly opens your newest page without reprinting a single box."
    },
    {
      q: "How easily can I collect money through Google Pay or PhonePe?",
      a: "It takes just 1 minute! Simply add your Razorpay details, and your customers can pay you directly using Google Pay, PhonePe, Paytm, UPI, Debit/Credit Cards, or Net Banking on your page. The money goes directly into your bank account."
    },
    {
      q: "Is the Starter Free plan truly free forever without hidden charges?",
      a: "Yes! The Starter Free plan is 100% free forever. You get unlimited bio pages, your free yourname.keylink360.today address, dynamic QR codes, short links, and customer lead forms with zero credit card needed."
    },
    {
      q: "Can I manage multiple businesses or client brands under one account?",
      a: "Yes! You can easily create separate pages, connect individual custom domains, and manage different client brands all from your single, unified KeyLink360 account."
    },
    {
      q: "What is a Link Rotator and how does it help my business grow?",
      a: "If you have two different product offers or video discounts and want to know which one makes more sales, a Link Rotator automatically splits your visitors (50% to Offer A and 50% to Offer B) so you can double your revenue with real data."
    }
  ];

  return (
    <div
      ref={containerRef}
      className="landing-page-root min-h-screen bg-[#05070d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden"
    >
      {/* Hide OS default cursor ONLY within the landing page */}
      <style>{`
        .landing-page-root,
        .landing-page-root * {
          cursor: none !important;
        }
      `}</style>

      {/* ===================== CUSTOM YELLOW DOUBLE-LINE CIRCLE NAVIGATION CURSOR (FUNCTIONAL CURSOR) ===================== */}
      <div
        className={`pointer-events-none fixed z-40 hidden sm:block -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out ${isMouseDown ? "scale-90" : isHoveringInteractive ? "scale-125" : "scale-100"
          }`}
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`
        }}
      >
        {/* Outer Yellow Navigation Ring */}
        <div
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${isHoveringInteractive
            ? "border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.85)] bg-amber-400/10"
            : "border-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
            }`}
        >
          {/* Inner Concentric Yellow Ring */}
          <div
            className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-150 ${isHoveringInteractive ? "border-yellow-200" : "border-yellow-300/90"
              }`}
          >
            {/* Center Pinpoint Target */}
            <div
              className={`rounded-full transition-all duration-150 ${isHoveringInteractive
                ? "w-2 h-2 bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,1)]"
                : "w-1.5 h-1.5 bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,1)]"
                }`}
            />
          </div>
        </div>
        {/* 4 Precision Navigation Crosshair Ticks */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0.5 h-1.5 bg-amber-400" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-0.5 h-1.5 bg-amber-400" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-0.5 bg-amber-400" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-1.5 h-0.5 bg-amber-400" />
      </div>

      {/* ===================== HERO FULL-PAGE HD BUSINESSMAN CAR ENTRY VIDEO ===================== */}
      <div className="absolute top-0 left-0 right-0 h-[105vh] min-h-[720px] overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover opacity-60 filter brightness-95 contrast-110 scale-105"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Cinematic Soft Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-slate-950/40 to-[#05070d]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/40 to-[#05070d]" />
      </div>

      {/* ===================== ANIMATED CYBER COSMOS BACKGROUND ===================== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out"
          style={{
            transform: `scale(${1 + scrollProgress * 0.15}) translate3d(0, ${-scrollProgress * 50}px, 0)`,
            opacity: 0.85
          }}
        >
          {/* Perspective Grid Matrix (Hidden in 1st Hero section so background video is 100% clean & clear) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0, 240, 255, 0.035) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(99, 102, 241, 0.035) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(to bottom, transparent 0%, transparent 100vh, black 115vh)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 100vh, black 115vh)"
            }}
          />

          {/* Cosmic Glows */}
          <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[140px]" />
          <div className="absolute top-[58%] -right-48 w-[700px] h-[700px] bg-fuchsia-600/15 rounded-full blur-[150px]" />
          <div className="absolute top-[82%] left-1/4 w-[800px] h-[500px] bg-cyan-500/15 rounded-full blur-[150px]" />
        </div>
      </div>

      {/* ===================== NAVBAR (NO BORDER-BOTTOM AT ALL) ===================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 w-full transition-all duration-300 border-none border-b-0 ${isScrolled
          ? "bg-slate-950/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
          : "bg-transparent backdrop-blur-none shadow-none"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Brand Logo (25-30% Increased Size) */}
          <div
            className="flex items-center gap-3.5 select-none cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <KeyLogo3D size="md" showLabel={false} />
            <span className="font-black text-2xl sm:text-[26px] tracking-tight text-white flex items-center drop-shadow transition-transform duration-200 group-hover:scale-105">
              KeyLink<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">360</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-200">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="hover:text-cyan-400 transition-colors drop-shadow cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("solutions")}
              className="hover:text-cyan-400 transition-colors drop-shadow cursor-pointer"
            >
              Who It's For
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("smart-engine")}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 drop-shadow cursor-pointer"
            >
              Traffic Manager
              <span className="text-[9px] font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.2 rounded-full">
                AUTO
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-cyan-400 transition-colors drop-shadow cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="hover:text-cyan-400 transition-colors drop-shadow cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="hover:text-cyan-400 transition-colors drop-shadow cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Action Buttons (Full Page Refresh on Login/Register) */}
          <div className="hidden sm:flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors drop-shadow cursor-pointer"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black text-slate-950 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-[0_0_24px_rgba(0,240,255,0.45)] transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (No bottom border) */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-5 pt-3 pb-6 bg-slate-950/95 backdrop-blur-2xl space-y-3 shadow-2xl animate-in slide-in-from-top-4 duration-200">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-cyan-400 cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("solutions")}
              className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-cyan-400 cursor-pointer"
            >
              Who It's For
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("smart-engine")}
              className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-cyan-400 cursor-pointer"
            >
              Traffic Manager
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-cyan-400 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-cyan-400 cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-cyan-400 cursor-pointer"
            >
              FAQ
            </button>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={handleGoToRegister}
                className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Get Started Free →
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===================== HERO SECTION ===================== */}
      {/* Left: SAMSUNG GALAXY S22 ULTRA Skin | Right: Deeply Human, Touching Headline & Claim Input */}
      <section className="relative pt-24 pb-20 sm:pt-28 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: REAL SAMSUNG GALAXY S22 ULTRA SKIN (SCREEN BEZEL ONLY, NO BACKCASE LOOK) */}
          <div
            className="lg:col-span-5 flex flex-col items-center justify-center relative select-none order-2 lg:order-1"
            onMouseEnter={() => setIsHoveringPhone(true)}
            onMouseLeave={() => setIsHoveringPhone(false)}
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/25 via-indigo-500/20 to-pink-500/15 rounded-3xl blur-3xl -z-10 scale-90" />

            {/* Slider Controls Wrapper */}
            <div className="relative flex items-center justify-center w-full max-w-[320px]">
              {/* Left Arrow */}
              <button
                type="button"
                onClick={prevTemplate}
                className="absolute -left-3 sm:-left-6 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-white/25 text-white flex items-center justify-center shadow-2xl backdrop-blur-2xl transition-all transform hover:scale-110 hover:border-cyan-400 cursor-pointer active:scale-95"
                title="Previous Template"
                aria-label="Previous Template"
              >
                <ChevronLeft className="w-5 h-5 text-slate-200" />
              </button>

              {/* 4K 3D GLOSSY SAMSUNG S22 ULTRA CHASSIS — matches reference exactly */}
              <div className="relative w-[252px] sm:w-[270px]">

                {/* â”€â”€ RIGHT: Volume Up & Down (extruded metal with specular) â”€â”€ */}
                <div className="absolute -right-[4px] top-[86px] w-[4px] h-7 z-40"
                  style={{ background: "linear-gradient(to right, #1a1a1a, #444, #2a2a2a)", borderRadius: "0 3px 3px 0", boxShadow: "inset -1px 0 1px rgba(255,255,255,0.18), 1px 0 3px rgba(0,0,0,0.8)" }} />
                <div className="absolute -right-[4px] top-[124px] w-[4px] h-12 z-40"
                  style={{ background: "linear-gradient(to right, #1a1a1a, #444, #2a2a2a)", borderRadius: "0 3px 3px 0", boxShadow: "inset -1px 0 1px rgba(255,255,255,0.18), 1px 0 3px rgba(0,0,0,0.8)" }} />

                {/* â”€â”€ LEFT: Power/Bixby Button â”€â”€ */}
                <div className="absolute -left-[4px] top-[104px] w-[4px] h-10 z-40"
                  style={{ background: "linear-gradient(to left, #1a1a1a, #444, #2a2a2a)", borderRadius: "3px 0 0 3px", boxShadow: "inset 1px 0 1px rgba(255,255,255,0.18), -1px 0 3px rgba(0,0,0,0.8)" }} />

                {/* â”€â”€ OUTER BODY: Deep 4K Gloss Black Glass Frame â”€â”€ */}
                <div style={{
                  borderRadius: "36px",
                  padding: "5px",
                  background: "linear-gradient(160deg, #2a2a2a 0%, #0a0a0a 40%, #111 70%, #1e1e1e 100%)",
                  boxShadow: "0 40px 90px -15px rgba(0,0,0,0.99), 0 0 0 0.5px rgba(255,255,255,0.06), inset 0 1.5px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,1), inset 2px 0 4px rgba(255,255,255,0.03), inset -2px 0 4px rgba(255,255,255,0.03)"
                }}>

                  {/* â”€â”€ TOP GLASS SPECULAR REFLECTION (4K depth effect) â”€â”€ */}
                  <div style={{
                    position: "absolute", top: "5px", left: "18px", right: "18px", height: "45%",
                    borderRadius: "32px 32px 50% 50%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 60%, transparent 100%)",
                    pointerEvents: "none", zIndex: 50
                  }} />

                  {/* â”€â”€ INNER BEZEL: Pure Pitch Black â”€â”€ */}
                  <div style={{
                    borderRadius: "31px",
                    padding: "2px",
                    background: "#020202",
                    boxShadow: "inset 0 0 8px rgba(0,0,0,0.95)"
                  }}>

                    {/* â”€â”€ AMOLED DISPLAY GLASS â”€â”€ */}
                    <div
                      className={`w-full flex flex-col text-slate-200 transition-colors duration-500 bg-gradient-to-b ${currentTemplate.themeBg}`}
                      style={{ height: "530px", borderRadius: "29px", overflow: "hidden" }}
                    >
                      {/* â”€ Status Bar â”€ */}
                      <div className="w-full shrink-0 flex items-center justify-between px-4 pt-3 pb-1 z-30">
                        {/* Live Real Time */}
                        <span className="text-[11px] font-bold text-white tracking-tight tabular-nums">{liveTime}</span>

                        {/* Center Punch-Hole Camera */}
                        <div className="w-[11px] h-[11px] rounded-full flex items-center justify-center"
                          style={{ background: "#000", boxShadow: "0 0 0 1px #111, inset 0 1px 2px rgba(0,0,0,0.9)" }}>
                          <div className="w-[5px] h-[5px] rounded-full"
                            style={{ background: "radial-gradient(circle at 35% 35%, #0d2a3a, #000)" }} />
                        </div>

                        {/* Signal + Battery */}
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                            <rect x="0" y="5" width="2" height="4" rx="0.5" fill="white" fillOpacity="0.45" />
                            <rect x="3" y="3" width="2" height="6" rx="0.5" fill="white" fillOpacity="0.65" />
                            <rect x="6" y="1.5" width="2" height="7.5" rx="0.5" fill="white" fillOpacity="0.85" />
                            <rect x="9" y="0" width="2" height="9" rx="0.5" fill="white" />
                          </svg>
                          <div className="flex items-center gap-[2px]">
                            <div className="w-[17px] h-[8px] rounded-[2px] border border-white/75 p-[1.5px] flex items-center">
                              <div className="h-full w-[78%] bg-white rounded-[1px]" />
                            </div>
                            <div className="w-[2px] h-[4px] bg-white/45 rounded-r-sm" />
                          </div>
                        </div>
                      </div>

                      {/* ── Scrollable Screen Content ── */}
                      <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
                        {/* 45% Height 4K Hero Photo with Seamless Multi-Stop Zero-Line Fade */}
                        <div className="w-full h-[230px] sm:h-[238px] relative overflow-hidden shrink-0 flex flex-col justify-end">
                          <img
                            src={currentTemplate.coverImage}
                            alt={currentTemplate.name}
                            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
                          />
                          {/* Dual-layer seamless fading mask: removes any hard edge */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/95" />
                          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0e0a12] via-[#0e0a12]/80 to-transparent" />

                          {/* Overlaid Title & Subtitle */}
                          <div className="relative z-10 px-3 pb-2.5 text-center flex flex-col items-center">
                            <h3 className="font-extrabold text-[15px] sm:text-[16px] text-white tracking-tight leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                              {currentTemplate.name}
                            </h3>
                            <p className="text-[10px] text-slate-200 leading-snug mt-1 max-w-[220px] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                              {currentTemplate.bio}
                            </p>
                          </div>
                        </div>

                        {/* Dynamic Interactive Cards Content */}
                        <div className="px-3 py-3 animate-in fade-in duration-300 flex-1">
                          {currentTemplate.content}
                        </div>
                      </div>

                      {/* Bottom Gesture Bar */}
                      <div className="shrink-0 py-2 flex justify-center">
                        <div className="w-20 h-[3px] rounded-full bg-white/20" />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={nextTemplate}
                className="absolute -right-3 sm:-right-6 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-white/25 text-white flex items-center justify-center shadow-2xl backdrop-blur-2xl transition-all transform hover:scale-110 hover:border-cyan-400 cursor-pointer active:scale-95"
                title="Next Template"
                aria-label="Next Template"
              >
                <ChevronRight className="w-5 h-5 text-slate-200" />
              </button>
            </div>

            {/* Smart & Unique Blueprint Subtitle */}
            <div className="mt-3.5 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-300">
                Live Blueprints — <span className="text-amber-400 font-bold">Interactive engines built to convert & monetize</span>
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Deeply Human, Touching Headline & Claim Input */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left order-1 lg:order-2">
            {/* Cyberpunk Live Status Beacon (Blinking Radar - NO emoji) */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-extrabold tracking-wider uppercase shadow-[0_0_24px_rgba(0,240,255,0.35)] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_10px_#00f0ff]"></span>
              </span>
              <span>CRAFTED FOR CREATORS, SELLERS & PASSIONATE BUILDERS</span>
            </div>

            {/* Main Headline (Touching, Inspiring & Clear) */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.12] text-white">
              Your Life's Work, Products & Passion{" "}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.45)]">
                All in One Beautiful Link.
              </span>
            </h1>

            {/* Emotionally Resonant Subtitle */}
            <p className="text-base sm:text-lg text-slate-300/95 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              You pour your heart and soul into what you create. KeyLink360 gives you a stunning, personalized mobile home to share your story, showcase your products, book appointments, and collect instant UPI payments — completely on your own terms.
            </p>

            {/* Username Claim Form (Fresh Page Navigation) */}
            <form
              onSubmit={handleClaim}
              className="max-w-xl mx-auto lg:mx-0 p-1.5 sm:p-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl sm:rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col sm:flex-row items-center gap-2 group hover:border-cyan-500/60 transition-all duration-300"
            >
              <div className="flex items-center w-full px-4 py-2 sm:py-1">
                <span className="text-slate-400 font-mono text-sm sm:text-base select-none shrink-0">
                  keylink360.today/
                </span>
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent border-none outline-none font-bold text-white placeholder-slate-500 text-sm sm:text-base px-1.5"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl sm:rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-sm whitespace-nowrap shadow-[0_0_24px_rgba(0,240,255,0.45)] transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                Create Your Free Link in 2 Mins →
              </button>
            </form>

            {/* Trust & Guarantee Badges */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-400 shrink-0 fill-pink-400/20" />
                100% Free Forever Plan
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Custom Domain with Free SSL
              </span>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
                Dynamic QR Codes That Never Expire
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                Instant UPI & Razorpay Payments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== WHO IT'S FOR (3 VISUAL STORY CARDS) ===================== */}
      <section id="solutions" className="py-24 border-t border-slate-800/80 bg-slate-950/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Engineered for Revenue</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">Everyone Who Sells</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Whether you sell digital downloads, physical products, consultation slots, or creator presets — KeyLink360 is custom-built to maximize your revenue.
            </p>
          </div>

          {/* 3 Large Visual Story Cards (Like Reference Site) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Content Creators */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 group flex flex-col justify-between relative">
              <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                  alt="Content Creators"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md">
                  CREATORS & INFLUENCERS
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Monetize Your Audience Directly
                </h3>
                <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                  Put your YouTube videos, Spotify tracks, digital presets, and fan tips in one high-converting storefront link without losing followers to algorithms.
                </p>
              </div>
            </div>

            {/* Card 2: E-Commerce & Amazon Sellers */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 group flex flex-col justify-between relative">
              <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0a67e5572293?w=800&auto=format&fit=crop&q=80"
                  alt="Amazon & Marketplace Sellers"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                  AMAZON & D2C SELLERS
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Turn Packaging Into Repeat Sales
                </h3>
                <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                  Print dynamic QR codes on product inserts for warranty registration, how-to video guides, and authentic 5-star Google & Amazon reviews.
                </p>
              </div>
            </div>

            {/* Card 3: Local Studios & Salons */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 group flex flex-col justify-between relative">
              <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
                  alt="Doctors, Studios & Professionals"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                  SERVICES & STUDIOS
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Zero Commission Bookings & UPI
                </h3>
                <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                  Let clients book appointment slots 24/7, save your .vcf contact card with 1-tap, and collect instant UPI payments directly into your bank.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ===================== SMART TRAFFIC MANAGER (EMOTIONAL & EMPOWERING) ===================== */}
      <section id="smart-engine" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Touching Business Copy */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>YOUR 24/7 DIGITAL GROWTH COMPANION</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Never Miss a Customer,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                Even While You Sleep.
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Building a business is hard work. Let KeyLink360 take care of your traffic quietly in the background. See which posts or videos bring real buyers, update destination links instantly in 1 second, and ensure your customers always reach your active offers without broken links.
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300 pt-1">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Crystal-Clear Insights:</strong> See total clicks, visitor cities, and devices in real-time without confusing spreadsheets.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">1-Second Destination Calibration:</strong> Update where your links or QR codes point anytime without disturbing your ongoing ads.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Smart Traffic Balancing:</strong> Share one single link that smoothly splits traffic to find which offer gets you the most sales.
                </span>
              </li>
            </ul>
          </div>

          {/* Right: Clean Live Stats Card */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xl font-bold text-cyan-400">Live Traffic</span>
                <p className="text-[11px] text-slate-400">Tracked in real time</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xl font-bold text-emerald-400">Instant UPI</span>
                <p className="text-[11px] text-slate-400">Direct to your bank</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xl font-bold text-sky-400">99.99% Uptime</span>
                <p className="text-[11px] text-slate-400">Always online globally</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xl font-bold text-fuchsia-400">+50% Sales</span>
                <p className="text-[11px] text-slate-400">Higher conversion rate</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Real-Time Performance</span>
                <span className="text-emerald-400 font-bold">✓ System Optimal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Visitors Tracked</span>
                <span className="text-white font-bold">12,450 Clicks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Online Payments Collected</span>
                <span className="text-emerald-400 font-bold">₹1,45,200</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 6 CORE SIMPLE FEATURES ===================== */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Everything You Need to Grow,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400">
              Simple & Beautiful
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Packed with professional tools engineered to help you earn more revenue without needing to hire a web developer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 01. Bio Storefronts */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 transition-all duration-300 group hover:shadow-[0_0_35px_rgba(0,240,255,0.2)] relative flex flex-col justify-between hover:-translate-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-cyan-400/40 group-hover:text-cyan-400 transition-colors">01</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">Stunning Mobile Storefronts</h3>
              <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                Design a mobile bio website that looks like a luxury custom app. Pick from 27 interactive blocks: Videos, Music, Products, Coupons, and Appointment forms.
              </p>
            </div>
          </div>

          {/* 02. Dynamic QR Codes */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 transition-all duration-300 group hover:shadow-[0_0_35px_rgba(168,85,247,0.2)] relative flex flex-col justify-between hover:-translate-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-purple-400/40 group-hover:text-purple-400 transition-colors">02</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">Permanent Dynamic QR Codes</h3>
              <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                Print your QR code once on product boxes, dining tables, or visiting cards. Change where it leads anytime with zero reprinting costs.
              </p>
            </div>
          </div>

          {/* 03. Direct Payments */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 transition-all duration-300 group hover:shadow-[0_0_35px_rgba(16,185,129,0.2)] relative flex flex-col justify-between hover:-translate-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-emerald-400/40 group-hover:text-emerald-400 transition-colors">03</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">Direct UPI & Card Payments</h3>
              <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                Capture customer details and receive instant payments via Google Pay, PhonePe, Paytm, Cards, and Net Banking directly into your bank account.
              </p>
            </div>
          </div>

          {/* 04. Custom Domain */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 group hover:shadow-[0_0_35px_rgba(99,102,241,0.2)] relative flex flex-col justify-between hover:-translate-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-indigo-400/40 group-hover:text-indigo-400 transition-colors">04</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Your Own Custom Domain & Free SSL</h3>
              <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                Connect your own domain address (like yourbrand.com) with 100% free lifetime SSL security, making your brand look authoritative and professional.
              </p>
            </div>
          </div>

          {/* 05. A/B Rotators */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 transition-all duration-300 group hover:shadow-[0_0_35px_rgba(245,158,11,0.2)] relative flex flex-col justify-between hover:-translate-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
                  <Shuffle className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-amber-400/40 group-hover:text-amber-400 transition-colors">05</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">A/B Testing Link Rotators</h3>
              <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                Split incoming traffic 50/50 across different landing pages or discounts to easily discover what your audience loves most.
              </p>
            </div>
          </div>

          {/* 06. Short Links */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/60 transition-all duration-300 group hover:shadow-[0_0_35px_rgba(56,189,248,0.2)] relative flex flex-col justify-between hover:-translate-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 group-hover:scale-110 transition-transform">
                  <Link2 className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-sky-400/40 group-hover:text-sky-400 transition-colors">06</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">Smart Memorable Short Links</h3>
              <p className="text-slate-300/85 text-xs sm:text-sm leading-relaxed">
                Turn long messy URLs into clean, branded short links that build instant trust on Instagram, WhatsApp, and SMS messages.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ===================== DEEP REAL-TIME ANALYTICS SECTION (Go Deeper Than Any Spreadsheet) ===================== */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Go Deeper Than <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">Any Spreadsheet</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Understand your audience in real time. Track exact clicks, geographic sources, device breakdowns, and conversion metrics without complex setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Live Click Analytics Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Live Clicks & Visits</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">+48% vs Last Week</span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-3xl font-black text-white">48,290 <span className="text-xs font-normal text-slate-400">total visits</span></p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-sky-400 h-full w-[78%] rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                See instant click updates the millisecond a visitor taps your bio link on Instagram, TikTok, or WhatsApp.
              </p>
            </div>

            {/* 2. Conversion & Revenue Tracking Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Revenue & Sales</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">₹1.84L Earned</span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-3xl font-black text-white">3.8x <span className="text-xs font-normal text-slate-400">ROI multiplier</span></p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-400 to-indigo-400 h-full w-[85%] rounded-full" />
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect Razorpay to monitor product sales, appointment bookings, and direct UPI transfers in one clean dashboard.
              </p>
            </div>

            {/* 3. Traffic Sources & Device Intelligence Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Referral & Devices</span>
                <span className="text-[10px] font-mono text-sky-300 bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 rounded-full">92% Mobile</span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-3xl font-black text-white">Top 10 <span className="text-xs font-normal text-slate-400">traffic channels</span></p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-400 to-cyan-400 h-full w-[92%] rounded-full" />
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Know exactly which social platforms and QR placement locations bring your highest-spending customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS (3 SIMPLE STEPS) ===================== */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <span>Fast & Effortless</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Up and Running in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">3 Simple Steps</span>
          </h2>
          <p className="text-slate-400 text-sm">No coding skills or technical knowledge required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-lg mx-auto shadow-md">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Pick Your Style</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Choose from 50+ beautiful templates designed for creators, shops, and salons, or start fresh with a blank canvas.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-lg mx-auto shadow-md">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Add Your Content & Offers</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Add your videos, product items, discount coupons, or Razorpay payment buttons in a few clicks.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-lg mx-auto shadow-md">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Publish & Share with Pride</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Place your link in your Instagram bio, print your QR code on boxes, or share directly on WhatsApp with your customers.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== SIMPLE TRANSPARENT PRICING ===================== */}
      <section id="pricing" className="py-20 bg-slate-950/70 border-t border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <span>Fair & Transparent</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Start Free. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Upgrade When You Grow.</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              No hidden fees, no credit card required. We believe every entrepreneur deserves great tools from day one.
            </p>

            {/* Monthly / Yearly Switcher */}
            <div className="pt-3 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-white" : "text-slate-400"}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="w-14 h-7 rounded-full bg-slate-800 p-1 relative border border-slate-700 transition-colors cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-transform ${billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
                    }`}
                />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-white" : "text-slate-400"}`}>
                Yearly
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Save 50%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Starter Free</h3>
                  <p className="text-xs text-slate-400 mt-1">Perfect for creators and early-stage entrepreneurs.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">₹0</span>
                  <span className="text-xs text-slate-400 font-medium">/ forever</span>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Mobile Bio Pages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free yourname.keylink360.today Link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>27 Dynamic Interactive Page Blocks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dynamic Smart QR Code Studio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Short Links with Real-Time Click Stats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Customer Lead Capture Form</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleGoToRegister}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all border border-slate-700 cursor-pointer"
                >
                  Create Free Account
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-cyan-500/60 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-400 to-indigo-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md">
                Recommended
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Pro Business</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">For scaling brands, commercial sellers, and studios.</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-300">
                      {billingCycle === "monthly" ? "₹199" : "₹999"}
                    </span>
                    <span className="text-lg sm:text-xl font-semibold text-slate-500 line-through">
                      {billingCycle === "monthly" ? "₹499" : "₹1,999"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {billingCycle === "monthly" ? "/ month" : "/ year"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                    <span>Limited Offer {billingCycle === "monthly" ? "— Save 60%" : "— Save 50%"}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Everything in Starter Free, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Use Your Own Domain (yourbrand.com)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Free Lifetime Security SSL Certificate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Razorpay Direct Payments (Instant UPI & Cards)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>A/B Split Testing Link Rotators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Meta Facebook & Google Tracking Pixels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Custom Logo Center on Vector QR Codes</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleGoToRegister}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-sm shadow-[0_0_24px_rgba(0,240,255,0.45)] transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  Upgrade to Pro Business →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HUMAN-CENTRIC INTERACTIVE TESTIMONIALS SLIDER (6 REVIEWS) ===================== */}
      <section className="py-24 bg-slate-950/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
              <span>Real People, Real Success</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by Thousands of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">Growing Businesses</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Hear directly from real founders, content creators, doctors, and brand owners who transformed their online revenue using KeyLink360.
            </p>
          </div>

          {/* Slider Wrapper with Hover Detection */}
          <div
            className="relative px-2 sm:px-12 select-none"
            onMouseEnter={() => setIsHoveringTestimonial(true)}
            onMouseLeave={() => setIsHoveringTestimonial(false)}
          >
            {/* Left Navigation Arrow */}
            <button
              type="button"
              onClick={() => setTestimonialIndex((prev) => (prev - 1 + 6) % 6)}
              className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-2xl backdrop-blur-xl transition-all transform hover:scale-110 hover:border-cyan-400 cursor-pointer active:scale-95"
              title="Previous Review"
              aria-label="Previous Review"
            >
              <ChevronLeft className="w-6 h-6 text-cyan-400" />
            </button>

            {/* Reviews Container (3-Card Active Window, Smooth Rotation) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500">
              {[0, 1, 2].map((offset) => {
                const reviewList = [
                  {
                    name: "Priya Sharma",
                    role: "Founder, Aura Apparels",
                    avatarBg: "from-cyan-500 to-indigo-600",
                    initials: "PS",
                    headline: '"Our online sales tripled within 3 weeks"',
                    text: "As a solo fashion brand founder, KeyLink360 made my storefront look like a luxury mobile app. Customers love paying directly with Google Pay and UPI right on my bio page!",
                    verified: "Verified Brand Founder",
                    tagColor: "text-cyan-400 bg-cyan-950/80 border-cyan-500/30"
                  },
                  {
                    name: "MS Vigensh",
                    role: "Tech Creator (450k Subs)",
                    avatarBg: "from-pink-500 to-orange-500",
                    initials: "VR",
                    headline: '"Dynamic QR codes saved us ₹45,000 in reprinting"',
                    text: "I printed KeyLink360 dynamic QR codes on 15,000 product boxes. Whenever I launch a new YouTube video or discount preset, I update the link in seconds without reprinting anything!",
                    verified: "Verified Creator",
                    tagColor: "text-pink-400 bg-pink-950/80 border-pink-500/30"
                  },
                  {
                    name: "Dr. Rajesh",
                    role: "Dermatologist & Studio Lead",
                    avatarBg: "from-emerald-500 to-teal-600",
                    initials: "AD",
                    headline: '"Clients book appointments 24/7 without phone calls"',
                    text: "Our front desk used to get 50+ phone calls daily for appointment bookings. Now patients tap our KeyLink360 link on Instagram, pick a slot, and deposit advance fees seamlessly.",
                    verified: "Verified Healthcare Studio",
                    tagColor: "text-emerald-400 bg-emerald-950/80 border-emerald-500/30"
                  },
                  {
                    name: "Rajesh & Sneha Mehta",
                    role: "Co-Founders, SpiceBistro",
                    avatarBg: "from-amber-500 to-orange-600",
                    initials: "RM",
                    headline: '"Direct UPI orders saved us 30% Swiggy commission"',
                    text: "KeyLink360 allowed us to share our direct digital food menu with dynamic UPI QR codes. We now process 200+ direct orders daily and save thousands in commission fees.",
                    verified: "Verified Food Brand",
                    tagColor: "text-amber-400 bg-amber-950/80 border-amber-500/30"
                  },
                  {
                    name: "MS Vignesh",
                    role: "Founder & Lead Architect",
                    avatarBg: "from-cyan-500 via-indigo-500 to-violet-600",
                    initials: "MV",
                    headline: '"Connecting custom domains took less than 2 minutes"',
                    text: "Managing 20+ client bio pages under individual custom domains was a nightmare until we found KeyLink360. The A/B link rotator alone doubled our ad campaign conversion rates.",
                    verified: "Verified Agency Lead",
                    tagColor: "text-indigo-400 bg-indigo-950/80 border-indigo-500/30"
                  },
                  {
                    name: "Krishna",
                    role: "Handmade Jewelry Artisan",
                    avatarBg: "from-sky-500 to-cyan-600",
                    initials: "KN",
                    headline: '"My bio link feels like a luxury mobile shopping app"',
                    text: "I used to send messy Google Drive links to buyers. KeyLink360 gave me a gorgeous mobile storefront with discount code popups. My customers are constantly complimenting it!",
                    verified: "Verified Artisan Seller",
                    tagColor: "text-sky-400 bg-sky-950/80 border-sky-500/30"
                  }
                ];

                const currentIndex = (testimonialIndex + offset) % reviewList.length;
                const review = reviewList[currentIndex];

                return (
                  <div
                    key={currentIndex}
                    className="p-7 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between space-y-6 group"
                  >
                    <div className="space-y-3.5">
                      {/* 5 Stars Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${review.tagColor}`}>
                          {review.verified}
                        </span>
                      </div>

                      {/* Headline & Body Text */}
                      <h4 className="text-base font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                        {review.headline}
                      </h4>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                        {review.text}
                      </p>
                    </div>

                    {/* Author Footer */}
                    <div className="flex items-center gap-3.5 pt-4 border-t border-slate-800/80">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${review.avatarBg} flex items-center justify-center font-black text-white text-xs shadow-md shrink-0`}>
                        {review.initials}
                      </div>
                      <div>
                        <h5 className="text-sm font-extrabold text-white leading-tight">{review.name}</h5>
                        <p className="text-xs text-slate-400 font-medium">{review.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Navigation Arrow */}
            <button
              type="button"
              onClick={() => setTestimonialIndex((prev) => (prev + 1) % 6)}
              className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-2xl backdrop-blur-xl transition-all transform hover:scale-110 hover:border-cyan-400 cursor-pointer active:scale-95"
              title="Next Review"
              aria-label="Next Review"
            >
              <ChevronRight className="w-6 h-6 text-cyan-400" />
            </button>

            {/* Slider Dots Navigation (6 Dots) */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setTestimonialIndex(dotIdx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${testimonialIndex === dotIdx
                    ? "w-8 bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                    : "w-2.5 bg-slate-700 hover:bg-slate-500"
                    }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clear Answers</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Questions</span>
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${expandedFaq === idx ? "rotate-180 text-cyan-400" : ""
                    }`}
                />
              </button>
              {expandedFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SIMPLE BOTTOM CTA (No background box) ===================== */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Ready to build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400">dream link presence?</span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Takes less than 2 minutes to get started. Join thousands of creators, brands, and sellers thriving on KeyLink360.
        </p>
        <div className="pt-3">
          <button
            type="button"
            onClick={handleGoToRegister}
            className="px-10 py-4.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_35px_rgba(0,240,255,0.5)] transition-all transform hover:scale-105 cursor-pointer"
          >
            Get Started for Free Today →
          </button>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-slate-800/80 bg-[#04060a] pt-14 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3">
            <div
              className="flex items-center gap-3 select-none cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <KeyLogo3D size="xs" showLabel={false} />
              <span className="font-bold text-lg text-white tracking-tight">KeyLink360</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              KeyLink360 is the complete digital growth platform empowering creators, brands, and sellers to showcase their work, share smart QR codes, and collect online payments.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Operated with care by KeyLink360 Technologies Private Limited.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-slate-400 text-xs">Official Support:</span>
              <a href="mailto:support@keylink360.today" className="text-cyan-400 hover:underline font-mono text-xs cursor-pointer">
                support@keylink360.today
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">FEATURES</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <button type="button" onClick={() => scrollToSection("features")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Mobile Bio Websites
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("features")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Short Links & Click Stats
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("features")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Dynamic QR Code Studio
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("features")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Razorpay Direct Payments
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("pricing")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Custom Domain Names
                </button>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">SOLUTIONS</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <button type="button" onClick={() => scrollToSection("solutions")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  For Content Creators & Artists
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("solutions")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  For Amazon & Marketplace Sellers
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("solutions")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  For Local Shops & D2C Brands
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("solutions")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  For Doctors, Salons & Studios
                </button>
              </li>
            </ul>
          </div>

          {/* Portal */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">ACCOUNT</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <button type="button" onClick={handleGoToLogin} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Sign In to Dashboard
                </button>
              </li>
              <li>
                <button type="button" onClick={handleGoToRegister} className="hover:text-cyan-400 transition-colors font-bold text-cyan-400 cursor-pointer">
                  Create Free Account
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection("faq")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Help & Support FAQ
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <p className="text-[11px] text-slate-500">
            © 2026 KeyLink360 Technologies Pvt Ltd. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-600 max-w-lg">
            KeyLink360 is an independent software platform. All product names, trademarks and logos belong to their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}





