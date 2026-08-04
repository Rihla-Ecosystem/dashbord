import type {
  ActivityEvent,
  Boundary,
  GeoAnalytics,
  GeoLocation,
  LocationCategory,
  LocationInput,
  NearbyService,
  NearbyServiceType,
  RestrictedZone,
} from "@/types/geocontext";

let idCounter = 0;
function uid(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function daysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86400_000 - hours * 3600_000).toISOString();
}

function imageUrl(seed: string, w = 640, h = 420): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

type SeedLocation = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: LocationCategory;
  governorate: string;
  city: string;
  lat: number;
  lng: number;
  description?: string;
  history?: string;
  unescoStatus?: string;
  bestTimeToVisit?: string;
  estimatedDurationMinutes?: number;
  ticket?: { foreignPrice?: number; egyptianPrice?: number; free?: boolean; note?: string };
  safetyScore?: number;
  riskLevel?: "extreme" | "high" | "medium" | "low";
  status?: GeoLocation["status"];
  tags?: string[];
};

const SEED: SeedLocation[] = [
  { id: "loc-giza-pyramids", nameAr: "أهرامات الجيزة", nameEn: "Pyramids of Giza", category: "historical", governorate: "Giza", city: "Giza", lat: 29.9792, lng: 31.1342, history: "Built during the Fourth Dynasty of the Old Kingdom, the Giza pyramid complex is the last surviving wonder of the ancient world.", unescoStatus: "UNESCO World Heritage Site", bestTimeToVisit: "Early morning or late afternoon", estimatedDurationMinutes: 180, ticket: { foreignPrice: 600, egyptianPrice: 80 }, safetyScore: 92, riskLevel: "low", tags: ["iconic", "ancient", "must-see"] },
  { id: "loc-sphinx", nameAr: "أبو الهول", nameEn: "Great Sphinx of Giza", category: "historical", governorate: "Giza", city: "Giza", lat: 29.9753, lng: 31.1376, history: "A limestone statue of a reclining sphinx, believed to date to the reign of Pharaoh Khafre.", unescoStatus: "UNESCO World Heritage Site", estimatedDurationMinutes: 60, safetyScore: 90, riskLevel: "low", tags: ["ancient", "iconic"] },
  { id: "loc-egyptian-museum", nameAr: "المتحف المصري", nameEn: "Egyptian Museum", category: "museum", governorate: "Cairo", city: "Cairo", lat: 30.0478, lng: 31.2336, history: "Houses an extensive collection of ancient Egyptian antiquities, including the treasures of Tutankhamun.", bestTimeToVisit: "Weekday mornings", estimatedDurationMinutes: 240, ticket: { foreignPrice: 300, egyptianPrice: 50 }, safetyScore: 88, riskLevel: "low", tags: ["museum", "tutankhamun"] },
  { id: "loc-khan-khalili", nameAr: "خان الخليلي", nameEn: "Khan el-Khalili", category: "shopping", governorate: "Cairo", city: "Cairo", lat: 30.0477, lng: 31.2622, description: "Historic bazaar and souk, famous for traditional crafts, jewelry, and coffee shops.", bestTimeToVisit: "Evening", estimatedDurationMinutes: 120, safetyScore: 72, riskLevel: "medium", tags: ["souk", "shopping", "bazaar"] },
  { id: "loc-citadel", nameAr: "قلعة صلاح الدين", nameEn: "Citadel of Saladin", category: "historical", governorate: "Cairo", city: "Cairo", lat: 30.0288, lng: 31.2615, history: "Medieval Islamic fortification begun by Saladin in 1176.", estimatedDurationMinutes: 150, ticket: { foreignPrice: 200, egyptianPrice: 40 }, safetyScore: 85, riskLevel: "low", tags: ["islamic", "fortress"] },
  { id: "loc-karnak", nameAr: "معبد الكرنك", nameEn: "Karnak Temple", category: "historical", governorate: "Luxor", city: "Luxor", lat: 25.7188, lng: 32.6574, history: "A vast temple complex honouring Amun-Ra, built over 2,000 years.", unescoStatus: "UNESCO World Heritage Site", bestTimeToVisit: "Early morning", estimatedDurationMinutes: 180, ticket: { foreignPrice: 400, egyptianPrice: 60 }, safetyScore: 90, riskLevel: "low", tags: ["temple", "ancient"] },
  { id: "loc-valley-kings", nameAr: "وادي الملوك", nameEn: "Valley of the Kings", category: "historical", governorate: "Luxor", city: "Luxor", lat: 25.7402, lng: 32.6014, history: "Burial ground for pharaohs including Tutankhamun and Ramesses II.", unescoStatus: "UNESCO World Heritage Site", bestTimeToVisit: "Early morning", estimatedDurationMinutes: 150, ticket: { foreignPrice: 500, egyptianPrice: 80 }, safetyScore: 89, riskLevel: "low", tags: ["tombs", "ancient"] },
  { id: "loc-hatshepsut", nameAr: "معبد حتشبسوت", nameEn: "Hatshepsut Temple", category: "historical", governorate: "Luxor", city: "Luxor", lat: 25.7386, lng: 32.6067, unescoStatus: "UNESCO World Heritage Site", estimatedDurationMinutes: 90, safetyScore: 88, riskLevel: "low", tags: ["temple", "queen"] },
  { id: "loc-luxor-temple", nameAr: "معبد الأقصر", nameEn: "Luxor Temple", category: "historical", governorate: "Luxor", city: "Luxor", lat: 25.6994, lng: 32.6391, unescoStatus: "UNESCO World Heritage Site", bestTimeToVisit: "Night (illuminated)", estimatedDurationMinutes: 120, safetyScore: 87, riskLevel: "low", tags: ["temple", "night"] },
  { id: "loc-abu-simbel", nameAr: "أبو سمبل", nameEn: "Abu Simbel Temples", category: "historical", governorate: "Aswan", city: "Abu Simbel", lat: 22.3372, lng: 31.6258, history: "Two rock temples built by Ramesses II, relocated in 1968 to save them from flooding.", unescoStatus: "UNESCO World Heritage Site", bestTimeToVisit: "Very early (sunrise)", estimatedDurationMinutes: 120, ticket: { foreignPrice: 600, egyptianPrice: 100 }, safetyScore: 90, riskLevel: "low", tags: ["ramses", "relocated"] },
  { id: "loc-philae", nameAr: "معبد فيلة", nameEn: "Philae Temple", category: "historical", governorate: "Aswan", city: "Aswan", lat: 24.0256, lng: 32.8844, unescoStatus: "UNESCO World Heritage Site", estimatedDurationMinutes: 90, safetyScore: 89, riskLevel: "low", tags: ["temple", "island"] },
  { id: "loc-high-dam", nameAr: "السد العالي", nameEn: "Aswan High Dam", category: "attraction", governorate: "Aswan", city: "Aswan", lat: 23.9714, lng: 32.8776, estimatedDurationMinutes: 60, safetyScore: 84, riskLevel: "low", tags: ["modern", "engineering"] },
  { id: "loc-biblio", nameAr: "مكتبة الإسكندرية", nameEn: "Bibliotheca Alexandrina", category: "attraction", governorate: "Alexandria", city: "Alexandria", lat: 31.2089, lng: 29.9093, bestTimeToVisit: "Morning", estimatedDurationMinutes: 120, ticket: { foreignPrice: 70, egyptianPrice: 20 }, safetyScore: 91, riskLevel: "low", tags: ["library", "modern"] },
  { id: "loc-qaitbay", nameAr: "قلعة قايتباي", nameEn: "Qaitbay Citadel", category: "historical", governorate: "Alexandria", city: "Alexandria", lat: 31.2138, lng: 29.8856, estimatedDurationMinutes: 90, safetyScore: 86, riskLevel: "low", tags: ["fortress", "sea"] },
  { id: "loc-montaza", nameAr: "قصر المنتزه", nameEn: "Montaza Palace", category: "attraction", governorate: "Alexandria", city: "Alexandria", lat: 31.2854, lng: 30.016, estimatedDurationMinutes: 90, safetyScore: 88, riskLevel: "low", tags: ["palace", "garden"] },
  { id: "loc-hurghada-marina", nameAr: "مارينا الغردقة", nameEn: "Hurghada Marina", category: "attraction", governorate: "Red Sea", city: "Hurghada", lat: 27.2278, lng: 33.8427, bestTimeToVisit: "Sunset", estimatedDurationMinutes: 60, safetyScore: 82, riskLevel: "low", tags: ["marina", "sea"] },
  { id: "loc-ras-mohammed", nameAr: "رأس محمد", nameEn: "Ras Mohammed National Park", category: "park", governorate: "South Sinai", city: "Sharm El-Sheikh", lat: 27.7318, lng: 34.2546, unescoStatus: "Protected National Park", estimatedDurationMinutes: 300, ticket: { foreignPrice: 200, egyptianPrice: 100 }, safetyScore: 80, riskLevel: "low", tags: ["national-park", "diving"] },
  { id: "loc-st-catherine", nameAr: "دير سانت كاترين", nameEn: "St. Catherine's Monastery", category: "historical", governorate: "South Sinai", city: "St. Catherine", lat: 28.5559, lng: 33.9754, history: "Eastern Orthodox monastery at the foot of Mount Sinai, dating to the 6th century.", unescoStatus: "UNESCO World Heritage Site", estimatedDurationMinutes: 180, safetyScore: 85, riskLevel: "low", tags: ["monastery", "mount-sinai"] },
  { id: "loc-blue-hole", nameAr: "الحفرة الزرقاء", nameEn: "Blue Hole", category: "beach", governorate: "South Sinai", city: "Dahab", lat: 28.5722, lng: 34.5378, description: "World-famous diving site and submarine sinkhole.", estimatedDurationMinutes: 300, safetyScore: 58, riskLevel: "high", tags: ["diving", "sinkhole"] },
  { id: "loc-white-desert", nameAr: "الصحراء البيضاء", nameEn: "White Desert", category: "park", governorate: "New Valley", city: "Farafra", lat: 27.3616, lng: 28.1912, estimatedDurationMinutes: 600, safetyScore: 66, riskLevel: "medium", tags: ["desert", "camping"] },
  { id: "loc-siwa", nameAr: "واحة سيوة", nameEn: "Siwa Oasis", category: "attraction", governorate: "Matrouh", city: "Siwa", lat: 29.2032, lng: 25.5195, estimatedDurationMinutes: 360, safetyScore: 70, riskLevel: "medium", tags: ["oasis", "berber"] },
  { id: "loc-muhammad-ali", nameAr: "مسجد محمد علي", nameEn: "Mosque of Muhammad Ali", category: "mosque", governorate: "Cairo", city: "Cairo", lat: 30.0289, lng: 31.2602, estimatedDurationMinutes: 60, safetyScore: 87, riskLevel: "low", tags: ["mosque", "ottoman"] },
  { id: "loc-el-alamein", nameAr: "متحف العلمين", nameEn: "El Alamein War Museum", category: "historical", governorate: "Matrouh", city: "El Alamein", lat: 30.8373, lng: 28.9525, estimatedDurationMinutes: 90, safetyScore: 85, riskLevel: "low", tags: ["ww2", "museum"] },
  { id: "loc-nile-cruise", nameAr: "مرسى العبارة النيلية", nameEn: "Nile Cruise Terminal", category: "transportation", governorate: "Luxor", city: "Luxor", lat: 25.6969, lng: 32.6454, safetyScore: 83, riskLevel: "low", tags: ["nile", "cruise"] },
  { id: "loc-cai", nameAr: "مطار القاهرة الدولي", nameEn: "Cairo International Airport (CAI)", category: "transportation", governorate: "Cairo", city: "Cairo", lat: 30.1219, lng: 31.4056, safetyScore: 86, riskLevel: "low", tags: ["airport"] },
  { id: "loc-sharm-airport", nameAr: "مطار شرم الشيخ", nameEn: "Sharm El-Sheikh Airport (SSH)", category: "transportation", governorate: "South Sinai", city: "Sharm El-Sheikh", lat: 27.9773, lng: 34.3947, safetyScore: 84, riskLevel: "low", tags: ["airport"] },
  { id: "loc-cleopatra", nameAr: "مستشفى كليوباترا", nameEn: "Cleopatra Hospital", category: "hospital", governorate: "Cairo", city: "Cairo", lat: 30.0709, lng: 31.3432, safetyScore: 80, riskLevel: "low", tags: ["hospital", "emergency"] },
  { id: "loc-police-hq", nameAr: "مديرية أمن القاهرة", nameEn: "Cairo Police Directorate", category: "police", governorate: "Cairo", city: "Cairo", lat: 30.0454, lng: 31.2349, safetyScore: 82, riskLevel: "low", tags: ["police", "emergency"] },
  { id: "loc-ritz", nameAr: "نيل ريتز كارلتون", nameEn: "Nile Ritz-Carlton", category: "hotel", governorate: "Cairo", city: "Cairo", lat: 30.0444, lng: 31.2333, estimatedDurationMinutes: 0, safetyScore: 90, riskLevel: "low", tags: ["hotel", "5-star"] },
  { id: "loc-four-seasons", nameAr: "فور سيزونز نايل بلازا", nameEn: "Four Seasons Nile Plaza", category: "hotel", governorate: "Cairo", city: "Cairo", lat: 30.0392, lng: 31.2291, safetyScore: 89, riskLevel: "low", tags: ["hotel", "5-star"] },
  { id: "loc-abou-el-sid", nameAr: "أبو السيد", nameEn: "Abou El Sid Restaurant", category: "restaurant", governorate: "Cairo", city: "Cairo", lat: 30.064, lng: 31.215, safetyScore: 84, riskLevel: "low", tags: ["restaurant", "egyptian-food"] },
  { id: "loc-fishawi", nameAr: "قهوة فيشاوي", nameEn: "El Fishawy Café", category: "restaurant", governorate: "Cairo", city: "Cairo", lat: 30.048, lng: 31.261, description: "Historic 200-year-old coffeehouse in Khan el-Khalili.", estimatedDurationMinutes: 60, safetyScore: 74, riskLevel: "medium", tags: ["cafe", "historic"] },
  { id: "loc-pharmacy", nameAr: "صيدلية القاهرة 1902", nameEn: "Cairo Pharmacy 1902", category: "pharmacy", governorate: "Cairo", city: "Cairo", lat: 30.052, lng: 31.238, safetyScore: 81, riskLevel: "low", tags: ["pharmacy"] },
  { id: "loc-atm", nameAr: "ماكينة صراف الديوتش بنك", nameEn: "Deutsche Bank ATM", category: "atm", governorate: "Cairo", city: "Cairo", lat: 30.05, lng: 31.23, safetyScore: 78, riskLevel: "low", tags: ["atm"] },
  { id: "loc-us-embassy", nameAr: "السفارة الأمريكية", nameEn: "US Embassy Cairo", category: "embassy", governorate: "Cairo", city: "Cairo", lat: 30.0333, lng: 31.2289, safetyScore: 75, riskLevel: "medium", tags: ["embassy"] },
  { id: "loc-edfu", nameAr: "معبد إدفو", nameEn: "Edfu Temple", category: "historical", governorate: "Qena", city: "Edfu", lat: 24.9781, lng: 32.8734, unescoStatus: "UNESCO World Heritage Site", estimatedDurationMinutes: 90, safetyScore: 88, riskLevel: "low", tags: ["temple", "ptolemaic"] },
  { id: "loc-kom-ombo", nameAr: "معبد كوم أمبو", nameEn: "Kom Ombo Temple", category: "historical", governorate: "Aswan", city: "Kom Ombo", lat: 24.4519, lng: 32.9285, unescoStatus: "UNESCO World Heritage Site", estimatedDurationMinutes: 90, safetyScore: 87, riskLevel: "low", tags: ["temple", "nile"] },
  { id: "loc-aquarium", nameAr: "أكواريوم الغردقة", nameEn: "Hurghada Grand Aquarium", category: "attraction", governorate: "Red Sea", city: "Hurghada", lat: 27.2083, lng: 33.8356, estimatedDurationMinutes: 90, ticket: { foreignPrice: 450, egyptianPrice: 150 }, safetyScore: 83, riskLevel: "low", tags: ["aquarium", "family"] },
];

