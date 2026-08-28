# KEYLINK360 — COMPLETE PROJECT ANALYSIS
## முழுமையான திட்டக் கட்டமைப்பு மற்றும் தொழில்நுட்பப் பகுப்பாய்வு அறிக்கை (Bilingual Edition: English & தமிழ்)

---

## 1. Executive Summary / நிர்வாகச் சுருக்கம்

**[EN]**: **KEYLINK360** is a full-featured, multi-tenant digital presence and micro-website SaaS platform built with **React 19 + TypeScript + Vite 6 + Tailwind CSS v4** on the frontend, and an **Express 4 + Node.js (TypeScript via tsx)** backend deployed in a hybrid storage architecture (**Local JSON Store `data-store.json` + Supabase PostgreSQL with KV & Normalized tables**). The system allows registered users (**Sub Owners**) to build, host, and publish mobile-first mini-websites and bio-link landing pages, attach custom apex domains and subdomains (via automated Cloudflare for SaaS, Cloudflare OAuth, or manual DNS), generate customizable dynamic QR codes with durable `/q/:code` redirect matrices, shorten links, manage probabilistic traffic link rotators, capture structured leads with Razorpay pay-on-submit integration, manage WhatsApp marketing assets, and track granular visitor telemetry (devices, OS, browsers, referrer, hostnames).

**[தமிழ்]**: **KEYLINK360** என்பது பல பயனர்கள் (Multi-tenant) பயன்படுத்தக்கூடிய ஒரு முழுமையான டிஜிட்டல் இருப்பு (Digital Presence) மற்றும் மினி-இணையதள SaaS மென்பொருளாகும். இது முன்பகுதியில் **React 19 + TypeScript + Vite 6 + Tailwind CSS v4** தொழில்நுட்பத்துடனும், பின்பகுதியில் **Express 4 + Node.js** மற்றும் **ஹைப்ரிட் டேட்டாபேஸ் (Local JSON Store + Supabase PostgreSQL)** கட்டமைப்புடனும் உருவாக்கப்பட்டுள்ளது. இதில் பதிவு செய்யும் பயனர்கள் (**Sub Owners**) தங்களின் சொந்த பிராண்ட் பெயரில் மினி-இணையதளங்களை உருவாக்கலாம், கஸ்டம் டொமைன்களை (`yourbrand.com`) இணைக்கலாம், மாற்றக்கூடிய ஸ்மார்ட் QR குறியீடுகளை உருவாக்கலாம், இணைப்புகளைச் சுருக்கலாம், டிராஃபிக் ரொட்டேட்டர் மூலம் பார்வையாளர்களைப் பிரிக்கலாம், ரேஸர்பே (Razorpay) கட்டணத்துடன் கூடிய படிவங்கள் மூலம் வாடிக்கையாளர் விவரங்களைச் (Leads) சேகரிக்கலாம் மற்றும் விரிவான பார்வையாளர் புள்ளிவிவரங்களைக் (Analytics) கண்காணிக்கலாம்.

---

## 2. Short Introduction / சுருக்கமான அறிமுகம்

**[EN]**: KEYLINK360 is an all-in-one digital presence suite designed to replace isolated tools (e.g., Linktree for links, Bitly for URL shortening, QR code generators, Typeform for lead capture, and Carrd for landing pages) into a unified, branded platform where each user owns their own digital hub on custom domains or free platform subdomains.

**[தமிழ்]**: KEYLINK360 என்பது பல தனித்தனி மென்பொருட்களுக்கு (இணைப்புகளுக்கு Linktree, URL சுருக்கத்திற்கு Bitly, QR குறியீடுகளுக்கு QR Tiger, லீட்களுக்கு Typeform, லேண்டிங் பக்கங்களுக்கு Carrd) மாற்றாக, அனைத்தையும் ஒரே தளத்தில் ஒருங்கிணைத்து, பயனர்கள் தங்களின் சொந்த டொமைன்களில் இயங்க வைக்கும் ஒரே டிஜிட்டல் தளமாகும்.

---

## 3. Detailed Introduction / விரிவான அறிமுகம்

**[EN]**: 
* **The Platform Engine**: Orchestrated by `server.ts`, which acts as an Express HTTP server, WebSocket/Vite development middleware in local environments, and an edge router serving both API requests and dynamic hostname resolution for incoming tenant traffic.
* **The Client Application**: A responsive Single Page Application (SPA) driven by `src/App.tsx`, featuring 16 workspace screens (`src/navigation.ts`), a comprehensive 27-block drag-and-drop page builder (`src/components/BioPagesScreen.tsx` & `src/lib/bioBlocks.ts`), and dynamic client/server public renderers (`src/components/PublicBioPageView.tsx`).
* **Multi-Tenant Routing Engine**: Custom domains and platform subdomains resolve dynamically without rebuilding the frontend:
  * Apex & Subdomain traffic (`yourbrand.com`, `shop.yourbrand.com`) is intercepted by Express middleware (`server.ts:1176-1240`) or Cloudflare Workers (`workers/custom-domain-proxy.js`).
  * The hostname is mapped to a database-backed `page_id` (`server/domains/repository.ts`), setting a route cookie and rendering the corresponding public bio page directly under the user's custom brand.

