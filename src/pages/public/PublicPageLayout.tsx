import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Globe,
  QrCode,
  Link2,
  CreditCard,
  Smartphone,
  Users,
  ShoppingBag,
  Store,
  Stethoscope,
  HelpCircle,
  Mail,
  Phone,
  ExternalLink,
  Bot,
  MessageCircle
} from "lucide-react";
import KeyLogo3D from "../../components/KeyLogo3D";
import CursorGrid from "../../components/CursorGrid";
import SplashCursor from "../../components/SplashCursor";

interface PublicPageLayoutProps {
  children: React.ReactNode;
  activeGroup?: "features" | "solutions" | "support" | "pricing";
}

export default function PublicPageLayout({ children, activeGroup }: PublicPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdown, setFeaturesDropdown] = useState(false);
  const [solutionsDropdown, setSolutionsDropdown] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const handleNavigateHomePricing = () => {
    navigate("/home");
    setTimeout(() => {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans antialiased bg-[#04060c] text-slate-100 selection:bg-cyan-500 selection:text-black">
      
      {/* ===================== REACT BITS INTERACTIVE SPLASH & GRID CURSOR ===================== */}
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1024}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        PRESSURE_ITERATIONS={20}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        SHADING={true}
        COLOR_UPDATE_SPEED={10}
        BACK_COLOR={{ r: 0, g: 0, b: 0 }}
        TRANSPARENT={true}
        RAINBOW_MODE={false}
        COLORS={["#06B6D4", "#A855F7"]}
        zIndex={0}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <CursorGrid
          cellSize={65}
          color="#06b6d4"
          radius={160}
          falloff="smooth"
          holdTime={350}
          fadeDuration={700}
          lineWidth={1.2}
          maxOpacity={0.85}
          fillOpacity={0.05}
          gridOpacity={0.03}
          cellRadius={8}
          clickPulse={true}
          pulseSpeed={550}
          useGlobalPointer={true}
        />
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[800px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />
      </div>

      {/* ===================== PUBLIC HEADER NAVBAR ===================== */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/home" className="flex items-center gap-3 select-none group">
            <KeyLogo3D size="xs" showLabel={false} />
            <span className="font-extrabold text-xl sm:text-2xl text-white tracking-tight flex items-center">
              KeyLink<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400">360</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs lg:text-sm font-semibold text-slate-300">
            <Link
              to="/home"
              className="px-3 py-1.5 rounded-lg hover:text-cyan-300 hover:bg-slate-900/60 transition-colors"
            >
              Home
            </Link>

            {/* Features Menu */}
            <div className="relative" onMouseLeave={() => setFeaturesDropdown(false)}>
              <button
                type="button"
                onClick={() => setFeaturesDropdown(!featuresDropdown)}
                onMouseEnter={() => setFeaturesDropdown(true)}
                className={`px-3 py-1.5 rounded-lg hover:text-cyan-300 hover:bg-slate-900/60 transition-colors flex items-center gap-1 cursor-pointer ${
                  activeGroup === "features" ? "text-cyan-400 bg-slate-900/80" : ""
                }`}
              >
                <span>Features</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {featuresDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 p-2 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    to="/features/bio-websites"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Mobile Bio Websites & AI Sales</div>
                      <div className="text-[10px] text-slate-400">Custom storefronts + AI chat</div>
                    </div>
                  </Link>
                  <Link
                    to="/features/short-links"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Short Links & Stats</div>
                      <div className="text-[10px] text-slate-400">UTM campaign tracking</div>
                    </div>
                  </Link>
                  <Link
                    to="/features/qr-studio"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Dynamic QR Studio</div>
                      <div className="text-[10px] text-slate-400">Change target anytime</div>
                    </div>
                  </Link>
                  <Link
                    to="/features/razorpay-payments"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Razorpay Direct Payments</div>
                      <div className="text-[10px] text-slate-400">Direct UPI & card checkouts</div>
                    </div>
                  </Link>
                  <Link
                    to="/features/custom-domains"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Custom Domain Names</div>
                      <div className="text-[10px] text-slate-400">Free SSL on yourbrand.com</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Solutions Menu */}
            <div className="relative" onMouseLeave={() => setSolutionsDropdown(false)}>
              <button
                type="button"
                onClick={() => setSolutionsDropdown(!solutionsDropdown)}
                onMouseEnter={() => setSolutionsDropdown(true)}
                className={`px-3 py-1.5 rounded-lg hover:text-cyan-300 hover:bg-slate-900/60 transition-colors flex items-center gap-1 cursor-pointer ${
                  activeGroup === "solutions" ? "text-cyan-400 bg-slate-900/80" : ""
                }`}
              >
                <span>Solutions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {solutionsDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 p-2 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    to="/solutions/creators"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <Users className="w-4 h-4 text-pink-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Content Creators</div>
                      <div className="text-[10px] text-slate-400">Instagram, YouTube, Artists</div>
                    </div>
                  </Link>
                  <Link
                    to="/solutions/marketplace-sellers"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Amazon & Marketplace</div>
                      <div className="text-[10px] text-slate-400">App deep linking & promos</div>
                    </div>
                  </Link>
                  <Link
                    to="/solutions/local-shops-d2c"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <Store className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Local Shops & D2C</div>
                      <div className="text-[10px] text-slate-400">WhatsApp catalogs & QR stands</div>
                    </div>
                  </Link>
                  <Link
                    to="/solutions/service-studios"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Doctors & Studios</div>
                      <div className="text-[10px] text-slate-400">Appointments & Consultations</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNavigateHomePricing}
              className="px-3 py-1.5 rounded-lg hover:text-cyan-300 hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              Pricing
            </button>

            <Link
              to="/support"
              className={`px-3 py-1.5 rounded-lg hover:text-cyan-300 hover:bg-slate-900/60 transition-colors ${
                activeGroup === "support" ? "text-cyan-400 bg-slate-900/80" : ""
              }`}
            >
              Support & FAQ
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/login?mode=signup"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Get Started Free →
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-slate-200"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold px-2 py-1">
                Pages & Features
              </div>
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Home
              </Link>
              <Link
                to="/features/bio-websites"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Mobile Bio Websites
              </Link>
              <Link
                to="/features/short-links"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Short Links & Click Stats
              </Link>
              <Link
                to="/features/qr-studio"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Dynamic QR Code Studio
              </Link>
              <Link
                to="/features/razorpay-payments"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Razorpay Direct Payments
              </Link>
              <Link
                to="/features/custom-domains"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Custom Domain Names
              </Link>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold px-2 py-1">
                Solutions & Support
              </div>
              <Link
                to="/solutions/creators"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                For Content Creators
              </Link>
              <Link
                to="/solutions/marketplace-sellers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                For Amazon & Marketplace Sellers
              </Link>
              <Link
                to="/solutions/local-shops-d2c"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                For Local Shops & D2C Brands
              </Link>
              <Link
                to="/solutions/service-studios"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                For Doctors, Salons & Studios
              </Link>
              <Link
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Help & Support FAQ
              </Link>
            </div>

            <div className="pt-3">
              <Link
                to="/login?mode=signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 text-center rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-black text-sm"
              >
                Create Free Account →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===================== MAIN BODY CONTENT ===================== */}
      <main className="flex-1 w-full relative z-10">
        {children}
      </main>

      {/* ===================== OFFICIAL UNIFIED PUBLIC FOOTER ===================== */}
      <footer className="border-t border-slate-800/80 bg-[#04060a] pt-14 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3">
            <Link to="/home" className="flex items-center gap-3 select-none">
              <KeyLogo3D size="xs" showLabel={false} />
              <span className="font-bold text-lg text-white tracking-tight">KeyLink360</span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              KeyLink360 is the complete digital growth platform empowering creators, brands, and sellers to showcase their work, share smart QR codes, and collect online payments.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Operated with care by KeyLink360 Technologies Private Limited.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-slate-400 text-xs">Official Support:</span>
              <a href="mailto:support@keylink360.today" className="text-cyan-400 hover:underline font-mono text-xs">
                support@keylink360.today
              </a>
            </div>
          </div>

          {/* Group 1: FEATURES */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">FEATURES</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <Link to="/features/bio-websites" className="hover:text-cyan-400 transition-colors">
                  Mobile Bio Websites & AI Sales
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-cyan-400 transition-colors">
                  WhatsApp Cloud API & QR Bot
                </Link>
              </li>
              <li>
                <Link to="/features/qr-studio" className="hover:text-cyan-400 transition-colors">
                  Dynamic QR Code Studio
                </Link>
              </li>
              <li>
                <Link to="/features/short-links" className="hover:text-cyan-400 transition-colors">
                  Short Links & Link Rotator
                </Link>
              </li>
              <li>
                <Link to="/features/razorpay-payments" className="hover:text-cyan-400 transition-colors">
                  Razorpay Direct Payments
                </Link>
              </li>
              <li>
                <Link to="/features/custom-domains" className="hover:text-cyan-400 transition-colors">
                  Custom Domain Names & SSL
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 2: SOLUTIONS */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">SOLUTIONS</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <Link to="/solutions/creators" className="hover:text-cyan-400 transition-colors">
                  For Content Creators & Artists
                </Link>
              </li>
              <li>
                <Link to="/solutions/marketplace-sellers" className="hover:text-cyan-400 transition-colors">
                  For Amazon & Marketplace Sellers
                </Link>
              </li>
              <li>
                <Link to="/solutions/local-shops-d2c" className="hover:text-cyan-400 transition-colors">
                  For Local Shops & D2C Brands
                </Link>
              </li>
              <li>
                <Link to="/solutions/service-studios" className="hover:text-cyan-400 transition-colors">
                  For Doctors, Salons & Studios
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 3: ACCOUNT & SUPPORT */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">ACCOUNT</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <Link to="/login" className="hover:text-cyan-400 transition-colors">
                  Sign In to Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login?mode=signup" className="hover:text-cyan-400 transition-colors font-bold text-cyan-400">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-cyan-400 transition-colors">
                  Help & Support FAQ
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 KeyLink360 Technologies Pvt Ltd. All rights reserved.</p>
          <p>KeyLink360 is an independent software platform. All product names, trademarks and logos belong to their respective owners.</p>
        </div>
      </footer>

    </div>
  );
}