function makeTicket(input?: SeedLocation["ticket"]): GeoLocation["ticket"] {
  return {
    currency: "EGP",
    foreignPrice: input?.foreignPrice,
    egyptianPrice: input?.egyptianPrice,
    free: input?.free ?? false,
    note: input?.note,
  };
}

function makeWarnings(id: string): GeoLocation["warnings"] {
  if (id === "loc-khan-khalili" || id === "loc-fishawi") {
    return [
      {
        id: uid("warn"),
        title: "Watch your belongings",
        description: "Pickpocketing reported in crowded market areas. Keep valuables secured.",
        severity: "medium",
        category: "high_crime",
        active: true,
        expiresAt: null,
        createdAt: daysAgo(12),
      },
    ];
  }
  if (id === "loc-blue-hole") {
    return [
      {
        id: uid("warn"),
        title: "Advanced diving only",
        description: "The arch dive is extremely dangerous. Certified divers should follow a local guide.",
        severity: "high",
        category: "health_risk",
        active: true,
        expiresAt: null,
        createdAt: daysAgo(30),
      },
    ];
  }
  if (id === "loc-us-embassy") {
    return [
      {
        id: uid("warn"),
        title: "Security perimeter",
        description: "Approach roads are heavily guarded. Keep clear of restricted curbs.",
        severity: "medium",
        category: "high_crime",
        active: true,
        expiresAt: null,
        createdAt: daysAgo(20),
      },
    ];
  }
  if (id === "loc-siwa") {
    return [
      {
        id: uid("warn"),
        title: "Driving in desert",
        description: "Off-road travel requires a 4x4 and an experienced guide. No fuel between towns.",
        severity: "medium",
        category: "unsafe_roads",
        active: true,
        expiresAt: null,
        createdAt: daysAgo(45),
      },
    ];
  }
  return [];
}

