import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Briefcase,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Calendar,
  CreditCard,
  Clock,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  FileCheck,
  Star,
  Award,
  Smartphone,
  Layers
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function ServiceStudiosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does appointment and consultation booking work on KeyLink360?",
      a: "You can connect your Calendly, Cal.com, Google Calendar, or direct WhatsApp booking link. You can also require an advance consultation fee or deposit via Razorpay UPI before confirming the appointment slot, reducing client no-shows."
    },
    {
      q: "Can I collect client intake details before the call?",
      a: "Yes! KeyLink360 includes built-in lead forms and intake questionnaires where clients submit their brief, medical history, legal query, or contact details before payment."
    },
    {
      q: "Can I display past client testimonials and case studies?",
      a: "Yes. You can add rich testimonial cards, before/after image sliders, and verified 5-star Google review snippets directly on your professional service profile."
    },
    {
      q: "Can I use my own professional domain name?",
      a: "Yes! You can connect your custom domain (e.g. consult.drsharma.com or appointments.lawyerverma.com) with automated free SSL encryption."
    },
    {
      q: "Is it suitable for clinics, salons, and coaching institutes?",
      a: "Absolutely. KeyLink360 is widely used by doctors, dental clinics, beauty salons, chartered accountants, fitness coaches, and private tutors across India."
    }
  ];

  return (
    <PublicPageLayout activeGroup="solutions">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-indigo-300 text-xs font-bold backdrop-blur-md">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>SOLUTIONS FOR PROFESSIONALS • DOCTORS, LAWYERS & CONSULTANTS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Book Paid Consultations <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400">
                  & Eliminate No-Shows
                </span> <br />
                With Advance UPI.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A high-trust booking hub for professionals. Accept consultation bookings, collect advance deposits via UPI, showcase credentials, and manage client intake seamlessly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Create Professional Hub Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#service-features"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>See Professional Features</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Advance UPI Slot Deposits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Calendly & Cal.com Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>White-Label Branding</span>
                </div>
              </div>
            </div>

            {/* Visual Professional Consultation Hub Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-[38px] p-3 bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 border-4 border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
                <div className="w-full rounded-[30px] bg-[#070b14] border border-slate-800 p-4 space-y-4">
                  
                  {/* Doctor/Consultant Profile Header */}
                  <div className="flex flex-col items-center text-center space-y-2 pt-1">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-sky-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                      <img
                        src="/brand-infinity-key.png"
                        alt="Dr. Priya Mehra"
                        className="w-full h-full rounded-full object-cover bg-slate-900"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center justify-center gap-1">
                        Dr. Priya Mehra, MD
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">Consultant Dermatologist • 12+ Yrs Exp</div>
                    </div>
                  </div>

                  {/* Credentials & Rating Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">Experience</div>
                      <div className="text-xs font-bold text-white">12+ Yrs</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">Rating</div>
                      <div className="text-xs font-bold text-yellow-400">4.9 ★</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[9px] text-slate-400">Consults</div>
                      <div className="text-xs font-bold text-sky-400">4,500+</div>
                    </div>
                  </div>

                  {/* Booking Slots Card */}
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-white">1-on-1 Video Consultation</span>
                        </div>
                        <span className="text-xs font-black text-emerald-400">₹999</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        30-Min Tele-Health Session • Prescription Included
                      </div>
                      <button className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md transition-all">
                        Book Slot & Pay UPI
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-sky-400" />
                        <span className="font-medium text-slate-200">View Clinic Location (Apollo)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">In-Person</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM VS KEYLINK360 SOLUTION */}
      <section className="py-20 border-y border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Unpaid Phone Bookings Result in 40% Cancelled Appointments
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Relying on manual phone calls and unconfirmed calendar links causes wasted hours and lost billable time. Advance commitments protect your professional schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">95% Reduction in No-Shows</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Requiring a small advance consultation deposit via UPI ensures clients show up on time for their scheduled video or clinic appointment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Structured Client Intake</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Collect client briefs, prior reports, and background questions before the call so your actual consultation time is 100% focused on advice.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Institutional Authority</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Present your practice with custom domain branding, verified credentials, patient testimonials, and bank-grade SSL encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROFESSIONAL TOOLKIT MATRIX */}
      <section id="service-features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for High-Trust Professional Practices
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything required to manage professional bookings, payments, and client trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Calendar className="w-5 h-5 text-indigo-400" />,
                title: "Automated Calendar Sync",
                desc: "Integrates with Calendly, Cal.com, Google Calendar, and Outlook."
              },
              {
                icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
                title: "0% Commission Retainers",
                desc: "Collect retainers, hourly rates, and deposit fees directly via Razorpay."
              },
              {
                icon: <Star className="w-5 h-5 text-yellow-400" />,
                title: "Patient & Client Reviews",
                desc: "Embed verified client testimonials and Google 5-Star badges."
              },
              {
                icon: <Layers className="w-5 h-5 text-sky-400" />,
                title: "Intake Forms & File Uploads",
                desc: "Allow clients to attach documents and fill questionnaire forms prior to meetings."
              }
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h4 className="text-base font-bold text-white">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/80 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Professional Booking Solution Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-bold text-indigo-400">KeyLink360 Hub</th>
                    <th className="p-4 font-semibold text-slate-400">Custom Agency Web Build</th>
                    <th className="p-4 font-semibold text-slate-400">Manual Messaging / Chat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Advance Deposit / Booking Fee Support</td>
                    <td className="p-4 text-emerald-400 font-bold">Integrated UPI & Card Checkout</td>
                    <td className="p-4 text-slate-400">Requires Custom Gateway Setup</td>
                    <td className="p-4 text-rose-400">Manual Follow-ups Required</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Mobile Speed & Frictionless Intake</td>
                    <td className="p-4 text-emerald-400 font-bold">Fast Mobile Page + Intake Forms</td>
                    <td className="p-4 text-slate-400">Heavy CMS Template Speeds</td>
                    <td className="p-4 text-slate-400">Unstructured Chat Messages</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Maintenance Overhead</td>
                    <td className="p-4 text-emerald-400 font-bold">Cloud-Managed Infrastructure</td>
                    <td className="p-4 text-slate-400">Server & Plugin Maintenance</td>
                    <td className="p-4 text-emerald-400 font-bold">None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Custom Domain & Verified SSL</td>
                    <td className="p-4 text-emerald-400 font-bold">Standard Support with Auto TLS</td>
                    <td className="p-4 text-slate-400">Separate Certificate Setup</td>
                    <td className="p-4 text-rose-400">No Branded Domain</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ILLUSTRATIVE SCENARIO */}
      <section className="py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-[#04060c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • PROFESSIONAL CONSULTATION WORKFLOW
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Legal & Medical Consultants Streamline Appointment Commitments
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Independent professionals often spend valuable hours coordinating appointments manually, only for uncommitted inquiries to cancel last minute. By using KeyLink360 to accept advance consultation fee deposits via direct UPI and collecting structured client intake questions beforehand, consultants ensure confirmed attendance while protecting their billable hours.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300">
                    PR
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Professional Consultation Architecture</div>
                    <div className="text-xs text-slate-400">Typical Advisory Booking Pattern</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">High Trust</div>
                  <div className="text-xs text-slate-400">Advance Deposit Commitments</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-indigo-400">Direct Gateway</div>
                  <div className="text-xs text-slate-400">Direct Merchant Retainer Settlement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACCORDION FAQS */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything professionals ask about consultation hubs & booking.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-200 hover:text-white"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-indigo-400 shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Build Your High-Trust Booking Hub.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Eliminate no-shows, collect advance consultation fees via UPI, and elevate your professional practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-700"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

    </PublicPageLayout>
  );
}
