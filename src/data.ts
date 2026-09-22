import {
  UserProfile,
  BioPage,
  Contact,
  WhatsAppCampaign,
  WhatsAppTemplate,
  SmartLink,
  QRCodeItem,
  TemplateItem,
  IntegrationItem,
  IntegrationVote,
  TrackingPixel,
  MediaFile,
  HelpArticle
} from "./types";
import { getSystemTemplateCatalog } from "./lib/systemTemplates";

export const initialUser: UserProfile = {
  name: "Eso Tech",
  email: "esoscalesoft@gmail.com",
  avatarUrl: "E",
  plan: "Free Plan",
  isVerified: true
};

export const initialBioPages: BioPage[] = [
  {
    id: "1",
    title: "Marvel Products",
    slug: "key.link/page-r3ee6iw",
    status: "Live",
    views: 0,
    createdAt: "4 Jul 2026"
  }
];

export const initialContacts: Contact[] = [];

export const initialWhatsAppCampaigns: WhatsAppCampaign[] = [
  {
    id: "w1",
    name: "Summer Sale Update",
    status: "Sent",
    recipients: "0",
    openRate: "0%"
  },
  {
    id: "w2",
    name: "Welcome Sequence",
    status: "Active",
    recipients: "0/day",
    openRate: "0%"
  }
];

export const initialWhatsAppTemplates: WhatsAppTemplate[] = [
  { id: "wt1", name: "Welcome Message", status: "Approved" },
  { id: "wt2", name: "Order Confirmation", status: "Approved" }
];

/** Demo seeds removed — short links are loaded from the server API. */
export const initialSmartLinks: SmartLink[] = [];

export const initialQRCodes: QRCodeItem[] = [
  {
    id: "qr1",
    name: "Summer Campaign 2024",
    status: "Active",
    scans: "0",
    uniqueScanners: "0",
    topLocation: "N/A",
    conversionRate: "0%",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=key.li/summer-special-24&color=7c3aed",
    targetUrl: "key.li/summer-special-24",
    customDesign: true
  },
  {
    id: "qr2",
    name: "Global Conference Link",
    status: "Active",
    scans: "0",
    uniqueScanners: "0",
    topLocation: "N/A",
    conversionRate: "0%",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=key.li/global-conf-reg&color=0f172a",
    targetUrl: "key.li/global-conf-reg",
    customDesign: false
  },
  {
    id: "qr3",
    name: "Feedback Portal",
    status: "Paused",
    scans: "0",
    uniqueScanners: "0",
    topLocation: "N/A",
    conversionRate: "0%",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=key.li/customer-feedback&color=64748b",
    targetUrl: "key.li/customer-feedback",
    customDesign: false
  }
];

export const initialTemplates: TemplateItem[] = getSystemTemplateCatalog();

export const initialIntegrations: IntegrationItem[] = [
  {
    id: "i_wa_cloud",
    name: "WhatsApp Cloud API",
    type: "WhatsApp",
    status: "Connected",
    description: "Meta's official WhatsApp Cloud API. Send automated form confirmations, welcome sequences, OTPs, and broadcast campaigns directly from KEYLINK360.",
    upgradeMessage: "",
    apiKeyHint: "••••Meta78",
    connectedAt: "2026-06-15T10:30:00.000Z",
    badge: "Official Meta",
    docUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api"
  },
  {
    id: "i_wa_biz",
    name: "Interakt WhatsApp Business",
    type: "WhatsApp",
    status: "Connected",
    description: "Multi-agent WhatsApp Business shared inbox. Sync templates, automated lead capture alerts, and trigger quick-replies.",
    upgradeMessage: "",
    apiKeyHint: "••••Intk92",
    connectedAt: "2026-07-01T14:15:00.000Z",
    badge: "Verified BSP",
    docUrl: "https://www.interakt.shop"
  },
  {
    id: "i_telegram",
    name: "Telegram Bot & Channels",
    type: "Telegram",
    status: "Connected",
    description: "Instantly forward bio page leads, smart form entries, and visitor inquiries directly into your private Telegram Channel or Group Bot in real-time.",
    upgradeMessage: "",
    apiKeyHint: "••••Bot01",
    connectedAt: "2026-07-10T09:00:00.000Z",
    badge: "Real-time Bot",
    docUrl: "https://core.telegram.org/bots"
  },
  {
    id: "i_mailchimp",
    name: "Mailchimp",
    type: "Email Marketing",
    status: "Locked",
    description: "Sync your smart form subscribers and lead magnets directly into customized Mailchimp audiences, tags, and automated drip campaigns.",
    upgradeMessage: "Email Marketing sync is part of the Pro Smart Marketing plan.",
    badge: "Popular",
    docUrl: "https://mailchimp.com"
  },
  {
    id: "i_convertkit",
    name: "ConvertKit (Kit)",
    type: "Email Marketing",
    status: "Locked",
    description: "Creator-first email marketing. Automatically tag and add new bio link subscribers into your ConvertKit visual automations.",
    upgradeMessage: "Email Marketing sync is part of the Pro Smart Marketing plan.",
    badge: "Creator Pro",
    docUrl: "https://kit.com"
  },
  {
    id: "i_brevo",
    name: "Brevo (Sendinblue)",
    type: "Email Marketing",
    status: "Locked",
    description: "Trigger transactional emails, newsletter subscriptions, and automated CRM workflows directly upon bio link engagement.",
    upgradeMessage: "Email Marketing sync is part of the Pro Smart Marketing plan.",
    docUrl: "https://www.brevo.com"
  },
  {
    id: "i_flodesk",
    name: "Flodesk",
    type: "Email Marketing",
    status: "Locked",
    description: "Add Smart Form leads straight to your aesthetic Flodesk email segments and high-converting automated nurture workflows.",
    upgradeMessage: "Email Marketing sync is part of the Pro Smart Marketing plan.",
    docUrl: "https://flodesk.com"
  },
  {
    id: "i_twilio",
    name: "Twilio SMS",
    type: "SMS Messaging",
    status: "Locked",
    description: "Global SMS gateway. Send instant transactional SMS alerts, OTP verification codes, and appointment reminder texts to bio link visitors.",
    upgradeMessage: "SMS Gateway integration is part of the Enterprise Marketing plan.",
    badge: "Global SMS",
    docUrl: "https://www.twilio.com/en-us/messaging/channels/sms"
  },
  {
    id: "i_fast2sms",
    name: "Fast2SMS / MSG91",
    type: "SMS Messaging",
    status: "Locked",
    description: "High-speed DLT-approved transactional & quick OTP SMS delivery across India and regional routes for smart form submissions.",
    upgradeMessage: "SMS Gateway integration is part of the Enterprise Marketing plan.",
    badge: "DLT Approved",
    docUrl: "https://www.fast2sms.com"
  },
  {
    id: "i_razorpay",
    name: "Razorpay",
    type: "Payments",
    status: "Locked",
    description: "Accept seamless payments via UPI, Credit/Debit Cards, NetBanking, and Wallets directly inside your bio pages, tip jars, and digital products.",
    upgradeMessage: "Payments gateway integration is part of the Pro Commerce plan.",
    badge: "Zero Setup",
    docUrl: "https://razorpay.com"
  },
  {
    id: "i_stripe",
    name: "Stripe",
    type: "Payments",
    status: "Locked",
    description: "Global payment processor supporting 135+ currencies, Apple Pay, Google Pay, and recurring subscription checkouts on your bio links.",
    upgradeMessage: "Payments gateway integration is part of the Pro Commerce plan.",
    badge: "Global 135+",
    docUrl: "https://stripe.com"
  },
  {
    id: "i_phonepe",
    name: "PhonePe Payment Gateway",
    type: "Payments",
    status: "Locked",
    description: "Instant direct UPI payments with highest success rate, zero merchant downtime, and fast QR code checkouts.",
    upgradeMessage: "Payments gateway integration is part of the Pro Commerce plan.",
    badge: "Direct UPI",
    docUrl: "https://www.phonepe.com/business-solutions/payment-gateway"
  },
  {
    id: "i_paypal",
    name: "PayPal",
    type: "Payments",
    status: "Locked",
    description: "Accept international payments & PayPal wallet balances from your global audience with one-click smart buttons.",
    upgradeMessage: "Payments gateway integration is part of the Pro Commerce plan.",
    badge: "Worldwide",
    docUrl: "https://www.paypal.com"
  }
];