function makeNearby(id: string): NearbyService[] {
  const pool: NearbyServiceType[] = ["hotel", "restaurant", "hospital", "pharmacy", "atm", "bus_stop"];
  return pool.map((type, i) => ({
    id: uid("nearby"),
    locationId: id,
    name: `${type.replace("_", " ")} nearby`,
    type,
    distanceKm: Number((0.3 + i * 0.7).toFixed(1)),
    lat: 0,
    lng: 0,
    rating: 4.2 + (i % 5) * 0.1,
  }));
}

function seedLocation(seed: SeedLocation, index: number): GeoLocation {
  const id = seed.id;
  const createdAt = daysAgo(90 - index * 3);
  const updatedAt = daysAgo((index * 5) % 40, index);
  const actor = index % 3 === 0 ? "Amira Hassan" : index % 3 === 1 ? "Omar Khaled" : "Nada El-Sayed";
  const safeScore = seed.safetyScore ?? 60 + ((index * 13) % 30);
  const risk = seed.riskLevel ?? (safeScore >= 80 ? "low" : safeScore >= 65 ? "medium" : "high");
  const status: GeoLocation["status"] = seed.status ?? (index % 5 === 0 ? "draft" : index % 9 === 0 ? "unpublished" : "published");
  const warningCount = makeWarnings(id).length;

  const facts = [
    `Located in ${seed.governorate} governorate, Egypt.`,
    `Approximate visit time: ${seed.estimatedDurationMinutes ?? 90} minutes.`,
    warningCount ? `${warningCount} active warning(s) currently attached.` : "No active warnings recorded.",
  ];

  return {
    id,
    nameAr: seed.nameAr,
    nameEn: seed.nameEn,
    description:
      seed.description ??
      `${seed.nameEn} is a notable ${seed.category.replace("_", " ")} in ${seed.city}, ${seed.governorate}, Egypt.`,
    category: seed.category,
    governorate: seed.governorate,
    city: seed.city,
    country: "Egypt",
    address: `${seed.nameEn}, ${seed.city}, ${seed.governorate}, Egypt`,
    lat: seed.lat,
    lng: seed.lng,
    images: [
      { id: uid("img"), url: imageUrl(id, 640, 420), caption: `${seed.nameEn} overview`, primary: true },
      { id: uid("img"), url: imageUrl(`${id}-2`, 640, 420), caption: "Detail view" },
      { id: uid("img"), url: imageUrl(`${id}-3`, 640, 420), caption: "Surroundings" },
    ],
    videos: [{ id: uid("vid"), url: "", title: "Walkthrough" }],
    tags: seed.tags ?? [],
    history: seed.history ?? `${seed.nameEn} has been part of Egypt's rich cultural landscape for generations.`,
    culturalInfo: `Part of the cultural identity of ${seed.governorate}.`,
    touristDescription: seed.description ?? `Recommended stop for visitors exploring ${seed.city}.`,
    bestTimeToVisit: seed.bestTimeToVisit ?? "Morning",
    estimatedDurationMinutes: seed.estimatedDurationMinutes ?? 90,
    accessibility: "Partial wheelchair access; contact the site for details.",
    photographyRules: "Personal photography allowed. Professional shoots require a permit.",
    droneRules: "Drones are restricted in this area.",
    transportationTips: "Taxis and ride-hailing apps operate in the area.",
    localTips: "Carry water and sunscreen during daytime visits.",
    emergencyInstructions: "In case of emergency call 122 (police) or 123 (ambulance).",
    interestingFacts: facts,
    unescoStatus: seed.unescoStatus,
    ticket: makeTicket(seed.ticket),
    openingHours: {
      monday: "09:00 - 17:00",
      tuesday: "09:00 - 17:00",
      wednesday: "09:00 - 17:00",
      thursday: "09:00 - 17:00",
      friday: "09:00 - 17:00",
      saturday: "10:00 - 18:00",
      sunday: "10:00 - 18:00",
      note: "Hours may change during religious holidays.",
    },
    contact: {
      phone: "+20 2 0000 0000",
      website: "https://example.com",
      googleMapsUrl: `https://maps.google.com/?q=${seed.lat},${seed.lng}`,
    },
    warnings: makeWarnings(id),
    safetyScore: safeScore,
    riskLevel: risk,
    aiSummary: `AI summary: ${seed.nameEn} is a ${seed.category.replace("_", " ")} in ${seed.city}. Expected duration ${seed.estimatedDurationMinutes ?? 90} min, safety score ${safeScore}/100.`,
    status,
    visibility: "public",
    publishedAt: status === "published" ? updatedAt : null,
    createdAt,
    updatedAt,
    updatedBy: actor,
    createdBy: actor,
    version: 2,
    versions: [
      { version: 2, changedBy: actor, createdAt: updatedAt, changes: ["Updated opening hours", "Added AI summary"] },
      { version: 1, changedBy: actor, createdAt, changes: ["Initial publication"] },
    ],
    auditLog: [
      { id: uid("audit"), action: "location.updated", actor, createdAt: updatedAt },
      { id: uid("audit"), action: "location.created", actor, createdAt },
    ],
    relatedLocationIds: [],
    customMetadata: {},
    nearby: makeNearby(id),
  };
}

