import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
}

/**
 * All Supported World Languages
 * TAMIL is placed strictly at TOP 1st in the list!
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  // ── 1. TAMIL (TOP 1ST POSITION) ──
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", region: "India, Sri Lanka, Singapore, Malaysia" },

  // ── MAJOR WORLD & REGIONAL LANGUAGES ──
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", region: "Global / International" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "India" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", region: "India" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", region: "India" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", region: "India" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", region: "India" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", region: "India, Bangladesh" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", region: "India" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳", region: "India, Pakistan" },
  
  // European & Americas
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "Spain, Latin America" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", region: "France, Canada, Africa" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", region: "Germany, Austria, Switzerland" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", region: "Brazil, Portugal" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", region: "Italy" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", region: "Russia, Eastern Europe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", region: "Netherlands, Belgium" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", region: "Poland" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪", region: "Sweden" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷", region: "Greece, Cyprus" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴", region: "Romania" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿", region: "Czech Republic" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺", region: "Hungary" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰", region: "Denmark" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮", region: "Finland" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴", region: "Norway" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", region: "Ukraine" },

  // Middle East & Africa
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", region: "Middle East, North Africa" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", region: "Israel" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", region: "Iran" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", region: "Pakistan, India" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", region: "Turkey" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪", region: "East Africa" },

  // East & Southeast Asia
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", region: "China, Singapore" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "Japan" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", region: "South Korea" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", region: "Malaysia, Brunei" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", region: "Vietnam" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", region: "Thailand" }
];

/** Native Clean Translation Dictionaries (No awkward English in parentheses) */
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // ── 1. TAMIL (CLEAN NATIVE TAMIL) ──
  ta: {
    // Navigation Categories
    "cat.smart_marketing": "ஸ்மார்ட் மார்க்கெட்டிங்",
    "cat.tools": "கருவிகள் & அமைப்புகள்",
    "cat.account_preferences": "கணக்கு & விருப்பங்கள்",
    "cat.platform_owner": "தள உரிமையாளர்",

    // Navigation Items
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.bio_pages": "பயோ பக்கங்கள்",
    "nav.contacts": "தொடர்புகள்",
    "nav.whatsapp": "வாட்ஸ்அப்",
    "nav.links": "இணைப்புகள்",
    "nav.link_rotator": "சுழலும் இணைப்புகள்",
    "nav.qr_codes": "QR குறியீடுகள்",
    "nav.templates": "டெம்ப்ளேட்டுகள்",
    "nav.integrations": "இணைப்புகள்",
    "nav.pixels": "டிராக்கிங் பிக்சல்கள்",
    "nav.media_library": "மீடியா நூலகம்",
    "nav.custom_domains": "சொந்த டொமைன்கள்",
    "nav.settings": "அமைப்புகள்",
    "nav.control_center": "கட்டுப்பாட்டு மையம்",

    // Header
    "header.publish": "வெளியிடு",
    "header.notifications": "அறிவிப்புகள்",
    "header.mark_all_read": "அனைத்தையும் படித்ததாகக் குறிக்கவும்",
    "header.system_operational": "கணினி சிறப்பாக செயல்படுகிறது",
    "header.profile": "சுயவிவரம்",
    "header.sign_out": "வெளியேறு",

    // Dashboard Screen
    "dash.welcome_back": "மீண்டும் வருக,",
    "dash.visitor_activity": "பார்வையாளர்களின் நேரடி செயல்பாடுகள்.",
    "dash.total_views": "மொத்த பார்வைகள்",
    "dash.total_clicks": "மொத்த கிளிக்குகள்",
    "dash.registrations": "பதிவான லீட்ஸ்",
    "dash.active_pages": "செயலில் உள்ள பயோ பக்கங்கள்",
    "dash.quick_access": "விரைவு உருவாக்க ஸ்டுடியோ",
    "dash.click_performance": "கிளிக் செயல்திறன் கண்ணோட்டம்",
    "dash.top_pages": "சிறந்த பயோ பக்கங்கள்",
    "dash.interactive_guides": "நேரடி செயல்முறை வழிகாட்டிகள் & ஆவணங்கள்",
    "dash.explore_guides": "வழிகாட்டிகளைக் காண்க →",

    // Bio Pages Screen
    "biopages.title": "பயோ பக்கங்கள்",
    "biopages.subtitle": "AI சாட்பாட் மற்றும் நேரடி வாடிக்கையாளர் பதிவு வசதியுடன் கூடிய நவீன லேண்டிங் பக்கங்கள்.",
    "biopages.create_new": "புதிய பயோ பக்கம் உருவாக்கு",
    "biopages.edit_design": "வடிவமைப்பை திருத்து",
    "biopages.copy_url": "இணைப்பை நகலெடு",
    "biopages.preview": "முன்னோட்டம்",
    "biopages.views": "பார்வைகள்",
    "biopages.clicks": "கிளிக்குகள்",

    // Contacts Screen
    "contacts.title": "வாடிக்கையாளர் தொடர்புகள் & லீட்ஸ்",
    "contacts.subtitle": "பயோ சாட்பாட் மற்றும் வாட்ஸ்அப் மூலம் திரட்டப்பட்ட வாடிக்கையாளர் விவரங்கள்.",
    "contacts.add_contact": "புதிய தொடர்பு சேர்",
    "contacts.export_csv": "CSV ஏற்றுமதி செய்",
    "contacts.search_placeholder": "பெயர், எண், மின்னஞ்சல் மூலம் தேடுக...",
    "contacts.name": "பெயர்",
    "contacts.phone": "தொலைபேசி எண்",
    "contacts.email": "மின்னஞ்சல் முகவரி",
    "contacts.source": "மூலம்",
    "contacts.tags": "குறிச்சொற்கள்",
    "contacts.captured_at": "பதிவான நேரம்",

    // WhatsApp Screen
    "wa.title": "வாட்ஸ்அப் ஆட்டோமேஷன் & பிரச்சாரங்கள்",
    "wa.subtitle": "மெட்டா கிளவுட் API, QR பாட் மற்றும் AI தானியங்கி பதிலளிப்பான்.",
    "wa.tab_campaigns": "பிராட்காஸ்ட் பிரச்சாரங்கள்",
    "wa.tab_cloud_api": "மெட்டா கிளவுட் API",
    "wa.tab_qr_bot": "QR வாட்ஸ்அப் பாட்",
    "wa.tab_auto_reply": "AI தானியங்கி பதிலளிப்பான்",
    "wa.tab_inbox": "நேரடி அரட்டை பெட்டி",

    // Links & Rotator
    "links.title": "குறுக்கு இணைப்புகள்",
    "links.subtitle": "பிராண்டட் இணைப்புகள், கிளிக் டிராக்கிங் மற்றும் இலக்கு திசைதிருப்பல்.",
    "links.create": "புதிய இணைப்பு உருவாக்கு",
    "rotator.title": "சுழலும் இணைப்புகள்",
    "rotator.subtitle": "ட்ராஃபிக்கை பல இணைப்புகளுக்கு சரிசமமாகப் பிரித்து அனுப்பவும்.",

    // QR Codes
    "qr.title": "டைனமிக் QR குறியீடுகள்",
    "qr.subtitle": "லோகோ மற்றும் பிரத்தியேக வண்ணங்களுடன் கூடிய QR குறியீடுகள்.",
    "qr.create": "புதிய QR குறியீடு உருவாக்கு",

    // Custom Domains
    "domains.title": "சொந்த டொமைன்கள்",
    "domains.subtitle": "உங்கள் பிராண்ட் இணையதள டொமைனை KeyLink360-ல் இணைத்து இலவச SSL பெறுங்கள்.",
    "domains.connect": "புதிய டொமைன் இணைக்கவும்",

    // Pixels & Media
    "pixels.title": "டிராக்கிங் பிக்சல்கள்",
    "pixels.subtitle": "Facebook, Google, TikTok, LinkedIn பிக்சல்களை இணைக்கவும்.",
    "media.title": "மீடியா நூலகம்",
    "media.subtitle": "படங்கள், ஆவணங்கள் மற்றும் வீடியோக்களைப் பதிவேற்றி நிர்வகிக்கவும்.",

    // Settings Tabs
    "settings.title": "அமைப்புகள் & விருப்பத்தேர்வுகள்",
    "settings.subtitle": "உங்கள் கணக்கு, தீம்கள், மொழி மற்றும் வாடிக்கையாளர் ஆதரவு அமைப்புகளை நிர்வகிக்கவும்.",
    "settings.tab_account": "கணக்கு விவரங்கள்",
    "settings.tab_personalization": "வடிவமைப்பு & தீம்கள்",
    "settings.tab_language": "மொழி அமைப்புகள்",
    "settings.tab_help": "உதவி மையம்",
    "settings.tab_support": "வாடிக்கையாளர் ஆதரவு",

    // Common Actions & Badges
    "common.save": "சேமிக்கவும்",
    "common.saved": "சேமிக்கப்பட்டது!",
    "common.cancel": "ரத்து செய்",
    "common.delete": "நீக்கு",
    "common.edit": "திருத்து",
    "common.create": "புதிதாக உருவாக்கு",
    "common.search": "தேடுக...",
    "common.active": "செயலில் உள்ளது",
    "common.draft": "வரைவு",
    "common.free": "இலவசம்",
    "common.pro": "புரோ",
    "common.view_all": "அனைத்தையும் காண்க",
    "common.copy": "நகலெடு",
    "common.copied": "நகலெடுக்கப்பட்டது!",
    "common.loading": "ஏற்றுகிறது...",
    "common.welcome_back": "மீண்டும் வருக",
    "common.logout": "வெளியேறு"
  },

  // ── 2. ENGLISH (DEFAULT) ──
  en: {
    "cat.smart_marketing": "Smart Marketing",
    "cat.tools": "Tools & Settings",
    "cat.account_preferences": "Account & Preferences",
    "cat.platform_owner": "Platform Owner",

    "nav.dashboard": "Dashboard",
    "nav.bio_pages": "Bio Pages",
    "nav.contacts": "Contacts",
    "nav.whatsapp": "WhatsApp",
    "nav.links": "Links",
    "nav.link_rotator": "Link Rotator",
    "nav.qr_codes": "QR Codes",
    "nav.templates": "Templates",
    "nav.integrations": "Integrations",
    "nav.pixels": "Pixels",
    "nav.media_library": "Media Library",
    "nav.custom_domains": "Custom Domains",
    "nav.settings": "Settings",
    "nav.control_center": "Control Center",

    "header.publish": "Publish",
    "header.notifications": "Notifications",
    "header.mark_all_read": "Mark all as read",
    "header.system_operational": "System Operational",
    "header.profile": "Profile",
    "header.sign_out": "Sign Out",

    "dash.welcome_back": "Welcome back,",
    "dash.visitor_activity": "Showing visitor activity.",
    "dash.total_views": "Total Views",
    "dash.total_clicks": "Total Clicks",
    "dash.registrations": "Leads Captured",
    "dash.active_pages": "Active Bio Pages",
    "dash.quick_access": "Quick Creation Studio",
    "dash.click_performance": "Click Performance",
    "dash.top_pages": "Top Performing Bio Pages",
    "dash.interactive_guides": "Interactive Setup Guides & Documentation",
    "dash.explore_guides": "Explore Visual Guides →",

    "biopages.title": "Bio Pages",
    "biopages.subtitle": "Build and manage high-converting mobile micro-landing pages with AI chatbot.",
    "biopages.create_new": "Create New Bio Page",
    "biopages.edit_design": "Edit Design",
    "biopages.copy_url": "Copy URL",
    "biopages.preview": "Live Preview",
    "biopages.views": "Views",
    "biopages.clicks": "Clicks",

    "contacts.title": "Contacts & Leads CRM",
    "contacts.subtitle": "Instant sync from Bio Page AI Chatbot, Lead Forms & WhatsApp Bot.",
    "contacts.add_contact": "Add Contact",
    "contacts.export_csv": "Export CSV",
    "contacts.search_placeholder": "Search contacts by name, email, phone or tags…",
    "contacts.name": "Name",
    "contacts.phone": "Phone",
    "contacts.email": "Email",
    "contacts.source": "Source",
    "contacts.tags": "Tags",
    "contacts.captured_at": "Captured At",

    "wa.title": "WhatsApp Automation & Growth Suite",
    "wa.subtitle": "Official Meta Cloud API, QR Bot, and AI Auto-Responder.",
    "wa.tab_campaigns": "Broadcast Campaigns",
    "wa.tab_cloud_api": "Official Cloud API",
    "wa.tab_qr_bot": "Quick QR Bot",
    "wa.tab_auto_reply": "AI Auto-Responder",
    "wa.tab_inbox": "Live Chat Inbox",

    "links.title": "Short Links & Smart Routing",
    "links.subtitle": "Create branded short URLs with click tracking and dynamic redirects.",
    "links.create": "Create Short Link",
    "rotator.title": "Link Rotator & A/B Splitter",
    "rotator.subtitle": "Distribute incoming traffic across multiple destination URLs.",

    "qr.title": "Dynamic QR Code Studio",
    "qr.subtitle": "Generate custom branded QR codes with logos and analytics.",
    "qr.create": "Create QR Code",

    "domains.title": "Branded Custom Domains",
    "domains.subtitle": "Connect your own custom domain with automatic SSL and DNS verification.",
    "domains.connect": "Connect Custom Domain",

    "pixels.title": "Tracking Pixels & Analytics",
    "pixels.subtitle": "Retarget visitors on Facebook, Google, TikTok, and LinkedIn.",
    "media.title": "Media Library & Assets",
    "media.subtitle": "Upload and manage images, logos, and promotional assets.",

    "settings.title": "Settings & Preferences",
    "settings.subtitle": "Manage your profile, visual themes, language, and customer support.",
    "settings.tab_account": "Account",
    "settings.tab_personalization": "Personalization",
    "settings.tab_language": "Language",
    "settings.tab_help": "Help Center",
    "settings.tab_support": "Contact Support",

    "common.save": "Save Changes",
    "common.saved": "Saved!",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create New",
    "common.search": "Search...",
    "common.active": "Active",
    "common.draft": "Draft",
    "common.free": "Free",
    "common.pro": "PRO",
    "common.view_all": "View All",
    "common.copy": "Copy",
    "common.copied": "Copied!",
    "common.loading": "Loading...",
    "common.welcome_back": "Welcome back",
    "common.logout": "Sign Out"
  },

  // ── 3. HINDI ──
  hi: {
    "cat.smart_marketing": "स्मार्ट मार्केटिंग",
    "cat.tools": "टूल्स और सेटिंग्स",
    "cat.account_preferences": "खाता और प्राथमिकताएं",
    "cat.platform_owner": "प्लेटफॉर्म ओनर",

    "nav.dashboard": "डैशबोर्ड",
    "nav.bio_pages": "बायो पेजेस",
    "nav.contacts": "संपर्क",
    "nav.whatsapp": "व्हाट्सएप",
    "nav.links": "शॉर्ट लिंक्स",
    "nav.link_rotator": "लिंक रोटेटर",
    "nav.qr_codes": "QR कोड्स",
    "nav.templates": "टेम्पलेट्स",
    "nav.integrations": "इंटीग्रेशन",
    "nav.pixels": "पिक्सेल",
    "nav.media_library": "मीडिया लाइब्रेरी",
    "nav.custom_domains": "कस्टम डोमेन",
    "nav.settings": "सेटिंग्स",
    "nav.control_center": "कंट्रोल सेंटर",

    "header.publish": "प्रकाशित करें",
    "header.notifications": "सूचनाएं",
    "header.sign_out": "लॉग आउट",

    "dash.welcome_back": "वापसी पर स्वागत है,",
    "dash.visitor_activity": "विज़िटर गतिविधि प्रदर्शित हो रही है।",
    "dash.total_views": "कुल व्यूज",
    "dash.total_clicks": "कुल क्लिक",
    "dash.registrations": "प्राप्त लीड्स",
    "dash.active_pages": "सक्रिय बायो पेजेस",
    "dash.quick_access": "त्वरित निर्माण स्टूडियो",
    "dash.explore_guides": "विज़ुअल गाइड देखें →",

    "biopages.title": "बायो पेजेस",
    "biopages.create_new": "नया बायो पेज बनाएं",
    "contacts.title": "संपर्क और लीड्स",
    "contacts.add_contact": "नया संपर्क जोड़ें",
    "wa.title": "व्हाट्सएप ऑटोमेशन",
    "links.title": "शॉर्ट लिंक्स",
    "qr.title": "डायनामिक QR कोड्स",
    "domains.title": "कस्टम डोमेन",

    "settings.title": "सेटिंग्स और प्राथमिकताएं",
    "settings.subtitle": "अपना प्रोफाइल, थीम, भाषा और कस्टमर सपोर्ट मैनेज करें।",
    "settings.tab_account": "खाता विवरण",
    "settings.tab_personalization": "थीम्स व स्टाइल",
    "settings.tab_language": "भाषा सेटिंग्स",
    "settings.tab_help": "हेल्प सेंटर",
    "settings.tab_support": "सपोर्ट से संपर्क करें",

    "common.save": "सुरक्षित करें",
    "common.saved": "सुरक्षित हो गया!",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.edit": "संपादित करें",
    "common.create": "नया बनाएं",
    "common.search": "खोजें...",
    "common.active": "सक्रिय",
    "common.draft": "ड्राफ्ट",
    "common.free": "मुफ्त",
    "common.pro": "प्रो",
    "common.view_all": "सभी देखें",
    "common.copy": "कॉपी करें",
    "common.copied": "कॉपी हो गया!",
    "common.loading": "लोड हो रहा है...",
    "common.welcome_back": "वापसी पर स्वागत है",
    "common.logout": "लॉग आउट"
  }
};