export const initialVotes: IntegrationVote[] = [
  { id: "v1", name: "GetResponse", votes: 3, voted: true },
  { id: "v2", name: "Mailchimp", votes: 1, voted: false },
  { id: "v3", name: "ConvertKit", votes: 1, voted: false },
  { id: "v4", name: "MailerLite", votes: 1, voted: false },
  { id: "v5", name: "ActiveCampaign", votes: 3, voted: false }
];

export const initialTrackingPixels: TrackingPixel[] = [
  {
    id: "p1",
    name: "Main Facebook Pixel",
    type: "Facebook Pixel",
    pixelId: "882739401928374",
    status: "Active"
  },
  {
    id: "p2",
    name: "Google Ads G-Tag",
    type: "Google Analytics Tag",
    pixelId: "AW-10928374561",
    status: "Active"
  },
  {
    id: "p3",
    name: "TikTok Pixel",
    type: "TikTok Pixel",
    pixelId: "T-1827463529",
    status: "Validation Required"
  }
];

export const initialMediaFiles: MediaFile[] = [
  {
    id: "m1",
    name: "campaign_header_v2.jpg",
    type: "image",
    size: "1.2 MB",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400",
    dimensions: "1200 × 630",
    uploadedAt: "4 Jul 2026"
  },
  {
    id: "m2",
    name: "product_demo_reel.mp4",
    type: "video",
    size: "24.5 MB",
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400",
    dimensions: "1920 × 1080",
    uploadedAt: "4 Jul 2026"
  },
  {
    id: "m3",
    name: "lifestyle_workspace.png",
    type: "image",
    size: "4.8 MB",
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400",
    dimensions: "2500 × 1667",
    uploadedAt: "4 Jul 2026"
  }
];