export function buildMockLocations(): GeoLocation[] {
  return SEED.map(seedLocation);
}

const ZONE_SEED: Omit<RestrictedZone, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Abu Mena Monastery Protection Zone",
    description: "Archaeological buffer restricting photography and construction.",
    restrictionType: "no_photography",
    riskLevel: "low",
    allowedActivities: ["Guided visits", "Research with permit"],
    forbiddenActivities: ["Photography", "Drones", "Construction"],
    active: true,
    polygon: [
      { lat: 30.8406, lng: 29.6625 },
      { lat: 30.8475, lng: 29.6711 },
      { lat: 30.8411, lng: 29.6798 },
      { lat: 30.8337, lng: 29.6704 },
    ],
  },
  {
    name: "Suez Canal Security Corridor",
    description: "Military-controlled corridor along the Suez Canal.",
    restrictionType: "military",
    riskLevel: "high",
    allowedActivities: ["Transit via authorized crossings"],
    forbiddenActivities: ["Stopping", "Photography", "Drones", "Access to banks"],
    active: true,
    polygon: [
      { lat: 30.455, lng: 32.36 },
      { lat: 30.455, lng: 32.37 },
      { lat: 29.98, lng: 32.55 },
      { lat: 29.98, lng: 32.54 },
    ],
  },
  {
    name: "Giza Plateau No-Drone Zone",
    description: "Airspace restriction over the pyramid complex for safety and preservation.",
    restrictionType: "no_drones",
    riskLevel: "medium",
    allowedActivities: ["Ground visits"],
    forbiddenActivities: ["Drones", "Low-flying aircraft"],
    active: true,
    polygon: [
      { lat: 29.99, lng: 31.12 },
      { lat: 29.99, lng: 31.15 },
      { lat: 29.96, lng: 31.15 },
      { lat: 29.96, lng: 31.12 },
    ],
  },
  {
    name: "Western Desert Border Zone",
    description: "Sensitive zone near the western border requiring permits.",
    restrictionType: "security",
    riskLevel: "extreme",
    allowedActivities: ["Authorized convoys only"],
    forbiddenActivities: ["Off-road travel", "Independent camping", "Photography of facilities"],
    active: true,
    polygon: [
      { lat: 29.4, lng: 25.5 },
      { lat: 29.4, lng: 26.1 },
      { lat: 28.9, lng: 26.1 },
      { lat: 28.9, lng: 25.5 },
    ],
  },
  {
    name: "Taba Border Crossing Restricted Area",
    description: "Restricted perimeter around the Taba crossing.",
    restrictionType: "security",
    riskLevel: "high",
    allowedActivities: ["Border transit"],
    forbiddenActivities: ["Photography", "Drones", "Loitering"],
    active: true,
    polygon: [
      { lat: 29.4917, lng: 34.8967 },
      { lat: 29.495, lng: 34.902 },
      { lat: 29.489, lng: 34.906 },
      { lat: 29.486, lng: 34.9 },
    ],
  },
  {
    name: "Nile Delta Seasonal Flood Zone",
    description: "Low-lying areas prone to seasonal flooding.",
    restrictionType: "environmental",
    riskLevel: "medium",
    allowedActivities: ["Normal activities in dry season"],
    forbiddenActivities: ["Camping in flood-prone flats"],
    active: true,
    polygon: [
      { lat: 30.92, lng: 31.02 },
      { lat: 30.92, lng: 31.12 },
      { lat: 30.84, lng: 31.12 },
      { lat: 30.84, lng: 31.02 },
    ],
  },
];

