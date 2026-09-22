import React, { useState, useEffect } from "react";
import { useLanguage } from "../../lib/languageContext";
import {
  X,
  Languages,
  Sparkles,
  Bot,
  MessageCircle,
  QrCode,
  Globe,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Sliders,
  Send,
  Lock,
  ArrowRight
} from "lucide-react";

export type GuideTopicId = "bio_ai" | "whatsapp_cloud" | "whatsapp_qr" | "custom_domains";
export type GuideLanguage = "en" | "ta" | "hi";

interface InteractiveSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: GuideTopicId;
  initialLanguage?: GuideLanguage;
}

interface GuideStep {
  stepNumber: number;
  title: Record<GuideLanguage, string>;
  description: Record<GuideLanguage, string>;
  badge?: Record<GuideLanguage, string>;
  snippet?: string;
  visualMockupType: "gemini_key" | "bio_editor_ai" | "meta_dev" | "meta_webhook" | "qr_scanner" | "anti_spam" | "dns_cname";
}

interface GuideTopic {
  id: GuideTopicId;
  title: Record<GuideLanguage, string>;
  icon: typeof Sparkles;
  color: string;
  subtitle: Record<GuideLanguage, string>;
  steps: GuideStep[];
}

const GUIDE_TOPICS: GuideTopic[] = [
  // ── 1. BIO AI SALES ASSISTANT ──
  {
    id: "bio_ai",
    title: {
      en: "Bio Website AI Sales Assistant",
      ta: "பயோ இணையதள AI விற்பனை உதவியாளர்",
      hi: "बायो वेबसाइट AI सेल्स असिस्टेंट"
    },
    icon: Bot,
    color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    subtitle: {
      en: "Setup 24/7 intelligent sales rep on your bio page at ₹0 cost with Google Gemini Free Tier.",
      ta: "கூகுள் ஜெமினி இலவச API மூலம் உங்கள் பயோ பக்கத்தில் 24/7 AI விற்பனை பிரதிநிதியை ₹0 செலவில் அமைத்திடுங்கள்.",
      hi: "Google Gemini Free Tier के साथ ₹0 खर्च में अपनी बायो वेबसाइट पर 24/7 AI सेल्स एजेंट सेटअप करें।"
    },
    steps: [
      {
        stepNumber: 1,
        title: {
          en: "Get Free Google Gemini API Key",
          ta: "இலவச Google Gemini API Key பெறுதல்",
          hi: "फ्री Google Gemini API Key प्राप्त करें"
        },
        description: {
          en: "Visit Google AI Studio (aistudio.google.com), sign in with any Google account, and click 'Create API Key'. It is 100% free with 15 requests per minute.",
          ta: "Google AI Studio (aistudio.google.com) சென்று Google கணக்கில் உள்நுழைந்து 'Create API Key' கிளிக் செய்யவும். நிமிடத்திற்கு 15 requests வரை 100% முற்றிலும் இலவசம்.",
          hi: "Google AI Studio (aistudio.google.com) पर जाएं, Google अकाउंट से साइन इन करें और 'Create API Key' पर क्लिक करें। यह प्रति मिनट 15 रिक्वेस्ट के साथ 100% फ्री है।"
        },
        badge: {
          en: "₹0 Free Tier",
          ta: "₹0 இலவசம்",
          hi: "₹0 फ्री टियर"
        },
        visualMockupType: "gemini_key"
      },
      {
        stepNumber: 2,
        title: {
          en: "Enable AI Assistant in Bio Editor",
          ta: "Bio Editor-ல் AI Assistant-ஐ ஆன் செய்தல்",
          hi: "Bio Editor में AI Assistant ऑन करें"
        },
        description: {
          en: "Open Bio Pages → Edit your page → Click on the 'AI Sales Assistant' tab on the right panel. Toggle 'Enable AI Sales Assistant' to ON.",
          ta: "Bio Pages திறந்து உங்கள் பக்கத்தை Edit செய்யவும் → வலது பேனலில் உள்ள 'AI Sales Assistant' டேப் கிளிக் செய்து 'Enable AI Sales Assistant' சுவிட்சை ON செய்யவும்.",
          hi: "Bio Pages खोलें → पेज Edit करें → दाईं ओर 'AI Sales Assistant' टैब पर जाएं और टॉगल को ON करें।"
        },
        badge: {
          en: "1-Click Switch",
          ta: "1-கிளிக் சுவிட்ச்",
          hi: "1-क्लिक स्विच"
        },
        visualMockupType: "bio_editor_ai"
      },
      {
        stepNumber: 3,
        title: {
          en: "Customize Welcome Message & Business FAQs",
          ta: "வரவேற்பு செய்தி & தயாரிப்பு விவரங்கள் அமைத்தல்",
          hi: "वेलकम मैसेज और बिजनेस FAQ कस्टमाइज़ करें"
        },
        description: {
          en: "Enter your Assistant Name (e.g., 'Sara - Sales Assistant'), a friendly Welcome Greeting, and paste your product pricing, delivery time, and FAQs in the context box.",
          ta: "உங்கள் AI உதவியாளர் பெயர், வாடிக்கையாளர் வரவேற்பு செய்தி, மற்றும் உங்கள் பொருட்கள், விலை, மற்றும் டெலிவரி விவரங்களை Context பெட்டியில் உள்ளிடவும்.",
          hi: "अपना असिस्टेंट नाम, वेलकम मैसेज और अपने प्रोडक्ट के रेट्स, डिलीवरी और FAQ डिटेल्स संदर्भ बॉक्स में लिखें।"
        },
        snippet: `We sell Marvel toys (Iron Man ₹799, Spiderman ₹699). Free shipping above ₹999. Delivery in 3-5 days across India. WhatsApp: +91 9876543210.`,
        visualMockupType: "bio_editor_ai"
      },
      {
        stepNumber: 4,
        title: {
          en: "Test Live Chat & Automatic CRM Lead Sync",
          ta: "Live Chat சோதனை & CRM Lead Sync",
          hi: "लाइव चैट टेस्ट करें और CRM में लीड देखें"
        },
        description: {
          en: "Click Publish! When visitors open your bio link and ask questions or enter their WhatsApp number, their contact is instantly saved in your KeyLink360 CRM Contacts.",
          ta: "Publish கிளிக் செய்யவும்! வாடிக்கையாளர்கள் உங்கள் பயோ பக்கத்தில் சேட் செய்து தங்களது WhatsApp எண்ணைக் கொடுத்தவுடன், அது KeyLink360 CRM Contacts-ல் Hot Lead ஆக பதிவாகும்.",
          hi: "Publish पर क्लिक करें! जब कस्टमर आपकी बायो साइट पर चैट में फोन नंबर देंगे, तो वह तुरंत KeyLink360 CRM Contacts में सेव हो जाएगा।"
        },
        badge: {
          en: "Auto CRM Sync",
          ta: "தானியங்கி Sync",
          hi: "ऑटो CRM सिंक"
        },
        visualMockupType: "bio_editor_ai"
      }
    ]
  },

  // ── 2. META WHATSAPP CLOUD API ──
  {
    id: "whatsapp_cloud",
    title: {
      en: "Official Meta WhatsApp Cloud API (BYOK)",
      ta: "அதிகாரப்பூர்வ Meta WhatsApp Cloud API",
      hi: "ऑफिशियल Meta WhatsApp Cloud API"
    },
    icon: MessageCircle,
    color: "text-blue-400 bg-blue-500/15 border-blue-500/30",
    subtitle: {
      en: "Connect your official Meta WhatsApp Business API for 1,000 free monthly chats and payment webhooks.",
      ta: "மாதம் 1,000 இலவச சேட்களுக்கு உங்கள் சொந்த Meta Cloud API கணக்கை இணைத்து Razorpay/UPI அறிவிப்புகளை அனுப்புங்கள்.",
      hi: "Meta द्वारा प्रति माह 1,000 मुफ्त कन्वर्सेशन और पेमेंट अलर्ट्स के लिए अपना Meta Cloud API कनेक्ट करें।"
    },
    steps: [
      {
        stepNumber: 1,
        title: {
          en: "Create App in Meta for Developers",
          ta: "Meta for Developers-ல் App உருவாக்குதல்",
          hi: "Meta for Developers में ऐप बनाएं"
        },
        description: {
          en: "Go to developers.facebook.com → Create App → Select 'Other' → Select 'Business'. Under products, click 'Set up' next to WhatsApp.",
          ta: "developers.facebook.com சென்று Create App கிளிக் செய்து 'Business' வகையை தேர்வு செய்யவும். தயாரிப்புகளில் 'WhatsApp' அருகிலுள்ள Set up கிளிக் செய்யவும்.",
          hi: "developers.facebook.com पर जाएं → Create App → Business चुनें → WhatsApp के आगे Set up पर क्लिक करें।"
        },
        visualMockupType: "meta_dev"
      },
      {
        stepNumber: 2,
        title: {
          en: "Copy Phone Number ID & Generate Permanent Token",
          ta: "Phone Number ID & Access Token பெறுதல்",
          hi: "Phone Number ID और Access Token कॉपी करें"
        },
        description: {
          en: "In WhatsApp > API Setup, copy your 'Phone Number ID' and 'WhatsApp Business Account ID'. Create a System User in Business Manager to get a permanent token.",
          ta: "WhatsApp API Setup-ல் Phone Number ID மற்றும் WABA ID-ஐ நகலெடுக்கவும். நிரந்தர டோக்கனைப் பெற Business Manager-ல் System User உருவாக்கவும்.",
          hi: "WhatsApp API Setup में जाकर Phone Number ID और WABA ID कॉपी करें। स्थायी टोकन के लिए Business Manager में System User बनाएं।"
        },
        badge: {
          en: "1,000 Free Chats",
          ta: "1,000 இலவச சேட்கள்",
          hi: "1,000 फ्री चैट"
        },
        visualMockupType: "meta_dev"
      },
      {
        stepNumber: 3,
        title: {
          en: "Configure Webhook in Meta Portal",
          ta: "Meta Portal-ல் Webhook URL அமைத்தல்",
          hi: "Meta पोर्टल में Webhook URL कॉन्फ़िगर करें"
        },
        description: {
          en: "In Meta WhatsApp Configuration > Webhook, paste your Callback URL (e.g., https://yourdomain.com/api/whatsapp/webhook) and set Verify Token as 'keylink360_webhook_secret'. Subscribe to 'messages'.",
          ta: "Meta Webhook பக்கத்தில் Callback URL மற்றும் Verify Token-ஐ உள்ளிட்டு 'messages' நிகழ்வுக்கு Subscribe செய்யவும்.",
          hi: "Meta Webhook सेटिंग्स में Callback URL और Verify Token पेस्ट करें और 'messages' फील्ड को सब्सक्राइब करें।"
        },
        snippet: `Callback URL: https://yourdomain.com/api/whatsapp/webhook\nVerify Token: keylink360_webhook_secret`,
        visualMockupType: "meta_webhook"
      },
      {
        stepNumber: 4,
        title: {
          en: "Enable Razorpay & UPI Payment Alerts",
          ta: "Razorpay & UPI கட்டண அறிவிப்புகளை ஆன் செய்தல்",
          hi: "Razorpay और UPI पेमेंट अलर्ट सक्रिय करें"
        },
        description: {
          en: "Toggle 'Automated Payment Alerts' ON in KeyLink360. Whenever a customer pays via Razorpay or UPI, they instantly receive a WhatsApp order confirmation receipt!",
          ta: "KeyLink360-ல் 'Automated Payment Alerts' சுவிட்சை ON செய்யவும். வாடிக்கையாளர் பணம் செலுத்தியவுடன் ரசீது WhatsApp-ல் தானாக அனுப்பப்படும்!",
          hi: "KeyLink360 में 'Automated Payment Alerts' ऑन करें। जब भी ग्राहक Razorpay/UPI से पेमेंट करेगा, उसे तुरंत व्हाट्सएप पर रसीद मिल जाएगी!"
        },
        badge: {
          en: "Instant Alerts",
          ta: "உடனடி ரசீது",
          hi: "तुरंत रसीद"
        },
        visualMockupType: "meta_webhook"
      }
    ]
  },

  // ── 3. WHATSAPP WEB QR BOT ──
  {
    id: "whatsapp_qr",
    title: {
      en: "1-Click WhatsApp QR Bot (Anti-Spam)",
      ta: "1-கிளிக் WhatsApp QR Bot (பாதுகாப்பானது)",
      hi: "1-क्लिक व्हाट्सएप QR बॉट (एंटी-स्पैम)"
    },
    icon: QrCode,
    color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    subtitle: {
      en: "Connect any personal or business WhatsApp in 10 seconds via QR Code with human-like anti-spam delays.",
      ta: "QR கோடை ஸ்கேன் செய்து உங்கள் சொந்த வாட்ஸ்அப்பை 10 நொடிகளில் இணைத்து மனிதனைப் போன்ற தாமதங்களுடன் இயக்கலாம்.",
      hi: "QR कोड स्कैन करके किसी भी व्हाट्सएप नंबर को 10 सेकंड में कनेक्ट करें और एंटी-स्पैम सुरक्षा पाएं।"
    },
    steps: [
      {
        stepNumber: 1,
        title: {
          en: "Open WhatsApp Screen & Click 'Generate QR Code'",
          ta: "'Generate QR Code' கிளிக் செய்தல்",
          hi: "व्हाट्सएप स्क्रीन पर 'Generate QR Code' क्लिक करें"
        },
        description: {
          en: "Navigate to WhatsApp in KeyLink360 → Switch to the 'WhatsApp Web QR Scanner' tab → Click 'Generate New QR Code'.",
          ta: "KeyLink360-ல் WhatsApp பகுதிக்குச் சென்று 'WhatsApp Web QR Scanner' டேபில் 'Generate New QR Code' கிளிக் செய்யவும்.",
          hi: "KeyLink360 में WhatsApp खोलें → 'WhatsApp Web QR Scanner' टैब चुनें → 'Generate New QR Code' पर क्लिक करें।"
        },
        badge: {
          en: "10-Sec Connect",
          ta: "10 நொடி இணைப்பு",
          hi: "10-सेकंड कनेक्ट"
        },
        visualMockupType: "qr_scanner"
      },
      {
        stepNumber: 2,
        title: {
          en: "Scan with WhatsApp > Linked Devices",
          ta: "வாட்ஸ்அப்பில் Linked Devices மூலம் ஸ்கேன் செய்தல்",
          hi: "व्हाट्सएप में जाकर Linked Devices से स्कैन करें"
        },
        description: {
          en: "Open WhatsApp on your mobile phone → Tap Settings / 3-dots menu → Select 'Linked Devices' → Tap 'Link a Device' and point your camera at the screen QR code.",
          ta: "உங்கள் செல்போனில் வாட்ஸ்அப் திறந்து Settings → Linked Devices சென்று திரையில் உள்ள QR கோடை ஸ்கேன் செய்யவும்.",
          hi: "अपने फोन में व्हाट्सएप खोलें → Settings/3-Dots → Linked Devices पर जाएं और स्क्रीन पर दिख रहे QR कोड को स्कैन करें।"
        },
        visualMockupType: "qr_scanner"
      },
      {
        stepNumber: 3,
        title: {
          en: "Anti-Spam Safety Guard Active (Human-like Delays)",
          ta: "Anti-Spam பாதுகாப்பு (மனிதனைப் போன்ற தாமதம்)",
          hi: "एंटी-स्पैम सेफ्टी गार्ड (ह्यूमन डिले)"
        },
        description: {
          en: "KeyLink360 automatically enforces a 1.5s to 3.5s jitter delay between messages and limits bursts to max 6 msgs/min to ensure your WhatsApp account remains 100% safe from bans.",
          ta: "உங்கள் கணக்கு முடக்கப்படாமல் இருக்க KeyLink360 தானாகவே ஒவ்வொரு செய்திக்கும் இடையே 1.5s முதல் 3.5s காலதாமதம் மற்றும் நிமிடத்திற்கு அதிகபட்சம் 6 செய்திகள் மட்டுமே செல்லும் பாதுகாப்பை உறுதிசெய்கிறது.",
          hi: "अकाउंट बैन से बचने के लिए KeyLink360 हर मैसेज के बीच 1.5 से 3.5 सेकंड का ह्यूमन डिले और प्रति मिनट अधिकतम 6 मैसेज की लिमिट लागू करता है।"
        },
        badge: {
          en: "100% Safe Guard",
          ta: "100% பாதுகாப்பானது",
          hi: "100% सेफ गार्ड"
        },
        visualMockupType: "anti_spam"
      },
      {
        stepNumber: 4,
        title: {
          en: "Track Daily Safe Message Limits",
          ta: "தினசரி செய்தி அளவை கண்காணித்தல்",
          hi: "दैनिक सेफ मैसेज लिमिट ट्रैक करें"
        },
        description: {
          en: "Monitor your live daily progress bar (50 / 100 / 250 msgs/day safe limit) right inside your dashboard. The counter resets automatically at midnight.",
          ta: "டாஷ்போர்டில் உள்ள தினசரி அளவுமானியில் (50 / 100 / 250 செய்திகள்) உங்கள் பயன்பாட்டை கண்காணிக்கலாம். இது தினமும் நள்ளிரவில் தானாக ரீசெட் ஆகும்.",
          hi: "डैशबोर्ड में बने प्रोग्रेस बार से डेली सेफ लिमिट (50/100/250 मैसेज) ट्रैक करें। यह रोज रात 12 बजे रीसेट होता है।"
        },
        visualMockupType: "anti_spam"
      }
    ]
  },

  // ── 4. CUSTOM DOMAINS ──
  {
    id: "custom_domains",
    title: {
      en: "Custom Domain & Free SSL Setup",
      ta: "சொந்த Domain மற்றும் இலவச SSL அமைத்தல்",
      hi: "कस्टम डोमेन और फ्री SSL सेटअप"
    },
    icon: Globe,
    color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    subtitle: {
      en: "Connect links.yourbrand.com or yourbrand.com with automatic lifetime SSL padlock.",
      ta: "உங்கள் சொந்த பிராண்ட் பெயரை (yourbrand.com) வாழ்நாள் இலவச SSL பாதுகாப்புடன் இணைத்திடுங்கள்.",
      hi: "links.yourbrand.com या yourbrand.com को फ्री लाइफटाइम SSL के साथ जोड़ें।"
    },
    steps: [
      {
        stepNumber: 1,
        title: {
          en: "Add CNAME Record in DNS (Cloudflare / GoDaddy)",
          ta: "DNS-ல் CNAME Record சேர்த்தல்",
          hi: "DNS में CNAME रिकॉर्ड जोड़ें"
        },
        description: {
          en: "Open your domain registrar (GoDaddy, Namecheap, Cloudflare) → DNS Management → Add CNAME Record pointing to 'cname.keylink360.today'.",
          ta: "GoDaddy அல்லது Cloudflare-ன் DNS Management பகுதிக்குச் சென்று 'cname.keylink360.today' முகவரிக்கு ஒரு CNAME Record சேர்க்கவும்.",
          hi: "अपने डोमेन प्रोवाइडर में DNS सेटिंग्स खोलें और 'cname.keylink360.today' के लिए एक CNAME रिकॉर्ड जोड़ें।"
        },
        snippet: `Type: CNAME\nName: links (or @)\nTarget: cname.keylink360.today\nTTL: Auto / 3600`,
        visualMockupType: "dns_cname"
      },
      {
        stepNumber: 2,
        title: {
          en: "Verify in KeyLink360 & Activate SSL",
          ta: "KeyLink360-ல் Verify செய்து SSL இயக்குதல்",
          hi: "KeyLink360 में वेरीफाई करें और SSL चालू करें"
        },
        description: {
          en: "Enter your domain name in Custom Domains → Click 'Verify Domain'. Our system provisions a free SSL certificate within 60 seconds.",
          ta: "Custom Domains பக்கத்தில் உங்கள் டொமைன் பெயரை உள்ளிட்டு 'Verify Domain' கிளிக் செய்யவும். 60 நொடிகளில் இலவச SSL செயல்படுத்தப்படும்.",
          hi: "Custom Domains में अपना डोमेन डालकर 'Verify Domain' पर क्लिक करें। 60 सेकंड में फ्री SSL एक्टिवेट हो जाएगा।"
        },
        badge: {
          en: "Free Lifetime SSL",
          ta: "இலவச SSL",
          hi: "फ्री लाइफटाइम SSL"
        },
        visualMockupType: "dns_cname"
      }
    ]
  }
];