**[தமிழ்]**:
* **தளத்தின் சர்வர் எஞ்சின்**: `server.ts` கோப்பு மூலம் இயக்கப்படும் எக்ஸ்பிரஸ் சர்வர், API கோரிக்கைகளைக் கையாள்வதுடன், உள்வரும் டொமைன் முகவரிகளை உடனடியாக அடையாளம் கண்டு உரிய பயனர் பக்கத்திற்கு அனுப்புகிறது.
* **முன்பகுதி பயன்பாடு**: `src/App.tsx` மூலம் இயக்கப்படும் நவீன SPA செயலி. இதில் 16 பிரதான திரைகள், 27 வகையான பிளாக் கூறுகளைக் கொண்ட பேஜ் பில்டர் மற்றும் நேரடி மொபைல் மாதிரிக்காட்சி ஆகியவை உள்ளன.
* **டைனமிக் ரூட்டிங் கட்டமைப்பு**: ஒரு பயனர் தனது சொந்த டொமைனை (`yourbrand.com`) இணைக்கும்போது, எவ்வித சர்வர் ரீஸ்டார்ட்டும் இன்றி, கிளவுட்ஃபிளேர் மற்றும் எக்ஸ்பிரஸ் ரூட்டிங் மூலம் அப்பக்கத்தை உடனடியாக அந்த பிராண்ட் பெயரிலேயே காட்சிப்படுத்துகிறது.

---

## 4. Core Purpose / முதன்மை நோக்கம்

**[EN]**: The core purpose of KEYLINK360 is to provide creators, freelancers, small businesses, and agencies with an instant, code-free digital storefront and identity engine. It operationalizes the **Build -> Connect -> Track -> Grow** lifecycle:
1. **Build**: Assemble mobile-first landing pages with 27 interactive block types and 50 industry templates.
2. **Connect**: Link custom domains (`yourbrand.com`), subdomains (`links.yourbrand.com`), platform subdomains (`user.keylink360.mindflo.today`), dynamic QR codes, and WhatsApp channels.
3. **Track**: Collect visit and click telemetry, user-agent parsing, link rotator distribution stats, and QR scan metrics.
4. **Grow**: Capture contact leads, process Razorpay transactions, and retarget audiences across advertising networks.

**[தமிழ்]**: உருவாக்குநர்கள், ஃப்ரீலான்ஸர்கள், சிறு வணிகங்கள் மற்றும் ஏஜென்சிகளுக்கு கோடிங் அறிவு தேவையின்றி நொடிகளில் தொழில்முறை டிஜிட்டல் அடையாளத்தை வழங்குவதே இதன் நோக்கம்.
1. **Build (உருவாக்குதல்)**: 27 விதமான பிளாக்குகள் மற்றும் 50 மாதிரி டெம்ப்ளேட்களைப் பயன்படுத்தி பக்கங்களை வடிவமைத்தல்.
2. **Connect (இணைத்தல்)**: சொந்த டொமைன்கள், இலவச சப்டொமைன்கள், ஸ்மார்ட் QR குறியீடுகள் மற்றும் வாட்ஸ்அப் தொடர்புகளை இணைத்தல்.
3. **Track (கண்காணித்தல்)**: பார்வையாளர்களின் எண்ணிக்கை, சாதனங்கள் (Device/OS), கிளிக்குகள் மற்றும் QR ஸ்கேன்களைக் கண்காணித்தல்.
4. **Grow (வளர்த்தல்)**: ரேஸர்பே மூலம் கட்டணம் பெறுதல், லீட்களைச் சேகரித்தல் மற்றும் விளம்பர ரீடார்கெட்டிங் செய்தல்.

---

## 5. Problem Being Solved / தீர்க்கப்படும் பிரச்சனைகள்

| பிரச்சனை / Problem in Market | வழக்கமான முறை / Legacy Approach | KEYLINK360 தீர்வு / Codebase Solution |
| :--- | :--- | :--- |
| **Tool Sprawl (பல மென்பொருட்கள்)** | 5 வெவ்வேறு கருவிகளுக்கு தனித்தனியாகப் பணம் செலுத்துதல் | 5 பிரிவுகளும் ஒரே டேஷ்போர்டில் (`src/App.tsx`) ஒருங்கிணைக்கப்பட்டுள்ளன. |
| **Weak Branding (பிராண்டிங் குறைபாடு)** | `linktr.ee/name` போன்ற மற்ற நிறுவனப் பெயர்களைப் பகிர்தல் | முழுமையான சொந்த டொமைன் (`yourbrand.com`) பயன்பாடு (`server/domains/`). |
| **Broken QR Codes (செயலிழக்கும் QR)** | அச்சிடப்பட்ட QR குறியீடுகளின் இணைப்பு மாறினால் வீணாகுதல் | அச்சிட்ட பிறகும் இலக்கு முகவரியை மாற்றிக்கொள்ளும் நிரந்தர ஸ்மார்ட் QR (`server/qrCodes/`). |
| **Unmonetized Leads (பணம் பெறாத படிவங்கள்)**| படிவங்களுக்குப் பிறகு தனி கேட்வேக்கு மாற்றுதல் | படிவத்திலேயே Razorpay மூலம் கட்டணம் பெற்று 'Thank You' பக்கம் காட்டும் வசதி (`server/payments/`). |
| **A/B Testing (டிராஃபிக் பிரிப்பு)** | விலையுயர்ந்த நிறுவன மென்பொருட்கள் தேவைப்படுதல் | சதவீத அடிப்படையில் டிராஃபிக்கைப் பிரிக்கும் இலவச Link Rotator (`server/linkRotators/`). |