export function buildMockZones(): RestrictedZone[] {
  return ZONE_SEED.map((z) => ({
    ...z,
    id: uid("zone"),
    createdAt: daysAgo(50),
    updatedAt: daysAgo(6),
  }));
}

const BOUNDARY_SEED: Omit<Boundary, "id" | "createdAt">[] = [
  { name: "Cairo Governorate", type: "governorate", polygon: [{ lat: 30.2, lng: 31.05 }, { lat: 30.2, lng: 31.5 }, { lat: 29.85, lng: 31.5 }, { lat: 29.85, lng: 31.05 }] },
  { name: "Giza Governorate", type: "governorate", polygon: [{ lat: 30.2, lng: 30.85 }, { lat: 30.2, lng: 31.05 }, { lat: 29.6, lng: 31.05 }, { lat: 29.6, lng: 30.85 }] },
  { name: "Alexandria Governorate", type: "governorate", polygon: [{ lat: 31.35, lng: 29.55 }, { lat: 31.35, lng: 30.1 }, { lat: 30.85, lng: 30.1 }, { lat: 30.85, lng: 29.55 }] },
  { name: "Luxor Governorate", type: "governorate", polygon: [{ lat: 25.95, lng: 32.35 }, { lat: 25.95, lng: 32.85 }, { lat: 25.4, lng: 32.85 }, { lat: 25.4, lng: 32.35 }] },
  { name: "Aswan Governorate", type: "governorate", polygon: [{ lat: 24.6, lng: 32.6 }, { lat: 24.6, lng: 33.3 }, { lat: 22.1, lng: 33.3 }, { lat: 22.1, lng: 32.6 }] },
  { name: "South Sinai Governorate", type: "governorate", polygon: [{ lat: 29.5, lng: 33.2 }, { lat: 29.5, lng: 34.9 }, { lat: 27.5, lng: 34.9 }, { lat: 27.5, lng: 33.2 }] },
];