export const initialHelpArticles: HelpArticle[] = [
  {
    id: "faq-ai-bio-chat",
    title: "How to Setup Google Gemini AI Sales Assistant on Your Bio Page",
    category: "AI & Automation",
    excerpt:
      "Enable autonomous Gemini 1.5 Flash chat on your public bio website with custom FAQs, business greetings, and instant CRM lead sync.",
    readTime: "3 mins",
    content: `GOOGLE GEMINI AI SALES ASSISTANT SETUP GUIDE

━━━━━━━━━━━━━━━━━━━━
OVERVIEW
━━━━━━━━━━━━━━━━━━━━
KeyLink360 comes with a built-in Google Gemini 1.5 Flash AI Assistant that floats directly on your public bio website. It autonomously answers customer questions, explains products, quotes pricing, and captures customer contacts into your CRM.

━━━━━━━━━━━━━━━━━━━━
STEP-BY-STEP SETUP
━━━━━━━━━━━━━━━━━━━━
1. Open Left Sidebar → Bio Pages.
2. Select your bio page or click "Create Page".
3. In the right-side Editor panel, click the "AI Sales Assistant" tab (Sparkles icon).
4. Turn the "Enable AI Sales Assistant" switch ON.
5. Enter your Business Details:
   • Bot Display Name (e.g. Acme Sales Bot)
   • Welcome Greeting Message
   • Business Description & Product Highlights
6. Add Custom FAQs:
   • Add common questions and direct answers (e.g. "What are your delivery times?", "Do you offer COD?")
7. Test the interactive preview in the phone simulator on the right.
8. Click Publish → Your public bio website now has a 24/7 AI Sales Assistant!

━━━━━━━━━━━━━━━━━━━━
CRM LEAD CAPTURE
━━━━━━━━━━━━━━━━━━━━
When visitors share their name, phone number, or email in the chat, KeyLink360 automatically syncs them to Sidebar → Contacts & Leads tagged with "AI Chat Lead" and "Hot Lead".`,
    translations: {
      ta: {
        title: "உங்கள் Bio பக்கத்தில் Google Gemini AI சேல்ஸ் அசிஸ்டண்ட் அமைப்பது எப்படி?",
        excerpt: "Google Gemini 1.5 Flash AI சாட்பாட் மூலம் வாடிக்கையாளர்களுக்கு தானாகவே பதிலளித்து, அவர்களின் தகவல்களை CRM-ல் சேமிப்பது எப்படி.",
        content: `GOOGLE GEMINI AI சேல்ஸ் அசிஸ்டண்ட் அமைக்கும் முறை

━━━━━━━━━━━━━━━━━━━━
கண்ணோட்டம் (OVERVIEW)
━━━━━━━━━━━━━━━━━━━━
KeyLink360 பிளாட்பார்மில் உள்ளமைக்கப்பட்ட Google Gemini 1.5 Flash AI அசிஸ்டண்ட் மூலம் உங்கள் Bio பக்கத்திற்கு வரும் வாடிக்கையாளர்களுக்கு 24/7 தானாகவே பதிலளித்து, விற்பனையை அதிகரிக்கலாம்.

━━━━━━━━━━━━━━━━━━━━
படிப்படியான வழிமுறைகள் (STEP-BY-STEP)
━━━━━━━━━━━━━━━━━━━━
1. இடதுபுற மெனுவில் Bio Pages-ஐ திறக்கவும்.
2. உங்கள் பக்கத்தை தேர்வு செய்து Editor-ஐ திறக்கவும்.
3. எடிட்டரின் வலதுபுறம் உள்ள "AI Sales Assistant" டேப் (Sparkles ஐகான்) கிளிக் செய்யவும்.
4. "Enable AI Sales Assistant" சுவிட்சை ON செய்யவும்.
5. உங்கள் பிசினஸ் விவரங்களை உள்ளிடவும்:
   • Bot Name (எ.கா: Acme Sales Bot)
   • Welcome Message (வரவேற்பு மெசேஜ்)
   • Business Description & Products (பொருட்கள் மற்றும் சேவைகள் பற்றிய விவரம்)
6. Custom FAQs சேர்க்கவும்:
   • வாடிக்கையாளர்கள் அடிக்கடி கேட்கும் கேள்விகள் மற்றும் பதில்கள் (எ.கா: "டெலிவரி நேரம் என்ன?", "COD உள்ளதா?")
7. பக்கத்தில் உள்ள Phone Simulator-ல் உடனடியாக Chat செய்து டெஸ்ட் செய்து பார்க்கவும்.
8. Publish கிளிக் செய்யவும் → உங்கள் Bio பக்கத்தில் Floating AI Chat Widget நேரலையாகிவிடும்!

━━━━━━━━━━━━━━━━━━━━
CRM LEADS சேமிப்பு
━━━━━━━━━━━━━━━━━━━━
வாடிக்கையாளர்கள் சாட்டில் தங்கள் பெயர், போன் நம்பர் தரும்போது, அது உடனடியாக Sidebar › Contacts மெனுவில் "AI Chat Lead" டேக்குடன் தானாகவே பதிவாகிவிடும்.`
      },
      hi: {
        title: "अपने Bio पेज पर Google Gemini AI सेल्स असिस्टेंट कैसे सेट करें?",
        excerpt: "Google Gemini 1.5 Flash AI चैटबॉट को एक्टिवेट करें, ऑटो-रिप्लाई सेट करें और लीड्स को सीधे CRM में कैप्चर करें।",
        content: `GOOGLE GEMINI AI सेल्स असिस्टेंट सेटअप गाइड

━━━━━━━━━━━━━━━━━━━━
अवलोकन (OVERVIEW)
━━━━━━━━━━━━━━━━━━━━
KeyLink360 में इन-बिल्ट Google Gemini 1.5 Flash AI असिस्टेंट है जो आपकी Bio वेबसाइट पर आने वाले ग्राहकों के सवालों का 24/7 तुरंत जवाब देता है और नए ऑर्डर्स व लीड्स कलेक्ट करता है।

━━━━━━━━━━━━━━━━━━━━
स्टेप-बाय-स्टेप सेटअप (STEP-BY-STEP)
━━━━━━━━━━━━━━━━━━━━
1. साइडबार में Bio Pages पर जाएं।
2. अपना पेज चुनें और Editor खोलें।
3. दाईं ओर "AI Sales Assistant" टैब (Sparkles आइकॉन) पर क्लिक करें।
4. "Enable AI Sales Assistant" टॉगल को ON करें।
5. अपना बिज़नेस विवरण दर्ज करें:
   • Bot Name (जैसे: Acme Sales Bot)
   • Welcome Greeting (स्वागत संदेश)
   • बिज़नेस व प्रॉडक्ट्स की जानकारी
6. Custom FAQs जोड़ें:
   • अक्सर पूछे जाने वाले सवाल और उनके जवाब (जैसे: डिलीवरी चार्ज, रिटर्न पॉलिसी)।
7. फ़ोन सिम्युलेटर में लाइव चैट टेस्ट करें।
8. Publish पर क्लिक करें → आपका AI चैट विजेट लाइव हो जाएगा!

━━━━━━━━━━━━━━━━━━━━
CRM लीड्स कैप्चर
━━━━━━━━━━━━━━━━━━━━
ग्राहक जब चैट में अपना नाम और मोबाइल नंबर साझा करते हैं, तो वे सीधे Contacts & Leads सेक्शन में सेव हो जाते हैं।`
      }
    }
  },
  {
    id: "faq-wa-cloud-api",
    title: "Official Meta WhatsApp Cloud API Setup & 1,000 Free Monthly Chats",
    category: "AI & Automation",
    excerpt:
      "Connect your official WhatsApp Business Account using Meta BYOK architecture with ₹0 platform cost and automated Gemini AI replies.",
    readTime: "4 mins",
    content: `OFFICIAL META WHATSAPP CLOUD API SETUP GUIDE

━━━━━━━━━━━━━━━━━━━━
KEY BENEFIT: ₹0 PLATFORM COST
━━━━━━━━━━━━━━━━━━━━
Meta provides 1,000 free service conversations every month to every WhatsApp Business Account. KeyLink360 uses a BYOK (Bring Your Own Key) architecture so you get 100% free automation with zero platform markups.

━━━━━━━━━━━━━━━━━━━━
STEP-BY-STEP SETUP
━━━━━━━━━━━━━━━━━━━━
1. Open Sidebar → WhatsApp → Cloud API & Meta Setup tab.
2. Go to developers.facebook.com and create a "Business" app with WhatsApp product added.
3. In Meta Dashboard › WhatsApp › API Setup:
   • Copy your "Phone Number ID" and paste into KeyLink360.
   • Copy your "WhatsApp Business Account ID (WABA)" and paste into KeyLink360.
4. In Meta Dashboard › System Users:
   • Generate a Permanent Access Token (Bearer) with whatsapp_business_messaging permissions.
5. In KeyLink360:
   • Copy the "Meta Webhook Callback URL" (https://.../api/whatsapp/webhook).
   • Copy your "Webhook Verification Token".
6. Back in Meta Dashboard › WhatsApp › Configuration › Webhook:
   • Click "Edit", paste the Callback URL and Verify Token, and click "Verify and Save".
   • Subscribe to the "messages" field.
7. Click "Test API Connection" in KeyLink360 → Your WhatsApp Business is live with Gemini AI Auto-Replies!`,
    translations: {
      ta: {
        title: "அதிகாரப்பூர்வ WhatsApp Cloud API (Meta BYOK) மற்றும் 1,000 இலவச சேட் அமைப்பது எப்படி?",
        excerpt: "Meta வழங்கும் 1,000 இலவச சேட்களுடன் உங்கள் WhatsApp Business-ஐ ₹0 பிளாட்பார்ம் செலவில் இணைப்பது எப்படி.",
        content: `அதிகாரப்பூர்வ META WHATSAPP CLOUD API அமைக்கும் முறை

━━━━━━━━━━━━━━━━━━━━
முக்கிய பலன்: ₹0 PLATFORM COST
━━━━━━━━━━━━━━━━━━━━
Meta நிறுவனம் ஒவ்வொரு WhatsApp Business கணக்கிற்கும் மாதம் 1,000 Service சேட்களை முற்றிலும் இலவசமாக வழங்குகிறது. KeyLink360-ல் உங்கள் சொந்த API கீயை இணைத்து ₹0 செலவில் இயக்கலாம்.

━━━━━━━━━━━━━━━━━━━━
படிப்படியான வழிமுறைகள்
━━━━━━━━━━━━━━━━━━━━
1. Sidebar → WhatsApp → Cloud API & Meta Setup டேப் செல்லவும்.
2. developers.facebook.com தளத்தில் ஒரு Business App உருவாக்கி WhatsApp Product-ஐ சேர்க்கவும்.
3. Meta Dashboard › WhatsApp › API Setup பகுதியில்:
   • "Phone Number ID" மற்றும் "WhatsApp Business Account ID"-ஐ காப்பி செய்து KeyLink360-ல் பேஸ்ட் செய்யவும்.
4. Meta System Users பகுதியில் Permanent Access Token ஜெனரேட் செய்து பேஸ்ட் செய்யவும்.
5. KeyLink360-ல் உள்ள "Meta Webhook Callback URL" மற்றும் "Verify Token"-ஐ காப்பி செய்யவும்.
6. Meta Webhook Configuration-ல் பேஸ்ட் செய்து "Verify and Save" கொடுத்து "messages" ஃபீல்டை Subscribe செய்யவும்.
7. KeyLink360-ல் "Test API Connection" கிளிக் செய்து இணைப்பை உறுதிப்படுத்தவும்!`
      },
      hi: {
        title: "Meta WhatsApp Cloud API और 1,000 फ्री चैट्स सेटअप कैसे करें?",
        excerpt: "Meta BYOK आर्किटेक्चर के साथ ₹0 प्लेटफॉर्म कॉस्ट पर 1,000 फ्री मंथली चैट्स और AI ऑटो-रिप्लाई कनेक्ट करें।",
        content: `META WHATSAPP CLOUD API सेटअप गाइड

━━━━━━━━━━━━━━━━━━━━
1,000 फ्री मंथली चैट्स
━━━━━━━━━━━━━━━━━━━━
Meta हर महीने 1,000 सर्विस बातचीत मुफ्त देता है। KeyLink360 में अपने क्रेडेंशियल्स दर्ज करके ₹0 प्लेटफॉर्म चार्ज पर फुल ऑटोमेशन पाएं।

━━━━━━━━━━━━━━━━━━━━
स्टेप-बाय-स्टेप गाइड
━━━━━━━━━━━━━━━━━━━━
1. Sidebar → WhatsApp → Cloud API & Meta Setup टैब खोलें।
2. developers.facebook.com पर जाकर Business App बनाएं और WhatsApp जोड़ें।
3. Phone Number ID और WABA ID को KeyLink360 में पेस्ट करें।
4. Meta System Users से Permanent Access Token बनाकर पेस्ट करें।
5. Webhook Callback URL और Verify Token को Meta Webhook सेटिंग्स में पेस्ट करके सेव करें।
6. "messages" फील्ड सब्सक्राइब करें और KeyLink360 में "Test API Connection" दबाएं!`
      }
    }
  },
  {
    id: "faq-wa-web-qr",
    title: "WhatsApp Web Quick QR Scanner — Link Personal/Business Phone",
    category: "AI & Automation",
    excerpt:
      "Link your direct mobile phone in 5 seconds via QR code or 8-digit pairing code with Anti-Spam Safety Guard and Daily Message Limit Tracker.",
    readTime: "3 mins",
    content: `WHATSAPP WEB QUICK QR SCANNER SETUP GUIDE

━━━━━━━━━━━━━━━━━━━━
WHY USE QR SCANNER MODE?
━━━━━━━━━━━━━━━━━━━━
If you do not have a Meta Developer account or want to connect your personal WhatsApp number with zero paperwork, use WhatsApp Web QR Scanner mode.

━━━━━━━━━━━━━━━━━━━━
STEP-BY-STEP LINKING
━━━━━━━━━━━━━━━━━━━━
1. Open Sidebar → WhatsApp → WhatsApp Web QR Scanner tab.
2. Click "Generate WhatsApp Web QR Code".
3. Open WhatsApp on your mobile phone:
   • iOS: Settings → Linked Devices → Link a Device.
   • Android: 3-Dots Menu → Linked Devices → Link a Device.
4. Point your phone camera at the QR code on your screen (or use the 8-Digit Pairing Code).
5. Once scanned, your phone status becomes "Active & Connected"!

━━━━━━━━━━━━━━━━━━━━
ANTI-SPAM SAFETY GUARD & LIMITS
━━━━━━━━━━━━━━━━━━━━
• Natural Typing Delay: AI introduces a 1.5s – 3.5s jitter delay to mimic real human typing speed.
• Anti-Flood Protection: Limits fast bursts to max 6 msgs/min per contact.
• Daily Safe Message Limit Tracker: Visual progress bar (50 / 100 / 250 msgs/day) that auto-pauses at midnight to keep your personal WhatsApp number 100% safe from bans.`,
    translations: {
      ta: {
        title: "WhatsApp Web QR ஸ்கேனர் — பர்சனல் அல்லது பிசினஸ் போனை நேரடியாக இணைப்பது எப்படி?",
        excerpt: "எந்தவித Meta App அப்ரூவலும் இன்றி, QR கோட் ஸ்கேன் செய்து உங்கள் பர்சனல் போனை 5 வினாடிகளில் AI ஆட்டோமேஷனுடன் இணைக்கலாம்.",
        content: `WHATSAPP WEB QR ஸ்கேனர் அமைக்கும் முறை

━━━━━━━━━━━━━━━━━━━━
எதற்காக QR SCANNER முறை?
━━━━━━━━━━━━━━━━━━━━
உங்களிடம் Meta Developer Account இல்லையென்றால் அல்லது உங்கள் சொந்த பர்சனல் WhatsApp நம்பரையே ஆட்டோமேஷனுக்கு பயன்படுத்த விரும்பினால் இந்த முறை மிக சிறந்தது.

━━━━━━━━━━━━━━━━━━━━
இணைக்கும் வழிமுறைகள்
━━━━━━━━━━━━━━━━━━━━
1. Sidebar → WhatsApp → WhatsApp Web QR Scanner டேப் திறக்கவும்.
2. "Generate WhatsApp Web QR Code" பட்டனை கிளிக் செய்யவும்.
3. உங்கள் மொபைல் போனில் WhatsApp-ஐ திறக்கவும்:
   • iOS: Settings → Linked Devices → Link a Device.
   • Android: 3-புள்ளிகள் மெனு → Linked Devices → Link a Device.
4. திரையில் தெரியும் QR கோடை உங்கள் போன் கேமராவால் ஸ்கேன் செய்யவும் (அல்லது 8-எழுத்து Pairing Code பயன்படுத்தவும்).
5. ஸ்கேன் செய்தவுடன் "Device Linked & Active" என்று தோன்றும்!

━━━━━━━━━━━━━━━━━━━━
ANTI-SPAM பாதுகாப்பு மற்றும் DAILY LIMIT TRACKER
━━━━━━━━━━━━━━━━━━━━
• மனிதர்கள் டைப் செய்வது போன்ற 1.5s முதல் 3.5s காலதாமதத்துடன் AI பதில் அனுப்பும்.
• தினசரி பாதுகாப்பு வரம்பு (Daily Limit Tracker) உங்கள் கணக்கு WhatsApp Ban ஆகாமல் 100% பாதுகாக்கும்.`
      },
      hi: {
        title: "WhatsApp Web QR स्कैनर — व्यक्तिगत/व्यावसायिक फोन कैसे कनेक्ट करें?",
        excerpt: "बिना किसी Meta अप्रूवल के, सिर्फ QR कोड स्कैन करके अपना फोन 5 सेकंड में कनेक्ट करें और AI ऑटो-रिप्लाई पाएं।",
        content: `WHATSAPP WEB QR स्कैनर गाइड

━━━━━━━━━━━━━━━━━━━━
QR स्कैनर का उपयोग क्यों करें?
━━━━━━━━━━━━━━━━━━━━
यदि आपके पास Meta Developer अकाउंट नहीं है और आप अपने व्यक्तिगत व्हाट्सएप नंबर को आसानी से कनेक्ट करना चाहते हैं, तो यह तरीका सबसे आसान और 100% फ्री है।

━━━━━━━━━━━━━━━━━━━━
कनेक्ट करने के चरण
━━━━━━━━━━━━━━━━━━━━
1. Sidebar → WhatsApp → WhatsApp Web QR Scanner टैब खोलें।
2. "Generate WhatsApp Web QR Code" पर क्लिक करें।
3. अपने मोबाइल फोन में WhatsApp खोलें:
   • Linked Devices → Link a Device पर जाएं।
4. स्क्रीन पर मौजूद QR कोड को स्कैन करें।
5. तुरंत आपका डिवाइस "Connected & Active" हो जाएगा!

━━━━━━━━━━━━━━━━━━━━
Anti-Spam सुरक्षा व डेली लिमिट ट्रैकर
━━━━━━━━━━━━━━━━━━━━
• AI रिप्लाई में 1.5s - 3.5s का नेचुरल टाइपिंग डिले होता है।
• डेली मैसेज लिमिट ट्रैकर आपके पर्सनल व्हाट्सएप नंबर को सुरक्षित रखता है।`
      }
    }
  },
  {
    id: "faq1",
    title: "How do I get started with KEYLINK360?",
    category: "Getting Started",
    excerpt:
      "Simply sign up for a free account, go to Bio Pages or Links, and create your first smart resource. You can customize the theme, add multiple widgets, and configure tracking pixels or custom domains instantly.",
    readTime: "2 mins",
    content:
      "Welcome to KEYLINK360.\n\n1. Create your account and open the Dashboard.\n2. Go to Bio Pages and create your first page from scratch or a template.\n3. Add widgets (buttons, forms, WhatsApp, shop blocks) in the editor.\n4. Publish when ready, then share your public URL or QR code.\n5. Optionally connect Custom Domains, Pixels, and Integrations for branding and tracking.\n\nTip: Use Templates to launch faster, then save your own layouts under My Templates."
  },
  {
    id: "faq2",
    title: "What's the difference between the Free and Pro plans?",
    category: "Billing",
    excerpt:
      "The Free plan includes 1 Bio page, 13 core widgets, and up to 100MB of media storage. The Pro plan unlocks unlimited Bio Pages, high-speed custom shortened links, professional templates, full tracking integrations, custom domains, and retargeting pixels.",
    readTime: "3 mins",
    content:
      "Free Plan\n• 1 bio page\n• Core widgets\n• Basic analytics\n• Limited media storage\n\nPro / Smart Marketing\n• Unlimited bio pages\n• Smart links & QR codes\n• Custom domains\n• Tracking pixels\n• Messaging & email integrations\n• Priority support\n\nYou can review your current plan under Account Settings. Contact Support if you need help upgrading or comparing features for your team."
  },
  {
    id: "faq3",
    title: "Can I cancel or get a refund?",
    category: "Billing",
    excerpt:
      "Yes, you can cancel your subscription at any time from your billing settings. We offer a 14-day money-back guarantee for all annual subscriptions if you are not fully satisfied.",
    readTime: "1 min",
    content:
      "Cancellation\nYou can cancel anytime from Account Settings. Access continues through the end of your current billing period.\n\nRefunds\nAnnual plans include a 14-day money-back guarantee. Monthly plans are generally non-refundable after the billing date, except where required by law.\n\nNeed help? Open Contact Support with your workspace email and we will assist with cancellation or refund requests."
  },
  {
    id: "faq4",
    title: "How do I connect my Amazon Advertising account?",
    category: "APIs & Webhooks",
    excerpt:
      "Contact support or follow the Amazon Ads setup guide to synchronize advertising performance metrics with your workspace.",
    readTime: "4 mins",
    content:
      "Amazon Ads setup overview\n\n1. Open Integrations and confirm your workspace plan supports advertising connectors.\n2. Request Amazon Ads access from Contact Support if the connector is not yet unlocked.\n3. Provide your Amazon Advertising account ID and authorized email.\n4. Once connected, metrics sync on a scheduled interval.\n\nWebhooks\nFor custom automation, ask Support for webhook endpoints that can receive form leads and page events from KEYLINK360."
  },
  {
    id: "faq5",
    title: "Can I use my own custom domain?",
    category: "Custom Domains",
    excerpt:
      "Yes — connect yourdomain.com (root) or name.yourdomain.com (subdomain). Start with the beginner story guides in this category.",
    readTime: "2 mins",
    content:
      "Short answer: Yes.\n\nKEYLINK360 lets you open your bio page on an address you already own instead of the default KEY URL.\n\nYou have two main options:\n\n1) ROOT DOMAIN — yourdomain.com and www.yourdomain.com\n   → Read: \"Story guide: Connect a root domain (yourdomain.com)\"\n\n2) SUBDOMAIN — name.yourdomain.com or shop.yourdomain.com\n   → Read: \"Story guide: Connect a subdomain (name.yourdomain.com)\"\n\nNot ready to buy a domain?\n   → On Bio Pages, use \"Get free URL\" for something like yourname.keylink360.in (no DNS setup).\n\nWhere to start in the app:\nSidebar → Custom Domains → Connect Domain (button on the top right).\n\nPick the story guide that matches what you typed in the wizard — root or subdomain — and follow it step by step."
  },
  {
    id: "faq-cd-cloudflare-account",
    title: "Connect Domain with Cloudflare (approve each time)",
    category: "Custom Domains",
    excerpt:
      "Each time you connect a domain on Cloudflare, approve KEYLINK360 in the wizard — then DNS is added automatically.",
    readTime: "3 mins",
    content:
      "HOW CLOUDFLARE CONNECT WORKS\n\n1. Custom Domains → Connect Domain → enter your address and pick a bio page.\n2. Choose Cloudflare → tap Connect Cloudflare.\n3. Approve KEYLINK360 in Cloudflare (required every time you connect a domain).\n4. KEY adds the CNAME (or A for root) in YOUR Cloudflare zone.\n5. Status becomes LIVE when DNS + HTTPS are ready.\n\nThere is no separate “Cloudflare account Connected” button on Custom Domains. Everything runs inside Connect Domain.\n\nRULES\n• Unlimited custom domains / subdomains on each root you own.\n• One custom domain per bio page.\n• Other DNS hosts: choose Manual and copy the records we show.\n\nKEYLINK360 never writes customer DNS using the platform owner’s Cloudflare account."
  },
  {
    id: "faq-cd-start",
    title: "Start here: Custom domains for complete beginners",
    category: "Custom Domains",
    excerpt:
      "New to DNS? Read this first. Simple story examples for root domain, subdomain, and where to click in KEYLINK360.",
    readTime: "6 mins",
    content:
      "WHO IS THIS FOR?\nYou built a bio page in KEYLINK360. You want people to visit YOUR website name — not a long link. You have never touched DNS before. Perfect — read this like a short story.\n\n━━━━━━━━━━━━━━━━━━━━\nTHREE WAYS TO SHARE YOUR PAGE\n━━━━━━━━━━━━━━━━━━━━\n\nA) FREE KEY URL (easiest — no domain needed)\n   Example: yourname.keylink360.in\n   Where: Bio Pages → Get free URL\n   Good when: you are testing or do not own a domain yet.\n\nB) ROOT DOMAIN (your main website name)\n   Example: yourdomain.com\n   Also opens: www.yourdomain.com\n   Good when: you bought yourdomain.com and want that exact name.\n\nC) SUBDOMAIN (a prefix before your domain)\n   Example: name.yourdomain.com or shop.yourdomain.com\n   Good when: your main site stays somewhere else, but one link should open your KEY bio page.\n\n━━━━━━━━━━━━━━━━━━━━\nWORDS YOU WILL SEE (SIMPLE MEANING)\n━━━━━━━━━━━━━━━━━━━━\n\n• Domain — the website name you type in the browser (yourdomain.com).\n• Root / apex domain — yourdomain.com with nothing in front.\n• Subdomain — the part before the domain (name. in name.yourdomain.com).\n• DNS provider — where you edit DNS records (GoDaddy, Namecheap, Cloudflare, Hostinger, Amazon Route 53, etc.). KEY detects this automatically and shows the name on your domain card.\n• A record — points a name to an IP address (used for root domains).\n• CNAME record — points a name to another hostname (used for subdomains).\n• Connect Domain — the wizard button in Custom Domains.\n• Test Connection — checks if DNS is correct after you save records.\n\n━━━━━━━━━━━━━━━━━━━━\nTHE FULL JOURNEY (ALL TYPES)\n━━━━━━━━━━━━━━━━━━━━\n\nStep 1 — Build and publish your bio page first.\nStep 2 — Sidebar → Custom Domains → Connect Domain.\nStep 3 — Type your address exactly:\n        • Root: yourdomain.com (no www, no https://)\n        • Subdomain: name.yourdomain.com (full address including the prefix)\nStep 4 — Choose which bio page should open when someone visits that address.\nStep 5 — KEY shows which DNS host we detected and the exact records to copy.\nStep 6 — Log in to THAT provider (not a random one) and add the records.\nStep 7 — Wait 2–15 minutes for DNS to update worldwide.\nStep 8 — Back in KEY → Test Connection (plug icon on the domain row).\nStep 9 — Status becomes Verified → open your domain in the browser and celebrate.\n\nStatus meanings:\n• Pending DNS — records missing or still propagating.\n• DNS Verified / Provisioning SSL — almost there; HTTPS finishing.\n• Verified — live. Share the link.\n• OFFLINE on the card — DNS still points elsewhere; fix records and Test again.\n\n━━━━━━━━━━━━━━━━━━━━\nWHICH GUIDE TO READ NEXT?\n━━━━━━━━━━━━━━━━━━━━\n\n→ Root domain story (yourdomain.com): open \"Story guide: Connect a root domain\"\n→ Subdomain story (name.yourdomain.com): open \"Story guide: Connect a subdomain\"\n→ Exact buttons in the app: open \"Step-by-step: Connect Domain wizard\"\n→ Stuck on Pending DNS?: open \"Troubleshooting: domain not verifying\""
  },
  {
    id: "faq-cd-root",
    title: "Story guide: Connect a root domain (yourdomain.com)",
    category: "Custom Domains",
    excerpt:
      "Follow the yourdomain.com example — from Connect Domain to A record @, Test Connection, and going live.",
    readTime: "7 mins",
    content:
      "STORY — CONNECTING YOURDOMAIN.COM\n\nYou already own yourdomain.com from a registrar (GoDaddy, Namecheap, etc.). In KEYLINK360 you created a bio page with buttons, WhatsApp, and a product gallery.\n\nYou do NOT want to share:\n  https://keylink360.in/p/something-long\n\nYou WANT people to type:\n  yourdomain.com\n\nThat is a ROOT DOMAIN connection. Here is exactly what to do.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 1 — OPEN THE RIGHT PAGE IN KEY\n━━━━━━━━━━━━━━━━━━━━\n\n1. Log in to KEYLINK360.\n2. Left sidebar → Custom Domains.\n3. Top right → Connect Domain.\n\nDo not look for this inside Publish — custom domains live only on the Custom Domains page.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 2 — ENTER THE ROOT DOMAIN\n━━━━━━━━━━━━━━━━━━━━\n\nIn the wizard type:\n  yourdomain.com\n\nRules:\n• No https://\n• No www. (www is handled separately via DNS)\n• Just the bare domain: yourdomain.com\n\nSelect the bio page that should open → Continue.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 3 — KEY FINDS WHERE DNS LIVES\n━━━━━━━━━━━━━━━━━━━━\n\nKEYLINK360 checks nameservers and shows your DNS host (for example GoDaddy or Cloudflare).\n\nImportant: KEY shows YOUR real provider. Edit DNS there, not somewhere else.\n\nIf you bought the domain on Hostinger but moved nameservers to Cloudflare, you edit Cloudflare — trust the name KEY shows.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 4 — ADD TWO A RECORDS (ROOT ONLY)\n━━━━━━━━━━━━━━━━━━━━\n\nKEYLINK360 shows something like:\n\n  Record 1\n  Type: A\n  Name / Host: @  (means root — some panels say \"@\" or leave blank)\n  Value / Points to: 69.46.46.90  (use the IP KEY shows on YOUR screen)\n\n  Record 2\n  Type: A\n  Name / Host: www\n  Value / Points to: same IP as above\n\nLog in to your DNS provider → DNS → Add both records → Save.\n\nCloudflare users: turn Proxied (orange cloud) ON for both records.\n\nRemove OLD A records that point to a previous website host. Duplicate @ records cause \"still opens another site\" errors.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 5 — WAIT, THEN TEST\n━━━━━━━━━━━━━━━━━━━━\n\nDNS is not instant. Wait a few minutes, then in KEYLINK360:\n\nCustom Domains → yourdomain.com row → Test Connection (plug icon).\n\nFirst try: Pending DNS (normal if records just saved).\nSecond try after a few minutes: DNS Verified → then Verified.\n\nYou can also expand \"Show DNS\" on the card to copy values again.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 6 — OPEN THE LIVE SITE\n━━━━━━━━━━━━━━━━━━━━\n\nWhen status = Verified, open your domain.\n\nBoth work:\n  https://yourdomain.com\n  https://www.yourdomain.com\n\nYour KEY bio page opens with HTTPS.\n\n━━━━━━━━━━━━━━━━━━━━\nROOT DOMAIN CHECKLIST (COPY THIS)\n━━━━━━━━━━━━━━━━━━━━\n\n☐ Bio page built and published\n☐ Custom Domains → Connect Domain\n☐ Entered yourdomain.com (root only)\n☐ Picked the correct bio page\n☐ Added A record @ → KEY IP\n☐ Added A record www → same IP\n☐ Removed old conflicting A records\n☐ Waited a few minutes\n☐ Test Connection until Verified\n☐ Opened domain in browser\n\nNote: You only change DNS at your domain provider. If HTTPS is still pending, wait a few minutes and click Test Connection again. See Troubleshooting article if needed."
  },
  {
    id: "faq-cd-subdomain",
    title: "Story guide: Connect a subdomain (name.yourdomain.com)",
    category: "Custom Domains",
    excerpt:
      "Follow the name.yourdomain.com example — one CNAME record, Test Connection, and your bio page on a prefix URL.",
    readTime: "6 mins",
    content:
      "STORY — CONNECTING NAME.YOURDOMAIN.COM\n\nYour company already uses yourdomain.com for the main marketing website (hosted elsewhere). You do NOT want to move the whole domain.\n\nYou only want ONE special address for your KEY bio page:\n  name.yourdomain.com\n\nThat is a SUBDOMAIN. The prefix is name. and the parent domain is yourdomain.com.\n\n━━━━━━━━━━━━━━━━━━━━\nROOT VS SUBDOMAIN — QUICK COMPARE\n━━━━━━━━━━━━━━━━━━━━\n\nROOT (yourdomain.com)\n  Records needed: 2 × A records (@ and www)\n  Wizard input: yourdomain.com\n\nSUBDOMAIN (name.yourdomain.com)\n  Records needed: 1 × CNAME\n  Wizard input: name.yourdomain.com  ← type the FULL address including name.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 1 — CONNECT IN KEY\n━━━━━━━━━━━━━━━━━━━━\n\n1. Sidebar → Custom Domains → Connect Domain.\n2. Type exactly:\n     name.yourdomain.com\n   NOT just yourdomain.com\n3. Select the bio page that should open → Continue.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 2 — CHECK DNS HOST\n━━━━━━━━━━━━━━━━━━━━\n\nKEYLINK360 shows where yourdomain.com DNS is managed — for example Cloudflare or Namecheap.\n\nYou must be able to edit DNS for the PARENT zone (yourdomain.com). If your IT team owns DNS, send them the CNAME KEY shows.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 3 — ADD ONE CNAME RECORD\n━━━━━━━━━━━━━━━━━━━━\n\nKEYLINK360 shows something like:\n\n  Type: CNAME\n  Name / Host: name\n    (some panels want only \"name\", not the full name.yourdomain.com)\n  Target / Value: keylink360.in\n    (use the exact target KEY shows on YOUR screen)\n\nCloudflare: Proxied (orange cloud) is OK.\n\nDo NOT add A records for a subdomain connection — use CNAME unless KEY explicitly says otherwise.\n\n━━━━━━━━━━━━━━━━━━━━\nSTEP 4 — TEST AND GO LIVE\n━━━━━━━━━━━━━━━━━━━━\n\nWait a few minutes → Test Connection on the domain row.\n\nWhen Verified, open:\n  https://name.yourdomain.com\n\nYour bio page loads. The main site at yourdomain.com stays unchanged.\n\n━━━━━━━━━━━━━━━━━━━━\nMORE SUBDOMAIN EXAMPLES\n━━━━━━━━━━━━━━━━━━━━\n\nWhat you type in wizard → CNAME host label\n\n  shop.yourdomain.com     →  shop\n  bio.yourdomain.com      →  bio\n  link.yourdomain.com     →  link\n  studio.yourdomain.com   →  studio\n\nRule: everything BEFORE the main domain is the host name in DNS.\n\n━━━━━━━━━━━━━━━━━━━━\nSUBDOMAIN CHECKLIST\n━━━━━━━━━━━━━━━━━━━━\n\n☐ Typed FULL subdomain in wizard (e.g. name.yourdomain.com)\n☐ Selected correct bio page\n☐ Added CNAME with host = prefix only (name, shop, bio…)\n☐ Target = KEY hostname shown in app\n☐ Test Connection → Verified\n☐ Opened https://name.yourdomain.com in browser"
  },
  {
    id: "faq-cd-wizard",
    title: "Step-by-step: Connect Domain wizard in KEYLINK360",
    category: "Custom Domains",
    excerpt:
      "Every screen in the Connect Domain wizard — what to click, what to type, and what happens after Done.",
    readTime: "5 mins",
    content:
      "This guide matches the Connect Domain wizard screen by screen.\n\n━━━━━━━━━━━━━━━━━━━━\nBEFORE YOU START\n━━━━━━━━━━━━━━━━━━━━\n\n• Have at least one bio page ready.\n• Know your domain name (root or full subdomain).\n• Know the login for your DNS provider (GoDaddy, Cloudflare, etc.).\n\n━━━━━━━━━━━━━━━━━━━━\nSCREEN 1 — ENTER DOMAIN\n━━━━━━━━━━━━━━━━━━━━\n\nWhere: Custom Domains → Connect Domain\n\n1. Type your domain:\n   Root example: yourdomain.com\n   Subdomain example: name.yourdomain.com\n2. Pick which bio page opens on that address.\n3. Click Continue.\n\nIf the page dropdown says \"(in use)\", that page already has another domain — pick a different page or remove the old domain first.\n\n━━━━━━━━━━━━━━━━━━━━\nSCREEN 2 — ANALYZING\n━━━━━━━━━━━━━━━━━━━━\n\nKEYLINK360 checks nameservers and detects your DNS provider. Wait a few seconds.\n\n━━━━━━━━━━━━━━━━━━━━\nSCREEN 3 — YOUR DNS PROVIDER\n━━━━━━━━━━━━━━━━━━━━\n\nYou see the provider logo and name (e.g. Cloudflare, GoDaddy, Amazon Route 53).\n\nOptional: \"Open [Provider] DNS help\" opens their official docs in a new tab.\n\nClick Continue.\n\n━━━━━━━━━━━━━━━━━━━━\nSCREEN 4 — DNS RECORDS\n━━━━━━━━━━━━━━━━━━━━\n\nKEYLINK360 lists exact records to copy:\n\nRoot domain → two A records (@ and www) pointing to the platform IP.\nSubdomain → one CNAME pointing to the KEY hostname.\n\nUse Copy buttons next to each value.\n\nIf Cloudflare for SaaS is enabled, you may also see a TXT ownership record — add it if shown.\n\nClick \"I added these records\" or verify when ready.\n\n━━━━━━━━━━━━━━━━━━━━\nSCREEN 5 — SUCCESS / PENDING\n━━━━━━━━━━━━━━━━━━━━\n\n• Verified or DNS Verified → you are live or almost live.\n• Still Pending DNS → records not detected yet. Wait and use Test Connection from the domain list.\n\nYou can close the wizard — the domain stays on your Custom Domains list.\n\n━━━━━━━━━━━━━━━━━━━━\nAFTER THE WIZARD — DOMAIN CARD ACTIONS\n━━━━━━━━━━━━━━━━━━━━\n\nOn each domain row:\n\n• Domain name — click to open when live.\n• Opens: dropdown — change which bio page loads without reconnecting DNS.\n• Show DNS — see records again.\n• Test Connection (plug) — re-check DNS anytime.\n• Refresh — sync SSL/status.\n• Trash — remove domain from KEY (does not delete your domain from the registrar).\n\nBadge \"DNS at [Provider]\" — where you must edit records.\n\n━━━━━━━━━━━━━━━━━━━━\nRECOMMENDED ORDER WITH PUBLISH\n━━━━━━━━━━━━━━━━━━━━\n\n1. Build bio page\n2. Connect custom domain (this wizard)\n3. Publish (set visibility)\n4. Share your brand URL"
  },
  {
    id: "faq-cd-trouble",
    title: "Troubleshooting: domain stuck on Pending DNS or OFFLINE",
    category: "Custom Domains",
    excerpt:
      "Test Connection fails? Wrong website opens? Read common fixes — wrong provider, old A records, root vs subdomain mix-ups.",
    readTime: "5 mins",
    content:
      "STORY — \"I CLICKED TEST 10 TIMES BUT STILL PENDING\"\n\nYou connected yourdomain.com. The card said OFFLINE and Pending DNS. You were editing Cloudflare — but your domain actually used Amazon Route 53. No wonder nothing changed.\n\nLesson: always edit DNS where the card says \"DNS at [Provider]\".\n\n━━━━━━━━━━━━━━━━━━━━\nPROBLEM 1 — WRONG DNS WEBSITE\n━━━━━━━━━━━━━━━━━━━━\n\nSymptom: You add records but Test never passes.\n\nFix:\n1. Read the badge on your domain row: \"DNS at GoDaddy\" (example).\n2. Log in to THAT site only.\n3. Add records exactly as Show DNS lists them.\n\n━━━━━━━━━━━━━━━━━━━━\nPROBLEM 2 — ROOT VS SUBDOMAIN MIX-UP\n━━━━━━━━━━━━━━━━━━━━\n\nSymptom: Added A records but you wanted name.yourdomain.com.\n\nFix: Subdomains need CNAME, not @/www A records. Remove wrong records. Re-run wizard with full subdomain typed.\n\nSymptom: Added CNAME but you wanted yourdomain.com.\n\nFix: Root needs A record @ only. Connect www.yourdomain.com separately as a subdomain (CNAME) if needed.\n\n━━━━━━━━━━━━━━━━━━━━\nPROBLEM 3 — OLD RECORDS STILL POINTING ELSEWHERE\n━━━━━━━━━━━━━━━━━━━━\n\nSymptom: Message says site \"still opens another website\".\n\nFix:\n• Delete extra @ A records (only one correct IP should remain).\n• Remove parking page or old host IPs.\n• For www, point to the same KEY IP (or CNAME if your provider requires).\n\n━━━━━━━━━━━━━━━━━━━━\nPROBLEM 4 — DNS NOT PROPAGATED YET\n━━━━━━━━━━━━━━━━━━━━\n\nSymptom: Records look correct in provider but KEY says Pending.\n\nFix: Wait 5–30 minutes. TTL and registrar speed vary. Test again — do not change records every minute.\n\n━━━━━━━━━━━━━━━━━━━━\nPROBLEM 5 — HTTPS / SSL STUCK AFTER DNS OK\n━━━━━━━━━━━━━━━━━━━━\n\nSymptom: DNS Verified but not Verified yet.\n\nFix: Wait a few minutes. Click Refresh / Test Connection on the domain row. No hosting panel setup is required — only DNS at your domain provider.\n\n━━━━━━━━━━━━━━━━━━━━\nPROBLEM 6 — CANNOT DELETE A DOMAIN\n━━━━━━━━━━━━━━━━━━━━\n\nFix: Click trash on the domain row. If error persists, refresh the page and try again, or contact support with the domain name.\n\n━━━━━━━━━━━━━━━━━━━━\nSTILL STUCK?\n━━━━━━━━━━━━━━━━━━━━\n\nContact Support with:\n• Domain name\n• Root or subdomain\n• Screenshot of DNS records from your provider\n• Screenshot of KEY Custom Domains card\n\nWe will help you finish the connection."
  },
  {
    id: "faq5b",
    title: "What is the difference between Publish and Custom Domains?",
    category: "Getting Started",
    excerpt:
      "Publish goes live and sets who can see your site. Custom Domains connects and manages your brand domain.",
    readTime: "2 mins",
    content:
      "Publish vs Custom Domains\n\nPublish (navbar on Dashboard / Account)\n• Makes your KEYLINK360 website live\n• Shows your public URL\n• Lets you choose visibility: Public, Workspace only, or Selected members\n• Lets you copy or open the live link after success\n\nCustom Domains (sidebar)\n• Connect root domain (yourdomain.com) or subdomain (name.yourdomain.com)\n• View DNS instructions and detected DNS provider\n• Verify Pending / Verified status\n• Remove domains\n\nRecommended flow\n1. Build your bio pages\n2. Help Center → Custom Domains category → read \"Start here: Custom domains for complete beginners\"\n3. Open Custom Domains → Connect Domain → follow the story guide for root or subdomain\n4. Click Publish to go live and share the URL\n\nTip: Domain connect/manage is only on Custom Domains. Publish is only for go-live and visibility. For a free URL without buying a domain, use Get free URL on Bio Pages."
  },
  {
    id: "faq6",
    title: "How do I publish my first bio page?",
    category: "Getting Started",
    excerpt:
      "Open Bio Pages, create or edit a page, then use Publish on the Dashboard to make your site live and set visibility.",
    readTime: "2 mins",
    content:
      "Publishing checklist\n\n1. Finish your page content and cover image in the editor.\n2. Save a draft anytime — drafts stay private.\n3. On Dashboard or Account, click Publish and choose visibility (public, workspace, or selected members).\n4. To use your own brand domain, open Custom Domains in the sidebar (not inside Publish).\n5. Copy the public URL or generate a QR code from the QR Codes page.\n6. Share the link on social profiles, packaging, or campaigns.\n\nIf something looks wrong on the public page, reopen the editor, fix blocks, and publish again."
  },
  {
    id: "faq7",
    title: "How is my workspace data protected?",
    category: "Security & Privacy",
    excerpt:
      "Account data is stored in your browser workspace backup and server sync where available. Enable MFA from Account Settings for stronger sign-in protection.",
    readTime: "2 mins",
    content:
      "Security basics\n\n• Keep your account email up to date under Account Settings.\n• Enable MFA for two-factor protection.\n• Export regular JSON backups before major imports or device changes.\n• Only share public bio URLs — drafts remain private until published.\n\nPrivacy\nLeads captured by forms stay in your Contacts list. Do not share backup files that contain customer data outside your organization."
  },
  {
    id: "faq8",
    title: "What DNS records do I need?",
    category: "Custom Domains",
    excerpt:
      "Root: A @ → platform IP. Subdomain: CNAME → platform hostname. Copy from Show DNS.",
    readTime: "2 mins",
    content:
      "KEYLINK360 supports root domains and subdomains.\n\nROOT (yourdomain.com)\n  Type: A\n  Name: @\n  Value: platform IP (example: 69.46.46.90)\n\nSUBDOMAIN (name.yourdomain.com, www.yourdomain.com, shop.yourdomain.com)\n  Type: CNAME\n  Name: name (prefix only — not the full domain)\n  Value: keylink360.in (or value from Show DNS)\n\nRules:\n• Root → A record only\n• Subdomain → CNAME only (never A)\n\nAlways copy live values from Custom Domains → Show DNS.\n\nAfter saving → Test Connection → Verified."
  }
];