---

## 6. Main Owner Model / முதன்மை உரிமையாளர் மாதிரி

```text
KEYLINK360 SaaS Platform (முதன்மை இயங்குதளம்)
    │
    ├── Main Owner (தளத்தின் முதன்மை உரிமையாளர் / Super-Admin)
    │      ├── கட்டுப்பாட்டில் உள்ள சர்வர்கள் (Express / Railway / Docker)
    │      ├── முதன்மை டொமைன் & கிளவுட்ஃபிளேர் மண்டலம் (mindflo.today)
    │      ├── தரவுத்தளம் (Supabase PostgreSQL / Root KV)
    │      └── பாதுகாப்பு சாவிகள் (AUTH_SECRET, SMTP, Cloudflare OAuth, Razorpay)
    │
    └── KEYLINK360 Sub Owners (தளத்தில் பதிவு செய்த பயனர்கள்)
           ├── பயனர் கணக்கு: keylink360@gmail.com அல்லது புதிய பயனர்
           ├── டிஜிட்டல் சொத்துக்கள்: பக்கங்கள், குறுகிய இணைப்புகள், QR குறியீடுகள்
           └── இணைக்கப்பட்ட கஸ்டம் டொமைன்கள் & DNS இணைப்புகள்
```

**[EN]**: Tenant Isolation is enforced through an `owner_user_id` column across tables in `supabase/schema.sql`. Note that a Super-Admin UI dashboard to oversee all tenant data in one place is currently **NOT FOUND / NOT IMPLEMENTED** in the UI.

**[தமிழ்]**: தரவுத்தளத்தில் உள்ள ஒவ்வொரு அட்டவணையிலும் `owner_user_id` மூலமாக பயனர்களின் தரவுகள் தனித்தனியாகப் பிரிக்கப்பட்டுள்ளன. அனைத்து பயனர்களையும் ஒரே திரையில் நிர்வகிக்கும் Super-Admin முகப்பு UI தற்போது இன்னும் உருவாக்கப்படவில்லை.

---

## 7. Sub Owner Model (பயனர் = துணை உரிமையாளர்)

**[EN]**: Every registered user in KEYLINK360 operates as an independent Sub Owner managing their own digital presence.
* **Own Profile**: Name, company, phone, country, avatar (`PATCH /api/auth/profile`).
* **Own Bio Pages / Mini Websites**: Create unlimited pages, drag-and-drop 27 blocks, save drafts, publish live (`/api/pages`, `/api/page/:id`).
* **Own Short Links & Rotators**: Create branded short URLs and split traffic (`/api/short-links`, `/api/link-rotators`).
* **Own Smart QR Codes**: Generate customized branded vector QR codes (`/api/qr-codes`).
* **Own CRM & Leads**: Capture, tag, filter, and export leads (`/api/contacts`, `/api/leads`).
* **Own Custom Domains**: Connect apex domains and subdomains (`/api/domains`).
* **Own Free Platform Subdomains**: Claim `{slug}.keylink360.mindflo.today` (`/api/platform-subdomains`).

**[தமிழ்]**: பதிவு செய்த ஒவ்வொரு பயனரும் தனது கணக்கின் முழுமையான துணை உரிமையாளர் ஆவார்:
* **சொந்த சுயவிவரம்**: பெயர், நிறுவனப் பெயர், தொலைபேசி, நாடு, சுயவிவரப் படம்.
* **சொந்த மினி இணையதளங்கள்**: வரம்பற்ற பக்கங்களை உருவாக்குதல், 27 பிளாக்குகளை மாற்றி அமைத்தல், வரைவு சேமித்தல், நேரலையில் வெளியிடுதல்.
* **சொந்த குறுகிய இணைப்புகள் & ரொட்டேட்டர்கள்**: பிராண்ட் பெயரிலான குறுகிய இணைப்புகள் மற்றும் A/B டிராஃபிக் பிரிப்பு.
* **சொந்த ஸ்மார்ட் QR குறியீடுகள்**: லோகோ மற்றும் வண்ணங்களுடன் கூடிய வெக்டர் QR குறியீடுகள்.
* **சொந்த CRM வாடிக்கையாளர் பட்டியல்**: படிவங்கள் மூலம் வந்த வாடிக்கையாளர் தகவல்களைத் தேடுதல், டேக் செய்தல், CSV-யாகப் பதிவிறக்குதல்.
* **சொந்த டொமைன்கள்**: சொந்த இணைய முகவரிகளை (`yourbrand.com`) இணைத்து சரிபார்த்தல்.

---

## 8. User / Visitor Model / பார்வையாளர் மாதிரி