export default function InteractiveSetupGuideModal({
  isOpen,
  onClose,
  initialTopic = "bio_ai",
  initialLanguage = "en"
}: InteractiveSetupGuideModalProps) {
  const { language } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<GuideTopicId>(initialTopic);
  const [selectedLang, setSelectedLang] = useState<GuideLanguage>(() => {
    if (language === "ta" || language === "hi" || language === "en") {
      return language;
    }
    return initialLanguage;
  });
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (language === "ta" || language === "hi" || language === "en") {
      setSelectedLang(language);
    }
  }, [language]);

  if (!isOpen) return null;

  const currentTopic = GUIDE_TOPICS.find((t) => t.id === selectedTopic) || GUIDE_TOPICS[0];
  const currentStep = currentTopic.steps[activeStepIndex] || currentTopic.steps[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[var(--key-surface-strong,#0f172a)] border border-[var(--key-border,rgba(255,255,255,0.1))] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--key-text,#f8fafc)] font-sans">
        
        {/* ===================== TOP HEADER ===================== */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[var(--key-border)] flex items-center justify-between gap-3 bg-[var(--key-surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[var(--key-brand)]/15 text-[var(--key-brand)] flex items-center justify-center border border-[var(--key-brand)]/30 shrink-0">
              <Sparkles className="w-5 h-5 text-[var(--key-brand)]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-[var(--key-text)] flex items-center gap-2 truncate">
                <span>
                  {selectedLang === "ta"
                    ? "செயல்முறை வழிகாட்டிகள்"
                    : selectedLang === "hi"
                      ? "इंटरएक्टिव सेटअप गाइड्स"
                      : "Interactive Setup Guides"}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--key-brand)]/15 text-[var(--key-brand)] border border-[var(--key-brand)]/30">
                  v360 Live
                </span>
              </h3>
              <p className="text-xs text-[var(--key-muted)] truncate">
                {selectedLang === "ta"
                  ? "திரைப்படங்கள் மற்றும் விளக்கப்படங்களுடன் கூடிய எளிய வழிகாட்டி"
                  : selectedLang === "hi"
                    ? "स्क्रीनशॉट और आसान स्टेप्स के साथ सम्पूर्ण गाइड"
                    : "Step-by-step visual tutorials with screenshot mockups"}
              </p>
            </div>
          </div>

          {/* Controls: Language Pills & Close Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)]">
              <Languages className="w-3.5 h-3.5 text-[var(--key-muted)] ml-1.5" />
              {(["en", "ta", "hi"] as GuideLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedLang === lang
                      ? "bg-[var(--key-brand)] text-white shadow-sm"
                      : "text-[var(--key-muted)] hover:text-[var(--key-text)]"
                  }`}
                >
                  {lang === "en" ? "EN" : lang === "ta" ? "தமிழ்" : "हिन्दी"}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--key-btn-secondary-bg)] hover:bg-[var(--key-btn-secondary-hover-bg)] text-[var(--key-muted)] hover:text-[var(--key-text)] border border-[var(--key-border)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===================== TOPIC TABS ===================== */}
        <div className="px-5 py-2.5 bg-[var(--key-bg-deep)]/80 border-b border-[var(--key-border)] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {GUIDE_TOPICS.map((topic) => {
            const Icon = topic.icon;
            const isActive = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  setSelectedTopic(topic.id);
                  setActiveStepIndex(0);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? "bg-[var(--key-brand)]/15 text-[var(--key-brand)] border-[var(--key-brand)]/40 shadow-sm"
                    : "bg-[var(--key-surface)] text-[var(--key-muted)] border-[var(--key-border)] hover:text-[var(--key-text)] hover:bg-[var(--key-btn-secondary-hover-bg)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{topic.title[selectedLang]}</span>
              </button>
            );
          })}
        </div>

        {/* ===================== MAIN CONTENT BODY ===================== */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-6">
          
          {/* Topic Subtitle Banner */}
          <div className="p-4 rounded-2xl bg-[var(--key-surface)] border border-[var(--key-border)] flex items-center justify-between gap-4 shadow-sm">
            <p className="text-xs sm:text-sm text-[var(--key-muted)] font-medium">
              {currentTopic.subtitle[selectedLang]}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono font-bold text-[var(--key-brand)]">
                Step {activeStepIndex + 1} of {currentTopic.steps.length}
              </span>
            </div>
          </div>

          {/* Step Progress Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {currentTopic.steps.map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                  activeStepIndex === idx
                    ? "bg-[var(--key-brand)] border-[var(--key-brand)] text-white shadow-md shadow-[var(--key-brand)]/25"
                    : idx < activeStepIndex
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-[var(--key-surface)] border-[var(--key-border)] text-[var(--key-muted)] hover:text-[var(--key-text)]"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                  {idx < activeStepIndex ? "✓" : idx + 1}
                </span>
                <span className="max-w-[140px] truncate">{step.title[selectedLang]}</span>
              </button>
            ))}
          </div>

          {/* Active Step Content Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Step Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--key-brand)]/15 border border-[var(--key-brand)]/30 text-[var(--key-brand)]">
                  STEP {currentStep.stepNumber}
                </span>
                {currentStep.badge && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    {currentStep.badge[selectedLang]}
                  </span>
                )}
              </div>

              <h4 className="text-xl font-bold text-[var(--key-text)] tracking-tight">
                {currentStep.title[selectedLang]}
              </h4>

              <p className="text-xs sm:text-sm text-[var(--key-muted)] leading-relaxed font-normal">
                {currentStep.description[selectedLang]}
              </p>

              {/* Code / Config Snippet Box if available */}
              {currentStep.snippet && (
                <div className="p-3.5 rounded-2xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] font-mono text-xs text-[var(--key-text)] relative group space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[var(--key-muted)] pb-1 border-b border-[var(--key-border)]">
                    <span>Example Template / Config</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentStep.snippet!)}
                      className="text-[var(--key-brand)] hover:brightness-110 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      {copiedSnippet === currentStep.snippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-[11.5px] text-[var(--key-text)]">
                    {currentStep.snippet}
                  </pre>
                </div>
              )}
            </div>

            {/* Right: Visual Mockup / Simulated Screenshot UI */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-[var(--key-surface)] border border-[var(--key-border)] shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--key-border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] font-mono text-[var(--key-muted)]">Live Visual Simulation</span>
              </div>

              {/* Mockup 1: Gemini Key */}
              {currentStep.visualMockupType === "gemini_key" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-[var(--key-text)]">Google AI Studio</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">FREE TIER</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-1">
                    <span className="text-[10px] text-[var(--key-muted)]">Gemini 1.5 Flash API Key</span>
                    <p className="font-mono text-[11px] text-[var(--key-brand)]">AIzaSyB************************</p>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-[var(--key-brand)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Open Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Mockup 2: Bio Editor AI Toggle & Chat Preview */}
              {currentStep.visualMockupType === "bio_editor_ai" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--key-surface)] border border-[var(--key-brand)]/30">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[var(--key-brand)]" />
                      <div>
                        <p className="font-bold text-[var(--key-text)] text-xs">Enable AI Sales Assistant</p>
                        <p className="text-[10px] text-[var(--key-muted)]">24/7 Live Chat on Bio Website</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-[var(--key-brand)] rounded-full flex items-center justify-end p-0.5">
                      <div className="w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--key-brand)]/20 text-[var(--key-brand)] flex items-center justify-center text-[10px] font-bold">AI</div>
                      <span className="font-bold text-[var(--key-text)] text-[11px]">Sara (Sales Assistant)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--key-bg-deep)] text-[11px] text-[var(--key-text)] border border-[var(--key-border)]/50">
                      "👋 Hello! Welcome to our store. How can I assist you with our catalog today?"
                    </div>
                  </div>
                </div>
              )}

              {/* Mockup 3: Meta Dev */}
              {currentStep.visualMockupType === "meta_dev" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--key-text)]">Meta WhatsApp Cloud API</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1,000 FREE / MO</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <div className="p-2.5 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-1">
                      <span className="text-[var(--key-muted)]">Phone ID:</span>
                      <p className="text-[var(--key-text)] truncate">109847291837482</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-1">
                      <span className="text-[var(--key-muted)]">Status:</span>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">Connected ✓</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mockup 4: Meta Webhook */}
              {currentStep.visualMockupType === "meta_webhook" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-1 text-xs">
                    <span className="text-[var(--key-muted)] text-[10px]">Webhook Subscription:</span>
                    <p className="text-[var(--key-text)] font-mono text-[11px]">messages ✓, message_deliveries ✓</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Razorpay & UPI Payment Alert Webhooks Active</span>
                  </div>
                </div>
              )}

              {/* Mockup 5: QR Scanner */}
              {currentStep.visualMockupType === "qr_scanner" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] text-xs text-center">
                  <div className="w-28 h-28 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg border border-[var(--key-border)]">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                  <p className="text-[11px] text-[var(--key-muted)] font-medium">
                    Point WhatsApp Mobile camera to connect in 10s
                  </p>
                </div>
              )}

              {/* Mockup 6: Anti-Spam */}
              {currentStep.visualMockupType === "anti_spam" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--key-muted)]">Anti-Spam Human Jitter Delay</span>
                      <span className="text-[var(--key-brand)] font-bold font-mono">1.5s - 3.5s</span>
                    </div>
                    <div className="w-full bg-[var(--key-bg-deep)] h-2 rounded-full overflow-hidden border border-[var(--key-border)]/40">
                      <div className="bg-[var(--key-brand)] h-full w-[70%]" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--key-surface)] border border-[var(--key-border)] space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--key-muted)]">Daily Safe Message Limit</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">18 / 100 Sent</span>
                    </div>
                    <div className="w-full bg-[var(--key-bg-deep)] h-2 rounded-full overflow-hidden border border-[var(--key-border)]/40">
                      <div className="bg-emerald-500 h-full w-[18%]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Mockup 7: DNS CNAME */}
              {currentStep.visualMockupType === "dns_cname" && (
                <div className="space-y-2 p-3.5 rounded-xl bg-[var(--key-bg-deep)] border border-[var(--key-border)] font-mono text-[11px]">
                  <div className="grid grid-cols-3 gap-1 text-[var(--key-muted)] border-b border-[var(--key-border)] pb-1 text-[10px]">
                    <span>TYPE</span>
                    <span>NAME</span>
                    <span>TARGET</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[var(--key-brand)] py-1 font-bold">
                    <span>CNAME</span>
                    <span>links</span>
                    <span className="truncate">cname.keylink360.today</span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ===================== FOOTER NAVIGATION ===================== */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-[var(--key-border)] bg-[var(--key-surface)] flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            disabled={activeStepIndex === 0}
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--key-btn-secondary-bg)] hover:bg-[var(--key-btn-secondary-hover-bg)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--key-text)] border border-[var(--key-border)] transition-colors cursor-pointer"
          >
            ← Previous Step
          </button>

          <div className="flex items-center gap-2">
            {activeStepIndex < currentTopic.steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => Math.min(currentTopic.steps.length - 1, prev + 1))}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--key-brand)] hover:brightness-110 text-white shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <span>Done & Ready! ✓</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
