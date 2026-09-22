export type DeviceCategory = "android" | "apple" | "tablets" | "specials";

export type DeviceFrameType =
  | "iphone-island"
  | "iphone-titanium"
  | "iphone-notch"
  | "iphone-classic"
  | "fold-hinge"
  | "samsung-s24-ultra"
  | "android-punchhole"
  | "android-notch"
  | "android-pill"
  | "tablet-ipad"
  | "tablet-android"
  | "tablet-classic"
  | "laptop-macbook"
  | "laptop-macbook-rose"
  | "laptop-dell"
  | "laptop-asus-rog"
  | "laptop-asus-tuf"
  | "laptop-msi"
  | "desktop-imac"
  | "desktop-curved-rog"
  | "tv-xiaomi";

export type FrameMaterialFinish =
  | "titanium"
  | "copper-titanium"
  | "cosmic-violet"
  | "oceanic-blue"
  | "emerald-green"
  | "rose-gold"
  | "crimson-gloss"
  | "phantom-black"
  | "ceramic-white"
  | "cyber-neon"
  | "steel"
  | "aluminum"
  | "cyber-armor"
  | "tuf-gunmetal"
  | "msi-stealth";

export interface FrameFinish4K {
  id: string;
  name: string;
  type: "metal" | "plastic" | "ceramic";
  swatch: string;
  badge: string;
  description: string;
}

export const FRAME_FINISHES_4K: FrameFinish4K[] = [
  { id: "titanium", name: "Natural Titanium", type: "metal", swatch: "#94a3b8", badge: "4K Metal", description: "Grade 5 brushed titanium with satin specular highlights" },
  { id: "copper-titanium", name: "Desert Copper", type: "metal", swatch: "#c29b7f", badge: "4K Metal", description: "Lustrous warm copper-gold titanium alloy" },
  { id: "cosmic-violet", name: "Cosmic Deep Violet", type: "metal", swatch: "#8b5cf6", badge: "4K Metal", description: "Anodized aerospace violet with prism reflections" },
  { id: "oceanic-blue", name: "Oceanic Cobalt Blue", type: "metal", swatch: "#2563eb", badge: "4K Metal", description: "Deep liquid cobalt with icy metallic rim lines" },
  { id: "emerald-green", name: "Cyber Emerald Green", type: "metal", swatch: "#10b981", badge: "4K Metal", description: "Vibrant high-tech emerald titanium with neon highlights" },
  { id: "rose-gold", name: "Sakura Rose Gold", type: "metal", swatch: "#f472b6", badge: "4K Metal", description: "Champagne rose gold anodized unibody finish" },
  { id: "crimson-gloss", name: "Racing Crimson Red", type: "plastic", swatch: "#ef4444", badge: "4K Gloss", description: "High-gloss mirror-finish racing red engineering polymer" },
  { id: "phantom-black", name: "Phantom Obsidian", type: "metal", swatch: "#1e293b", badge: "4K Metal", description: "Deep midnight obsidian with micro-matte anti-glare bevel" },
  { id: "ceramic-white", name: "Glacier Ceramic White", type: "ceramic", swatch: "#f8fafc", badge: "4K Ceramic", description: "Ultra-pure nano-ceramic white with pearlescent gloss" },
  { id: "cyber-neon", name: "Mecha Cyber Neon", type: "plastic", swatch: "#eab308", badge: "4K Tactical", description: "Industrial gunmetal armor with high-vis cyber yellow trim" }
];

export interface DeviceSpec {
  id: string;
  name: string;
  category: DeviceCategory;
  frameType: DeviceFrameType;
  width: number;
  height: number;
  dpr: number;
  os: "iOS" | "Android" | "macOS" | "Windows";
  isNew?: boolean;
  isPro?: boolean;
  viewportScope: "mobile_only" | "mobile_tablet" | "mobile_tablet_laptop" | "all_devices";
  materialFinish?: FrameMaterialFinish;
}