export function buildMockBoundaries(): Boundary[] {
  return BOUNDARY_SEED.map((b) => ({ ...b, id: uid("boundary"), createdAt: daysAgo(120) }));
}

export function buildMockActivity(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const actors = ["Amira Hassan", "Omar Khaled", "Nada El-Sayed", "System"];
  for (let i = 0; i < 18; i += 1) {
    const loc = SEED[(i * 7) % SEED.length];
    const type: ActivityEvent["type"] = i % 5 === 0 ? "system" : i % 4 === 0 ? "warning" : "location";
    const action =
      type === "system"
        ? "geocontext.sync"
        : type === "warning"
          ? "warning.created"
          : i % 3 === 0
            ? "location.published"
            : "location.updated";
    events.push({
      id: uid("act"),
      type,
      action,
      actor: actors[i % actors.length],
      targetId: loc.id,
      targetName: loc.nameEn,
      createdAt: daysAgo(i * 2, i),
      metadata: { version: 2 },
    });
  }
  return events;
}

export function buildMockAnalytics(locations: GeoLocation[], zones: RestrictedZone[]): GeoAnalytics {
  const byCategoryMap = new Map<LocationCategory, number>();
  const warningsBySeverity = new Map<GeoLocation["warnings"][number]["severity"], number>();
  let activeWarnings = 0;

  locations.forEach((loc) => {
    byCategoryMap.set(loc.category, (byCategoryMap.get(loc.category) ?? 0) + 1);
    loc.warnings.forEach((w) => {
      if (w.active) activeWarnings += 1;
      warningsBySeverity.set(w.severity, (warningsBySeverity.get(w.severity) ?? 0) + 1);
    });
  });

  const touristCategories: LocationCategory[] = ["attraction", "historical", "museum", "mosque", "park", "beach"];
  const touristPlaces = locations.filter((l) => touristCategories.includes(l.category)).length;

  const topUpdated = [...locations]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 6)
    .map((l) => ({ id: l.id, name: l.nameEn, updatedAt: l.updatedAt }));

  return {
    totalLocations: locations.length,
    touristPlaces,
    restrictedAreas: zones.length,
    activeWarnings,
    governoratesCoverage: new Set(locations.map((l) => l.governorate)).size,
    recentlyUpdated: locations.filter((l) => Date.now() - new Date(l.updatedAt).getTime() < 7 * 86400_000).length,
    byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({ category, count })),
    warningsBySeverity: [...warningsBySeverity.entries()].map(([severity, count]) => ({ severity, count })),
    topUpdated,
  };
}