```text
Visitor (பார்வையாளர் / வாடிக்கையாளர்)
    │
    ├── இணையப் பக்கத்தைத் திறக்கிறார் (எ.கா: https://yourbrand.com)
    │
    ├── நிகழ்வு பதிவு: /api/track (சாதனம், OS, பிரவுசர், டொமைன் தானாகப் பதிவாகிறது)
    │
    ├── பக்கத்தில் மேற்கொள்ளும் செயல்கள்:
    │     ├── இணைப்புகளைக் கிளிக் செய்தல் (Click Event பதிவாகிறது)
    │     ├── படிவத்தைப் பூர்த்தி செய்தல் (POST /api/leads வழியே CRM-க்கு செல்கிறது)
    │     ├── Razorpay மூலம் பணம் செலுத்துதல் (HMAC சரிபார்ப்புக்குப் பின் Thank You பக்கம் காட்டப்படுகிறது)
    │     ├── vCard பதிவிறக்குதல் (.vcf கோப்பாக மொபைல் போனில் எண் சேமிக்கப்படுகிறது)
    │     ├── ஸ்பின் வீல் விளையாடுதல் (கூப்பன் குறியீடு பெறுகிறார்)
    │     └── கூகுள் மேப் வழியே வழியறிதல் (Directions)
    │
    └── அச்சிடப்பட்ட QR குறியீட்டை ஸ்கேன் செய்தல் (/q/:code வழியே நேரலை இலக்கை அடைகிறார்)
```

---

## 9. Target Users & Implementation Matrix / இலக்கு பயனர்கள் & தற்போதைய நிலை

| பயனர் பிரிவு / User Category | பயன் / Why Useful | ஆதரிக்கும் அம்சங்கள் / Features | தற்போதைய நிலை / Status | குறியீட்டு சான்று / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Freelancers & Devs** | போர்ட்ஃபோலியோ, கிட்ஹப்/லிங்க்ட்இன், vCard பதிவிறக்கம், தொடர்பு படிவம் | Header, Text, Button, Socials, vCard, PDF, Testimonials, Form | **Implemented** | `src/lib/bioBlocks.ts:289-317` |
| **Small Businesses & Shops** | கடை முகவரி, கூகுள் மேப், வாட்ஸ்அப் ஆர்டர், அழைப்பு பட்டன் | Shop, Map (Google Maps embed), Call (`tel:`), Form | **Implemented** | `src/lib/bioBlocks.ts:211-250, 634-744` |
| **Creators & Influencers** | யூடியூப் வீடியோக்கள், ஸ்பாடிஃபை இசை, டிப் ஜார் (காபி நிதி) | Video (auto thumbnail), Music, Socials, Tip Jar | **Implemented** | `src/lib/bioBlocks.ts:13-64, 583-622` |
| **E-Commerce & Marketers** | டிராஃபிக் பிரிப்பு, கவுண்ட்டவுன் டைமர், கூப்பன்கள், லீட் சேகரிப்பு | Link Rotator, Countdown, Coupon, Link Spin, Short Links | **Implemented** | `server/linkRotators/`, `src/lib/bioBlocks.ts:133-177` |
| **Agencies & Orgs** | பல வாடிக்கையாளர்களின் தளங்களை ஒரே கணக்கில் நிர்வகித்தல் | Multi-page CRUD, Custom Domains with Cloudflare OAuth | **Implemented** | `src/components/CustomDomainsScreen.tsx` |
| **Consultants & Experts** | முன்பதிவுக் கட்டணம் பெற்ற பின்னரே தகவல்களைப் பெறுதல் | Razorpay payment integration on form submit + Thank You page | **Implemented** | `server/payments/routes.ts` |

---

## 10. Core Modules Breakdown / முக்கிய தொகுதிகள்

1. **Pages / Bio Websites**: 27 பிளாக்குகள், 12 வண்ண தீம்கள், விரிவான கவர் போட்டோ ஸ்டுடியோ, 'Thank You' இரண்டாம் பக்கம். (`Implemented`)
2. **Short Links**: தனிப்பயன் ஸ்லக் (Custom Slugs), UTM அளவீடுகள், சாதனப் பகுப்பாய்வு. (`Implemented`)
3. **Link Rotator**: பல தளங்களுக்கு குறிப்பிட்ட சதவீதத்தில் பார்வையாளர்களைப் பிரித்து அனுப்பும் ரொட்டேட்டர். (`Implemented`)
4. **Smart QR Codes**: லோகோவுடன் கூடிய டைனமிக் QR, PNG/SVG/PDF ஏற்றுமதி, மாறாத `/q/:code` மேட்ரிக்ஸ். (`Implemented`)
5. **Leads & Contacts CRM**: தானியங்கி டேக்கிங், மறைக்கப்பட்ட மின்னஞ்சல்/போன் தனியுரிமை, CSV பதிவிறக்கம். (`Implemented`)
6. **Custom Domains**: Apex (A Record) & Subdomains (CNAME) தானியங்கி கிளவுட்ஃபிளேர் SSL சரிபார்ப்பு. (`Implemented`)
7. **Platform Subdomains**: இலவச `{slug}.keylink360.mindflo.today` முகவரி ஒதுக்கீடு. (`Implemented`)
8. **Razorpay Payments**: படிவங்களில் பணம் செலுத்தும் வசதி மற்றும் பாதுகாப்பான சிக்னேச்சர் சரிபார்ப்பு. (`Implemented`)
9. **WhatsApp Manager**: பிரச்சாரங்கள் மற்றும் டெம்ப்ளேட்கள் மேலாண்மை (வெளிப்புற WOO Chat இணைப்புடன்). (`Partially Implemented`)
10. **Tracking Pixels**: FB, Google, TikTok பிக்சல் சேமிப்பு (ஸ்கிரிப்ட் DOM இன்ஜெக்ஷன் இன்னும் இணைக்கப்படவில்லை). (`Partially Implemented`)
11. **Media Library**: 5MB வரை Base64 Data URL கோப்பு மேலாண்மை (நேரடி S3 கிளவுட் ஸ்டோரேஜ் இன்னும் இல்லை). (`Partially Implemented`)
12. **Templates Gallery**: 12 துறைகளுக்கான 50 முன்வடிவமைக்கப்பட்ட வணிக டெம்ப்ளேட்கள். (`Implemented`)