const LANGUAGE_STORAGE_KEY = "keylink360_user_language";

/**
 * Triggers instant DOM-wide full translation via Google Translate Element
 */
function applyDomTranslation(langCode: string) {
  try {
    const hostname = window.location.hostname;
    if (langCode === "en") {
      // Clear cookie to revert back to native English
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
      document.cookie = `googtrans=/en/en; path=/;`;
      document.cookie = `googtrans=/en/en; path=/; domain=.${hostname};`;
    } else {
      const transVal = `/en/${langCode}`;
      document.cookie = `googtrans=${transVal}; path=/;`;
      document.cookie = `googtrans=${transVal}; path=/; domain=.${hostname};`;
    }

    // Trigger select element if Google Translate has rendered its combo
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } catch {
    // ignore
  }
}

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  currentLangMeta: SupportedLanguage;
  languages: SupportedLanguage[];
  t: (key: string, fallback?: string) => string;
  tr: (englishText: string) => string;
  formatBilingual: (enText: string, customTranslation?: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  currentLangMeta: SUPPORTED_LANGUAGES[0],
  languages: SUPPORTED_LANGUAGES,
  t: (k, f) => f || k,
  tr: (text) => text,
  formatBilingual: (e) => e,
  isRtl: false
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default is "en" (English), and persists if user selects any other language
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    return "en";
  });

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      document.documentElement.lang = code;
      if (code === "ar" || code === "he" || code === "fa" || code === "ur") {
        document.documentElement.dir = "rtl";
      } else {
        document.documentElement.dir = "ltr";
      }
      // Apply full project-wide DOM translation across all screens, blocks, and elements
      applyDomTranslation(code);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language !== "en") {
      applyDomTranslation(language);
    }
  }, [language]);

  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const isRtl = language === "ar" || language === "he" || language === "fa" || language === "ur";

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  /** Real-time clean translator for phrases across all pages */
  const tr = (englishText: string): string => {
    if (!englishText || language === "en") return englishText;

    // Direct lookup in active translation dictionary
    const dict = TRANSLATIONS[language];
    if (dict) {
      for (const val of Object.values(dict)) {
        if (val.toLowerCase().includes(englishText.toLowerCase())) {
          return val;
        }
      }
    }

    // Dynamic clean Tamil translations (No awkward English in parentheses)
    if (language === "ta") {
      const lower = englishText.trim().toLowerCase();
      if (lower.includes("dashboard")) return "டாஷ்போர்டு";
      if (lower.includes("bio page")) return "பயோ பக்கங்கள்";
      if (lower.includes("contact")) return "தொடர்புகள்";
      if (lower.includes("whatsapp")) return "வாட்ஸ்அப்";
      if (lower.includes("link rotator")) return "சுழலும் இணைப்புகள்";
      if (lower.includes("short link") || lower === "links") return "இணைப்புகள்";
      if (lower.includes("qr code")) return "QR குறியீடுகள்";
      if (lower.includes("template")) return "டெம்ப்ளேட்டுகள்";
      if (lower.includes("integration")) return "இணைப்புகள்";
      if (lower.includes("pixel")) return "டிராக்கிங் பிக்சல்கள்";
      if (lower.includes("media library")) return "மீடியா நூலகம்";
      if (lower.includes("custom domain")) return "சொந்த டொமைன்கள்";
      if (lower.includes("setting")) return "அமைப்புகள்";
      if (lower.includes("help center") || lower.includes("documentation")) return "உதவி மையம்";
      if (lower.includes("support")) return "வாடிக்கையாளர் ஆதரவு";
      if (lower.includes("total view") || lower.includes("views")) return "மொத்த பார்வைகள்";
      if (lower.includes("total click") || lower.includes("clicks")) return "மொத்த கிளிக்குகள்";
      if (lower.includes("lead") || lower.includes("registration")) return "பதிவான லீட்ஸ்";
      if (lower.includes("active page")) return "செயலில் உள்ள பக்கங்கள்";
      if (lower.includes("welcome back")) return "மீண்டும் வருக,";
      if (lower.includes("save")) return "சேமிக்கவும்";
      if (lower.includes("cancel")) return "ரத்து செய்";
      if (lower.includes("delete")) return "நீக்கு";
      if (lower.includes("edit")) return "திருத்து";
      if (lower.includes("create")) return "புதிதாக உருவாக்கு";
      if (lower.includes("export")) return "ஏற்றுமதி செய்";
      if (lower.includes("import")) return "இறக்குமதி செய்";
      if (lower.includes("publish")) return "வெளியிடு";
      if (lower.includes("sign out") || lower.includes("logout")) return "வெளியேறு";
      if (lower.includes("search")) return "தேடுக...";
    }

    // Dynamic clean Hindi translations
    if (language === "hi") {
      const lower = englishText.trim().toLowerCase();
      if (lower.includes("dashboard")) return "डैशबोर्ड";
      if (lower.includes("bio page")) return "बायो पेजेस";
      if (lower.includes("contact")) return "संपर्क";
      if (lower.includes("whatsapp")) return "व्हाट्सएप";
      if (lower.includes("links")) return "लिंक्स";
      if (lower.includes("qr code")) return "QR कोड्स";
      if (lower.includes("setting")) return "सेटिंग्स";
      if (lower.includes("total view")) return "कुल व्यूज";
      if (lower.includes("total click")) return "कुल क्लिक्स";
      if (lower.includes("save")) return "सुरक्षित करें";
      if (lower.includes("create")) return "नया बनाएं";
      if (lower.includes("publish")) return "प्रकाशित करें";
    }

    return englishText;
  };

  const formatBilingual = (enText: string, customTranslation?: string): string => {
    if (language === "en") return enText;
    if (customTranslation) return customTranslation;
    return tr(enText);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLangMeta,
        languages: SUPPORTED_LANGUAGES,
        t,
        tr,
        formatBilingual,
        isRtl
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