export function createMockLocation(input: LocationInput): GeoLocation {
  const now = new Date().toISOString();
  const actor = "You";
  return {
    id: uid("loc"),
    nameAr: input.nameAr,
    nameEn: input.nameEn,
    description: input.description,
    category: input.category,
    governorate: input.governorate,
    city: input.city,
    country: input.country,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    images: [],
    videos: [],
    tags: input.tags ?? [],
    history: input.history ?? "",
    culturalInfo: input.culturalInfo ?? "",
    touristDescription: input.touristDescription ?? "",
    bestTimeToVisit: input.bestTimeToVisit ?? "",
    estimatedDurationMinutes: input.estimatedDurationMinutes,
    accessibility: input.accessibility ?? "",
    photographyRules: input.photographyRules ?? "",
    droneRules: input.droneRules ?? "",
    transportationTips: input.transportationTips ?? "",
    localTips: input.localTips ?? "",
    emergencyInstructions: input.emergencyInstructions ?? "",
    interestingFacts: input.interestingFacts ?? [],
    unescoStatus: input.unescoStatus,
    ticket: input.ticket,
    openingHours: input.openingHours,
    contact: input.contact,
    warnings: [],
    safetyScore: 50,
    riskLevel: "low",
    aiSummary: "",
    status: "draft",
    visibility: input.visibility ?? "public",
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: actor,
    createdBy: actor,
    version: 1,
    versions: [{ version: 1, changedBy: actor, createdAt: now, changes: ["Location created"] }],
    auditLog: [{ id: uid("audit"), action: "location.created", actor, createdAt: now }],
    relatedLocationIds: [],
    customMetadata: input.customMetadata ?? {},
    nearby: [],
  };
}