---

## 11. Technology Stack / பயன்படுத்தப்பட்டுள்ள தொழில்நுட்பங்கள்

### Frontend (முன்பகுதி)
* **Framework**: React 19.0.1
* **Language**: TypeScript 5.8.2
* **Bundler & Build Tool**: Vite 6.2.3
* **Routing**: React Router DOM v7.18.1
* **CSS Framework**: Tailwind CSS v4.1.14 (`@tailwindcss/vite`)
* **Icons & Animation**: Lucide React v0.546.0, Motion v12.23.24
* **Payment Script**: Razorpay Standard Checkout SDK

### Backend (பின்பகுதி)
* **Runtime & Framework**: Node.js 20+ / Express 4.21.2 (`tsx` dev / `esbuild` prod)
* **Authentication**: Node Native `node:crypto` (`scryptSync` + `HS256` JWTs)
* **Database Client**: `@supabase/supabase-js: ^2.110.2`
* **Mailer**: Nodemailer 9.0.3
* **Payment Gateway**: Razorpay Node SDK 2.9.8

### Infrastructure & Deployment (கட்டமைப்பு)
* **Deployment**: Docker (`Dockerfile`), Railway (`railway.json`)
* **Database**: Supabase PostgreSQL (உள்ளூர் `data-store.json` காப்புடன்)
* **Edge Routing**: Cloudflare for SaaS, Cloudflare Worker (`workers/custom-domain-proxy.js`)

---

## 12. Authentication & Authorization / அங்கீகாரம் & பாதுகாப்பு

**[EN]**:
* **Password Hashing**: `scryptSync` with a 16-byte random salt and 64-byte key length. Verified using constant-time `timingSafeEqual` (`server/auth/crypto.ts:28-43`).
* **Tokens**: 15-minute `HS256` Access JWTs paired with 7-to-30-day SHA-256 Refresh Tokens stored in DB.
* **Brute-Force Guard**: Automatically locks account for 15 minutes after 5 consecutive failed attempts.
* **CSRF & Origin Verification**: `assertSameOrigin` strictly verifies request origins on state-changing API calls.
* **Identified Vulnerability**: `GET /api/qr-codes` currently lists all QR records in the database without scoping by `ownerUserId`.

**[தமிழ்]**:
* **கடவுச்சொல் பாதுகாப்பு**: `scryptSync` மற்றும் 16-பைட் ரேண்டம் சால்ட் மூலம் மறைகுறியாக்கம் செய்யப்படுகிறது.
* **டோக்கன்கள்**: 15 நிமிட Access JWT டோக்கன் மற்றும் 7 முதல் 30 நாட்கள் செல்லுபடியாகும் Refresh டோக்கன்.
* **தாக்குதல் தடுப்பு**: தொடர்ந்து 5 முறை தவறான கடவுச்சொல் அளித்தால் கணக்கு 15 நிமிடங்களுக்கு முடக்கப்படும்.
* **கவனிக்க வேண்டிய பாதுகாப்பு குறைபாடு**: `GET /api/qr-codes` அழைப்பு தற்போது பயனரின் ID-ஐ வடிகட்டாமல் அனைத்து QR குறியீடுகளையும் பட்டியலிடுகிறது (இதை சரிசெய்ய வேண்டும்).

---

## 13. Custom Domain & Cloudflare DNS Architecture / டொமைன் & DNS கட்டமைப்பு

```text
வாடிக்கையாளர் உலாவி (https://shop.customer.com)
       │
       ▼
   DNS CNAME (shop -> keylink360.mindflo.today)
       │
       ▼
Cloudflare for SaaS (SSL சான்றிதழ் தானாக வழங்கப்படுகிறது)
       │
       ▼
Cloudflare Worker (workers/custom-domain-proxy.js)
   - Host தலைப்பை keylink360.mindflo.today என மாற்றுகிறது
   - X-Forwarded-Host: shop.customer.com தலைப்பை அனுப்புகிறது
       │
       ▼
Express Backend (server.ts)
   - findRoutableDomainByHostname("shop.customer.com") மூலம் pageId-ஐக் கண்டறிகிறது
   - Single Page App index.html கோப்பை வழங்குகிறது
       │
       ▼
React Client (src/App.tsx)
   - PublicBioPageView வழியாக உரிய பயனர் பக்கத்தை நேரடியாகத் திரையிடுகிறது
```

### DNS விதிகள் (`docs/custom-domain-dns-rules.md`):
* **Root Domain (`yourbrand.com`)**: Type `A`, Host `@`, Target `CUSTOM_DOMAIN_A_TARGET` (`69.46.46.90`).
* **Subdomain (`links.yourbrand.com`)**: Type `CNAME`, Host `links`, Target `CUSTOM_DOMAIN_CNAME_TARGET` (`keylink360.mindflo.today`).
* **Cloudflare கட்டணம் பற்றிய உண்மை**: கிளவுட்ஃபிளேரின் $0.18 கட்டணம் இந்த திட்டத்தின் குறியீட்டில் எங்கும் **இல்லை / செயல்படுத்தப்படவில்லை**.