export const DEVICE_CATALOG: DeviceSpec[] = [
  // ==================== 1. ANDROID PHONES (Unique Resolutions Only) ====================
  // Samsung S24 Ultra: Iconic 90-degree squared corners and Titanium frame (Screenshot 1 & 5)
  {
    id: "galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    category: "android",
    frameType: "samsung-s24-ultra",
    width: 384,
    height: 832,
    dpr: 3.5,
    os: "Android",
    isPro: true,
    isNew: true,
    materialFinish: "titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "pixel-10-fold",
    name: "Pixel 10 Fold folded",
    category: "android",
    frameType: "fold-hinge",
    width: 412,
    height: 901,
    dpr: 2.75,
    os: "Android",
    isPro: true,
    isNew: true,
    materialFinish: "steel",
    viewportScope: "mobile_only"
  },
  {
    id: "motorola-razr-70",
    name: "Motorola Razr 70 Ultra",
    category: "android",
    frameType: "android-punchhole",
    width: 412,
    height: 1080,
    dpr: 2.62,
    os: "Android",
    isNew: true,
    isPro: true,
    materialFinish: "crimson-gloss",
    viewportScope: "mobile_only"
  },
  {
    id: "oppo-find-x3-pro",
    name: "OPPO Find X3 PRO",
    category: "android",
    frameType: "android-punchhole",
    width: 412,
    height: 924,
    dpr: 3.5,
    os: "Android",
    materialFinish: "titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-s26-ultra",
    name: "Galaxy S26 ULTRA",
    category: "android",
    frameType: "samsung-s24-ultra",
    width: 412,
    height: 920,
    dpr: 3.5,
    os: "Android",
    isPro: true,
    materialFinish: "cosmic-violet",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-z-flip-3",
    name: "Galaxy Z Flip3",
    category: "android",
    frameType: "android-punchhole",
    width: 412,
    height: 919,
    dpr: 2.62,
    os: "Android",
    materialFinish: "steel",
    viewportScope: "mobile_only"
  },
  {
    id: "pixel-10",
    name: "Google Pixel 10",
    category: "android",
    frameType: "android-punchhole",
    width: 412,
    height: 915,
    dpr: 3,
    os: "Android",
    isNew: true,
    materialFinish: "emerald-green",
    viewportScope: "mobile_only"
  },
  {
    id: "pixel-6-pro",
    name: "Google Pixel 6 PRO",
    category: "android",
    frameType: "android-punchhole",
    width: 412,
    height: 892,
    dpr: 3.5,
    os: "Android",
    isPro: true,
    materialFinish: "titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-note-20-ultra",
    name: "Galaxy Note20 Ultra",
    category: "android",
    frameType: "android-punchhole",
    width: 412,
    height: 883,
    dpr: 3.5,
    os: "Android",
    materialFinish: "copper-titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "xiaomi-12",
    name: "Xiaomi 12",
    category: "android",
    frameType: "android-punchhole",
    width: 393,
    height: 873,
    dpr: 3,
    os: "Android",
    materialFinish: "ceramic-white",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-s24",
    name: "Samsung Galaxy S24",
    category: "android",
    frameType: "android-punchhole",
    width: 393,
    height: 860,
    dpr: 3,
    os: "Android",
    isNew: true,
    materialFinish: "oceanic-blue",
    viewportScope: "mobile_only"
  },
  {
    id: "pixel-5",
    name: "Google Pixel 5",
    category: "android",
    frameType: "android-punchhole",
    width: 393,
    height: 851,
    dpr: 2.75,
    os: "Android",
    materialFinish: "aluminum",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-s21-ultra",
    name: "Galaxy S21 Ultra",
    category: "android",
    frameType: "android-punchhole",
    width: 384,
    height: 854,
    dpr: 3.75,
    os: "Android",
    isPro: true,
    materialFinish: "phantom-black",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-s22-ultra",
    name: "Galaxy S22 ULTRA",
    category: "android",
    frameType: "samsung-s24-ultra",
    width: 384,
    height: 824,
    dpr: 3.75,
    os: "Android",
    isPro: true,
    materialFinish: "cyber-neon",
    viewportScope: "mobile_only"
  },
  {
    id: "samsung-s20",
    name: "Samsung Galaxy S20",
    category: "android",
    frameType: "android-punchhole",
    width: 360,
    height: 800,
    dpr: 3,
    os: "Android",
    materialFinish: "rose-gold",
    viewportScope: "mobile_only"
  },
  {
    id: "galaxy-s22",
    name: "Galaxy S22",
    category: "android",
    frameType: "android-punchhole",
    width: 360,
    height: 780,
    dpr: 3,
    os: "Android",
    materialFinish: "aluminum",
    viewportScope: "mobile_only"
  },

  // ==================== 2. APPLE PHONES (Unique Resolutions Only) ====================
  // iPhone Duo folded: Chrome hinge spine & asymmetric curve (Screenshot 1 & 4)
  {
    id: "iphone-duo-folded",
    name: "Apple iPhone Duo folded",
    category: "apple",
    frameType: "fold-hinge",
    width: 466,
    height: 678,
    dpr: 3,
    os: "iOS",
    isPro: true,
    isNew: true,
    materialFinish: "steel",
    viewportScope: "mobile_only"
  },
  // iPhone 18 PRO: Metallic Copper Titanium luster (Screenshot 1 & 3)
  {
    id: "iphone-18-pro",
    name: "Apple iPhone 18 PRO",
    category: "apple",
    frameType: "iphone-titanium",
    width: 402,
    height: 873,
    dpr: 3,
    os: "iOS",
    isPro: true,
    isNew: true,
    materialFinish: "copper-titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-18-pro-max",
    name: "iPhone 18 PRO MAX",
    category: "apple",
    frameType: "iphone-titanium",
    width: 444,
    height: 964,
    dpr: 3,
    os: "iOS",
    isPro: true,
    isNew: true,
    materialFinish: "titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 PRO MAX",
    category: "apple",
    frameType: "iphone-titanium",
    width: 440,
    height: 956,
    dpr: 3,
    os: "iOS",
    isPro: true,
    materialFinish: "titanium",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-16-pro",
    name: "iPhone 16 PRO",
    category: "apple",
    frameType: "iphone-titanium",
    width: 393,
    height: 852,
    dpr: 3,
    os: "iOS",
    isPro: true,
    materialFinish: "rose-gold",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-16-plus",
    name: "iPhone 16 Plus",
    category: "apple",
    frameType: "iphone-island",
    width: 430,
    height: 932,
    dpr: 3,
    os: "iOS",
    materialFinish: "oceanic-blue",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-14",
    name: "iPhone 14 (iOS 16)",
    category: "apple",
    frameType: "iphone-notch",
    width: 390,
    height: 844,
    dpr: 3,
    os: "iOS",
    materialFinish: "crimson-gloss",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-13-pro-max",
    name: "iPhone 13 PRO MAX",
    category: "apple",
    frameType: "iphone-notch",
    width: 428,
    height: 926,
    dpr: 3,
    os: "iOS",
    isPro: true,
    materialFinish: "phantom-black",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-11-pro-max",
    name: "iPhone 11 PRO MAX",
    category: "apple",
    frameType: "iphone-notch",
    width: 414,
    height: 896,
    dpr: 3,
    os: "iOS",
    isPro: true,
    materialFinish: "cosmic-violet",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-x",
    name: "iPhone X",
    category: "apple",
    frameType: "iphone-notch",
    width: 375,
    height: 812,
    dpr: 3,
    os: "iOS",
    materialFinish: "ceramic-white",
    viewportScope: "mobile_only"
  },
  {
    id: "iphone-se-2016",
    name: "iPhone SE 2016",
    category: "apple",
    frameType: "iphone-classic",
    width: 320,
    height: 568,
    dpr: 2,
    os: "iOS",
    materialFinish: "aluminum",
    viewportScope: "mobile_only"
  },

  // ==================== 3. TABLETS ====================
  // Modern Edge-to-Edge Tablets
  {
    id: "ipad-pro-11",
    name: "Apple iPad PRO 11\" (3rd Gen)",
    category: "tablets",
    frameType: "tablet-ipad",
    width: 834,
    height: 1194,
    dpr: 2,
    os: "iOS",
    isPro: true,
    materialFinish: "aluminum",
    viewportScope: "mobile_tablet"
  },
  {
    id: "ipad-air-4",
    name: "iPad Air 4",
    category: "tablets",
    frameType: "tablet-ipad",
    width: 820,
    height: 1180,
    dpr: 2,
    os: "iOS",
    materialFinish: "rose-gold",
    viewportScope: "mobile_tablet"
  },
  {
    id: "ipad-mini",
    name: "iPad Mini",
    category: "tablets",
    frameType: "tablet-ipad",
    width: 744,
    height: 1133,
    dpr: 2,
    os: "iOS",
    materialFinish: "oceanic-blue",
    viewportScope: "mobile_tablet"
  },
  {
    id: "galaxy-tab-s7",
    name: "Galaxy Tab S7",
    category: "tablets",
    frameType: "tablet-android",
    width: 800,
    height: 1280,
    dpr: 2,
    os: "Android",
    materialFinish: "cosmic-violet",
    viewportScope: "mobile_tablet"
  },
  {
    id: "surface-duo",
    name: "Microsoft Surface Duo",
    category: "tablets",
    frameType: "tablet-android",
    width: 720,
    height: 1114,
    dpr: 2.5,
    os: "Windows",
    materialFinish: "steel",
    viewportScope: "mobile_tablet"
  },
  // Classic Tablets with Prominent Top & Bottom Bezels (Requested)
  {
    id: "ipad-classic-9",
    name: "Apple iPad (Classic Bezel)",
    category: "tablets",
    frameType: "tablet-classic",
    width: 810,
    height: 1080,
    dpr: 2,
    os: "iOS",
    materialFinish: "aluminum",
    viewportScope: "mobile_tablet"
  },
  {
    id: "galaxy-tab-classic",
    name: "Galaxy Tab A (Classic Bezel)",
    category: "tablets",
    frameType: "tablet-classic",
    width: 800,
    height: 1200,
    dpr: 1.5,
    os: "Android",
    materialFinish: "titanium",
    viewportScope: "mobile_tablet"
  },

  // ==================== 4. SPECIALS, COMPUTERS & MONITORS ====================
  // Macbook Neo 2026: Rose gold unibody with thumb notch (Screenshot 2)
  {
    id: "macbook-neo-2026",
    name: "Macbook Neo 2026",
    category: "specials",
    frameType: "laptop-macbook-rose",
    width: 1204,
    height: 753,
    dpr: 2,
    os: "macOS",
    isPro: true,
    isNew: true,
    materialFinish: "rose-gold",
    viewportScope: "all_devices"
  },
  // ASUS ROG Zephyrus G16 Gaming Laptop
  {
    id: "asus-rog-g16",
    name: "ASUS ROG Zephyrus G16",
    category: "specials",
    frameType: "laptop-asus-rog",
    width: 1280,
    height: 800,
    dpr: 2,
    os: "Windows",
    isPro: true,
    isNew: true,
    materialFinish: "cyber-armor",
    viewportScope: "all_devices"
  },
  // ASUS TUF Gaming A15 Gaming Laptop
  {
    id: "asus-tuf-a15",
    name: "ASUS TUF Gaming A15",
    category: "specials",
    frameType: "laptop-asus-tuf",
    width: 1280,
    height: 720,
    dpr: 1.5,
    os: "Windows",
    isNew: true,
    materialFinish: "tuf-gunmetal",
    viewportScope: "all_devices"
  },
  // MSI Raider GE78 HX Gaming Laptop
  {
    id: "msi-raider-ge78",
    name: "MSI Raider GE78 Gaming",
    category: "specials",
    frameType: "laptop-msi",
    width: 1280,
    height: 800,
    dpr: 2,
    os: "Windows",
    isPro: true,
    isNew: true,
    materialFinish: "msi-stealth",
    viewportScope: "all_devices"
  },
  {
    id: "macbook-air",
    name: "MacBook Air",
    category: "specials",
    frameType: "laptop-macbook",
    width: 1280,
    height: 832,
    dpr: 2,
    os: "macOS",
    isNew: true,
    materialFinish: "aluminum",
    viewportScope: "mobile_tablet_laptop"
  },
  {
    id: "macbook-pro-16",
    name: "MacBook PRO 16 2021",
    category: "specials",
    frameType: "laptop-macbook",
    width: 1728,
    height: 1117,
    dpr: 2,
    os: "macOS",
    isPro: true,
    materialFinish: "aluminum",
    viewportScope: "all_devices"
  },
  {
    id: "imac-24",
    name: "Apple iMac 24\"",
    category: "specials",
    frameType: "desktop-imac",
    width: 1920,
    height: 1080,
    dpr: 2,
    os: "macOS",
    isPro: true,
    materialFinish: "aluminum",
    viewportScope: "all_devices"
  },
  // ASUS ROG Swift Curved 34" Gaming Monitor (Requested)
  {
    id: "asus-rog-curved-monitor",
    name: "ASUS ROG Curved Monitor 34\"",
    category: "specials",
    frameType: "desktop-curved-rog",
    width: 1440,
    height: 900,
    dpr: 1.5,
    os: "Windows",
    isPro: true,
    isNew: true,
    materialFinish: "cyber-armor",
    viewportScope: "all_devices"
  },
  // Xiaomi Mi TV 4K 55" (Requested)
  {
    id: "xiaomi-mi-tv-55",
    name: "Xiaomi Mi TV 4K 55\"",
    category: "specials",
    frameType: "tv-xiaomi",
    width: 1920,
    height: 1080,
    dpr: 1.5,
    os: "Android",
    isPro: true,
    isNew: true,
    materialFinish: "phantom-black",
    viewportScope: "all_devices"
  }
];

export const DEFAULT_DEVICE = DEVICE_CATALOG.find((d) => d.id === "iphone-18-pro") || DEVICE_CATALOG[0];