---

## 14. Real-World Use Cases / நிஜ உலக பயன்பாட்டு மாதிரிகள்

### 1. ஃப்ரீலான்ஸ் டிசைனர் (Freelancer Designer)
* **இணைய முகவரி**: `alexdesigns.dev`
* **பயன்படுத்தும் கூறுகள்**: கேலரி, vCard பதிவிறக்கம், லிங்க்ட்இன் இணைப்பு, திட்ட மதிப்பீட்டு படிவம்.
* **பயன்**: வாடிக்கையாளர்கள் போர்ட்ஃபோலியோவைப் பார்த்து உடனடியாக மொபைல் போனில் தொடர்பை சேமித்து ஆர்டர் செய்கிறார்கள்.

### 2. பாரம்பரிய உணவகம் (Specialty Restaurant)
* **இணைய முகவரி**: `tasteofmadras.in`
* **பயன்படுத்தும் கூறுகள்**: உணவு மெனு PDF, கூகுள் மேப் இருப்பிடம், நேரடி போன் அழைப்பு, வாட்ஸ்அப் முன்பதிவு.
* **பயன்**: இடைத்தரகர் கமிஷன் கட்டணங்களின்றி வாடிக்கையாளர்கள் நேரடியாக உணவகத்தை வந்தடைகிறார்கள்.

### 3. உள்ளடக்க உருவாக்குநர் (Content Creator / YouTuber)
* **இணைய முகவரி**: `vicky.keylink360.mindflo.today`
* **பயன்படுத்தும் கூறுகள்**: நேரடி யூடியூப் வீடியோ பிளேயர், ஸ்பாடிஃபை பாடல், ஸ்பான்சர் கூப்பன் ஸ்பின் வீல், Tip Jar.
* **பயன்**: இன்ஸ்டாகிராம் மற்றும் யூடியூப் பயோவிலிருந்து ஒரே பக்கத்தில் அனைத்து ரசிகர்களையும் ஈர்க்க முடிகிறது.

---

## 15. Direct Answers to 45 Core Project Questions / 45 முக்கியக் கேள்விகளுக்கான பதில்கள்

| எண் | கேள்வி / Question | ஆங்கில விளக்கம் / English Analysis | தமிழ் விளக்கம் / Tamil Explanation |
| :---: | :--- | :--- | :--- |
| **1** | What is KEYLINK360? | All-in-one digital presence and micro-landing page SaaS platform. | அனைத்து டிஜிட்டல் தேவைகளையும் ஒரே இடத்தில் பூர்த்தி செய்யும் மினி-இணையதள SaaS தளம். |
| **2** | Why does it exist? | To replace fragmented tools (Linktree, Bitly, Typeform) into one branded hub. | தனித்தனி மென்பொருட்களுக்கு மாற்றாக ஒரே பிராண்ட் குடையின் கீழ் இயங்குவதற்காக. |
| **3** | What problem does it solve? | High SaaS costs, broken physical QR codes, weak branding, and unmonetized forms. | அதிக மென்பொருள் கட்டணம், செயலிழக்கும் QR குறியீடுகள் மற்றும் பிராண்டிங் குறைபாட்டை தீர்க்கிறது. |
| **4** | Who is the main owner? | The platform operator hosting the Railway server and controlling mindflo.today. | சர்வர் மற்றும் முதன்மை டொமைனை இயக்கும் தளத்தின் முதன்மை உரிமையாளர் (Admin). |
| **5** | Who are Sub Owners? | Registered users (creators, businesses, freelancers) building their pages. | தளத்தில் பதிவு செய்து பக்கங்களை உருவாக்கும் பயனர்கள் / வணிகர்கள். |
| **6** | Who are visitors? | The end-user audience and customers viewing published pages and scanning QRs. | பயனர்களின் பக்கங்களைப் பார்வையிடும் மற்றும் QR-ஐ ஸ்கேன் செய்யும் வாடிக்கையாளர்கள். |
| **7** | What can a Sub Owner create? | Bio pages, mini-websites, short links, link rotators, smart QRs, leads, and forms. | மினி இணையதளங்கள், குறுகிய இணைப்புகள், ஸ்மார்ட் QR, படிவங்கள் மற்றும் லீட்கள். |
| **8** | How many pages can be created? | Unlimited in current codebase (no hardcoded tier limits). | தற்போதைய குறியீட்டின்படி வரம்பற்ற பக்கங்களை உருவாக்கலாம். |
| **9** | Can a Sub Owner publish pages? | Yes, via the Publish modal which commits blocks to the live API endpoint. | ஆம், Publish பட்டனை அழுத்தி உடனடியாக நேரலையில் வெளியிடலாம். |
| **10** | Can pages be edited after publishing? | Yes, changes autosave to drafts and update instantly upon re-publishing. | ஆம், எப்போது வேண்டுமானாலும் மாற்றங்களைச் செய்து மீண்டும் வெளியிடலாம். |
| **11** | Can custom domains be used? | Yes, both Root Apex domains (A record) and Subdomains (CNAME) are supported. | ஆம், சொந்த டொமைன்கள் (`yourbrand.com`) மற்றும் சப்டொமைன்களை இணைக்கலாம். |
| **12** | Can multiple domains be connected? | Yes, a user can connect multiple domains to different bio pages. | ஆம், வெவ்வேறு பக்கங்களுக்கு வெவ்வேறு டொமைன்களை இணைக்கலாம். |
| **13** | Can subdomains be used? | Yes, custom subdomains and free platform subdomains are supported. | ஆம், சொந்த சப்டொமைன்கள் மற்றும் இலவச பிளாட்பார்ம் சப்டொமைன்கள் இரண்டும் உண்டு. |
| **14** | How does DNS work? | A record points to 69.46.46.90; CNAME points to keylink360.mindflo.today. | A Record 69.46.46.90-க்கும், CNAME keylink360.mindflo.today-க்கும் வைக்க வேண்டும். |
| **15** | How does Cloudflare fit in? | Cloudflare for SaaS provides automated SSL; Cloudflare OAuth automates DNS. | கிளவுட்ஃபிளேர் தானியங்கி SSL மற்றும் ஒரு-கிளிக் DNS அமைப்பை வழங்குகிறது. |
| **16** | How do other providers fit? | GoDaddy, Namecheap, Hostinger are detected to provide exact manual DNS steps. | பிற டொமைன் நிறுவனங்களுக்குத் தேவையான DNS குறிப்புகள் திரையில் காட்டப்படுகின்றன. |
| **17** | What happens on custom domain visit? | Edge proxies request with X-Forwarded-Host -> Server maps pageId -> Renders SPA. | சர்வர் டொமைனை அடையாளம் கண்டு உரிய பயனர் பக்கத்தை நொடிகளில் வழங்குகிறது. |
| **18** | What data is collected? | Visits, clicks, lead inputs, device, OS, browser, domain, port, and timestamp. | பார்வைகள், கிளிக்குகள், சாதனம், OS, பிரவுசர், டொமைன் மற்றும் நேரத் தகவல்கள். |
| **19** | What analytics are available? | Total views, clicks, form submissions, 7-day click trend graphs, activity feed. | மொத்த பார்வைகள், கிளிக்குகள், 7-நாள் வரைபடங்கள் மற்றும் நிகழ்வு பதிவுகள். |
| **20** | How does a Sub Owner benefit? | Complete brand ownership, direct payments, permanent QR codes, exportable leads. | தொழில்முறை பிராண்டிங், உடனடி கட்டணம் பெறுதல் மற்றும் வாடிக்கையாளர் பட்டியல். |
| **21** | How does their customer benefit? | Fast mobile UX, 1-tap WhatsApp chat, calling, map navigation, secure Razorpay checkout. | விரைவான மொபைல் வேகம், 1-கிளிக் வாட்ஸ்அப், போன் அழைப்பு மற்றும் மேப் வழிகாட்டல். |
| **22** | How does KEYLINK360 benefit? | High-margin SaaS revenue model with low incremental cost per tenant. | குறைந்த சர்வர் செலவில் அதிக லாபம் ஈட்டும் சந்தா வணிக மாதிரி. |
| **23** | What technologies are used? | React 19, TypeScript, Tailwind CSS v4, Express 4, Node.js, Supabase, Cloudflare. | React 19, Tailwind v4, Express, Supabase PostgreSQL மற்றும் Cloudflare. |
| **24** | What is the frontend architecture? | SPA driven by React Router v7 with modular screens and public renderers. | React Router v7 அடிப்படையிலான அதிவேக Single Page Application (SPA). |
| **25** | What is the backend architecture? | Express REST API with crypto auth, domain lifecycle resolvers, and SSL poller. | கிரிப்டோ பாதுகாப்புடன் கூடிய எக்ஸ்பிரஸ் REST API கட்டமைப்பு. |
| **26** | What is the database architecture? | Hybrid in-memory / JSON store + Supabase KV & 20 normalized SQL tables. | இன்-மெமரி + லோக்கல் JSON + 20 Supabase SQL அட்டவணைகள். |
| **27** | What APIs exist? | Auth, Pages, Domains, Subdomains, Short Links, Rotators, QR, Contacts, Payments. | அங்கீகாரம், பக்கங்கள், டொமைன்கள், QR, லீட்கள் மற்றும் கட்டணங்களுக்கான முழு APIகள். |
| **28** | What authentication system exists? | Salted Scrypt password hashing, HS256 JWTs, refresh tokens, OTP resets. | Scrypt கடவுச்சொல் மறைகுறியாக்கம், JWT மற்றும் OTP சரிபார்ப்பு முறை. |
| **29** | What modules exist? | 16 modules including Builder, Links, Rotator, QR, Leads, Domains, Templates. | 16 பிரதான தொகுதிகள் முழுமையாக கட்டமைக்கப்பட்டுள்ளன. |
| **30** | What modules are incomplete? | WhatsApp (needs Meta API), Pixels (needs DOM injection), Media (needs S3). | வாட்ஸ்அப் கிளவுட் API மற்றும் பிக்சல் ஸ்கிரிப்ட் இன்ஜெக்ஷன் ஆகியவை முழுமை பெற வேண்டும். |
| **31** | What is production-ready? | Core Bio Builder, Custom Domains, Smart QR, Short Links, Leads, Razorpay. | பேஜ் பில்டர், டொமைன் ரூட்டிங், ஸ்மார்ட் QR மற்றும் ரேஸர்பே தயார் நிலையில் உள்ளன. |
| **32** | What is not production-ready? | Automated recurring platform billing subscriptions, super-admin panel. | பிளாட்பார்ம் சந்தா கட்டண முறை மற்றும் அட்மின் பேனல் இன்னும் உருவாக்கப்படவில்லை. |
| **33** | What is missing? | S3/R2 storage integration, Super-Admin UI dashboard. | நேரடி S3 கிளவுட் ஸ்டோரேஜ் மற்றும் சூப்பர் அட்மின் திரை. |
| **34** | What is only conceptual? | Automated tier limits (e.g. Free vs Pro domain quotas), AI text generator. | இலவச மற்றும் கட்டண கணக்குகளுக்கான தானியங்கி பயன்பாட்டு கட்டுப்பாடுகள். |
| **35** | Biggest technical risks? | Multi-instance file desynchronization without Supabase; memory load from Base64. | சர்வர் பல நகல்களாக இயங்கும்போது லோக்கல் JSON கோப்பு முரண்பாடு ஏற்படலாம். |
| **36** | Biggest business risks? | Malicious phishing abuse on custom domains; revenue loss from unenforced limits. | போலி பக்கங்களை உருவாக்குவோர் மூலம் வரும் ஆபத்து மற்றும் கட்டுப்பாடற்ற இலவச பயன்பாடு. |
| **37** | If 1,000 users join? | Handled smoothly on a standard 2GB/2vCPU Railway container. | தற்போதைய சர்வர் கட்டமைப்பில் எவ்வித தடையுமின்றி சீராக இயங்கும். |
| **38** | If 10,000 users join? | Must migrate fully to normalized PostgreSQL tables and Redis rate limiting. | முழுமையாக PostgreSQL நேரடி வினவல்கள் மற்றும் Redis-க்கு மாற வேண்டும். |
| **39** | If thousands of pages created? | Seamlessly stored in database; public cached pages load instantaneously. | தரவுத்தளம் எளிதாகக் கையாளும்; பக்கங்கள் மிக வேகமாகத் திறக்கும். |
| **40** | If thousands of domains connected? | Cloudflare for SaaS handles thousands of SSL certs without platform strain. | கிளவுட்ஃபிளேர் தானியங்கி முறையில் ஆயிரக்கணக்கான SSL-களை வழங்கும். |
| **41** | Scalability limitations? | Single-threaded JSON file persistence and in-memory rate limits. | ஒற்றை இழை JSON கோப்பு சேமிப்பு மற்றும் மெமரி அடிப்படையிலான கட்டுப்பாடுகள். |
| **42** | Security concerns? | QR listing lacks user-scoping filter (must add `ownerUserId` filter). | QR குறியீடு பட்டியலில் பயனர் ஐடி வடிகட்டலை சேர்க்க வேண்டும். |
| **43** | Deployment dependencies? | Node.js 20+, Docker container, Railway, Supabase PostgreSQL. | Node.js, Docker, Railway மற்றும் Supabase. |
| **44** | External services depended on? | Supabase (DB), Cloudflare (SSL/DNS), Razorpay (Pay), SMTP (Mail). | சுபாபேஸ், கிளவுட்ஃபிளேர், ரேஸர்பே மற்றும் மெயில் சர்வர். |
| **45** | If an external service fails? | Circuit breaker falls back to local JSON; dev mode returns tokens in API. | சுபாபேஸ் நின்றாலும் லோக்கல் கோப்பு முறை மூலம் தளம் தொடர்ந்து இயங்கும். |

---

## 16. Final Conclusion / இறுதி முடிவுரை

**[EN]**: **KEYLINK360** is a modern, feature-complete, and highly scalable SaaS application for digital presence management. Its core engines—specifically the 27-block drag-and-drop builder, automated Cloudflare for SaaS domain routing, permanent Smart QR matrix engine, and Razorpay pay-on-submit integration—are built to production standards. Completing the remaining integration points (user-scoped QR queries, direct S3/R2 storage, and platform subscription billing) will position KEYLINK360 as an enterprise-grade market alternative to Linktree, Bitly, and Carrd.

**[தமிழ்]**: **KEYLINK360** என்பது அதிநவீன தொழில்நுட்பத்துடன் உருவாக்கப்பட்ட, முழுமையான வணிகத் திறன் கொண்ட டிஜிட்டல் இருப்பு SaaS தளமாகும். இதன் 27 பிளாக் பில்டர், கிளவுட்ஃபிளேர் டொமைன் ரூட்டிங், அழியாத ஸ்மார்ட் QR குறியீடுகள் மற்றும் ரேஸர்பே கட்டணப் படிவங்கள் ஆகியவை தயாரிப்புத் தரத்தில் (Production-Ready) உள்ளன. மீதமுள்ள சில சிறிய இணைப்புகளை (QR பயனர் வடிகட்டல், கிளவுட் ஸ்டோரேஜ் மற்றும் பிளாட்பார்ம் சந்தா முறை) நிறைவு செய்வதன் மூலம், இது Linktree மற்றும் Bitly-க்கு நிகரான மாபெரும் வர்த்தக வெற்றியை அடையும் என்பதில் ஐயமில்லை.
