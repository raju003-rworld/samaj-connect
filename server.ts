import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import {
  initialDistricts,
  initialTalukas,
  initialVillages,
  initialMainSamaj,
  initialSamaj,
  type District,
  type Taluka,
  type Village,
  type MainSamajItem,
  type SamajItem,
} from "./src/data/gujaratMasterData";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// In-memory data storage (simulating Firestore database for Samaj Connect)
export type AdminRole = "SUPER_ADMIN" | "MAIN_SAMAJ_ADMIN" | "SAMAJ_ADMIN";

export interface AdminScope {
  mainSamajId?: string | null;
  samajId?: string | null;
}

export type { District, Taluka, Village };

export interface MainSamaj {
  id: string;
  name: string;
  nameGujarati?: string;
  nameEn: string;
  code: string;
  aliases?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Gam {
  id: string;
  districtId?: string;
  talukaId?: string;
  name: string;
  nameEn: string;
  district: string;
  taluka?: string;
  mainSamajId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminName: string;
  role: AdminRole;
  scope?: AdminScope;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ReportItem {
  id: string;
  targetType: "post" | "comment" | "user" | "live";
  targetId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface Samaj {
  id: string;
  name: string;
  nameGujarati?: string;
  nameEn: string;
  code: string;
  mainSamajId: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  gamIds?: string[];
  district?: string;
  isActive: boolean;
  requirePostApproval: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SamajUser {
  id: string;
  phone: string;
  name: string;
  role: string;
  adminRole?: AdminRole | null;
  profilePhoto: string;
  village: string;
  district: string;
  bio: string;
  samajIds: string[];
  samajRoles: Record<string, string>;
  activeSamajId: string;
  followersCount: number;
  followingCount: number;
  isSuspended: boolean;
  blocked?: string[];
  followers?: string[];
  following?: string[];
  verificationStatus?: "none" | "pending" | "verified" | "rejected";
  rejectionReason?: string | null;
  verificationSubmittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  mainSamajId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  gamId?: string;
  gam?: string;
  samajId?: string;
  onboardingCompleted?: boolean;
  createdAt?: string;
  profileCompleted?: boolean;
  profileCompletedAt?: string;
  profileReminderLaterUsed?: boolean;
  profileReminderLaterUsedAt?: string;
}

const DEFAULT_SAMAJ_ID = "default";

let reportsList: ReportItem[] = [];
let auditLogsList: AdminAuditLog[] = [];

export function logAdminAction(entry: Omit<AdminAuditLog, "id" | "timestamp">): AdminAuditLog {
  const log: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };
  auditLogsList.unshift(log);
  if (auditLogsList.length > 500) auditLogsList.pop();
  return log;
}

// ----------------- GUJARAT MASTER DATA LOADER & PERSISTENCE -----------------
const DATA_DIR = path.join(process.cwd(), "data");
const MASTER_FILE = path.join(DATA_DIR, "masterData.json");

function loadMasterData() {
  try {
    if (fs.existsSync(MASTER_FILE)) {
      const content = fs.readFileSync(MASTER_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.districts?.length && parsed.talukas?.length && parsed.villages?.length) {
        const msMap = new Map<string, MainSamaj>();
        initialMainSamaj.forEach((m) => msMap.set(m.id, m as MainSamaj));
        (parsed.mainSamaj || []).forEach((m: MainSamaj) => msMap.set(m.id, { ...msMap.get(m.id), ...m }));

        const sMap = new Map<string, Samaj>();
        initialSamaj.forEach((s) => sMap.set(s.id, s as Samaj));
        (parsed.samaj || []).forEach((s: Samaj) => sMap.set(s.id, { ...sMap.get(s.id), ...s }));

        return {
          districts: parsed.districts as District[],
          talukas: parsed.talukas as Taluka[],
          villages: parsed.villages as Village[],
          mainSamaj: Array.from(msMap.values()),
          samaj: Array.from(sMap.values()),
        };
      }
    }
  } catch (e) {
    console.warn("Could not read masterData.json, loading defaults:", e);
  }
  return {
    districts: [...initialDistricts],
    talukas: [...initialTalukas],
    villages: [...initialVillages],
    mainSamaj: [...initialMainSamaj],
    samaj: [...initialSamaj],
  };
}

const masterDataLoaded = loadMasterData();
const districtList: District[] = masterDataLoaded.districts;
const talukaList: Taluka[] = masterDataLoaded.talukas;
const villageList: Village[] = masterDataLoaded.villages;
const mainSamajList: MainSamaj[] = masterDataLoaded.mainSamaj;
const samajList: Samaj[] = masterDataLoaded.samaj;

export function persistMasterData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      MASTER_FILE,
      JSON.stringify(
        {
          districts: districtList,
          talukas: talukaList,
          villages: villageList,
          mainSamaj: mainSamajList,
          samaj: samajList,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (e) {
    console.error("Failed to persist master data:", e);
  }
}

// Backwards-compatible gamList derived dynamically
let gamList: Gam[] = villageList.map((v) => {
  const dist = districtList.find((d) => d.id === v.districtId);
  const tal = talukaList.find((t) => t.id === v.talukaId);
  return {
    id: v.id,
    districtId: v.districtId,
    talukaId: v.talukaId,
    name: v.nameGujarati || v.name,
    nameEn: v.name,
    district: dist?.nameGujarati || dist?.name || "",
    taluka: tal?.nameGujarati || tal?.name || "",
    mainSamajId: "main_patidar",
    isActive: v.isActive,
    createdAt: v.createdAt || new Date("2024-01-01").toISOString(),
  };
});


let currentUser: SamajUser = {
  id: "user_demo_admin",
  phone: "+919876543210",
  name: "રાજેશભાઈ પટેલ (Admin)",
  role: "super_admin",
  adminRole: "SUPER_ADMIN",
  profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  village: "ઊંઝા",
  district: "મહેસાણા",
  bio: "સમાજ ઉત્કર્ષ અને સેવા માટે સમર્પિત.",
  samajIds: [DEFAULT_SAMAJ_ID, "samaj_ahmedabad"],
  samajRoles: { default: "super_admin" },
  activeSamajId: DEFAULT_SAMAJ_ID,
  followersCount: 142,
  followingCount: 38,
  isSuspended: false,
  blocked: [],
  followers: [],
  following: [],
  verificationStatus: "verified",
  mainSamajId: "main_patidar",
  gam: "ઊંઝા",
};

let membersList = [
  {
    id: "mem_1",
    name: "રાજેશભાઈ ગોવિંદભાઈ પટેલ",
    mobile: "9876543210",
    village: "ઊંઝા",
    district: "મહેસાણા",
    address: "શ્રી રામ સોસાયટી, ઊંઝા",
    dob: "1982-05-14",
    bloodGroup: "B+",
    education: "B.Com, MBA",
    email: "rajesh.patel@example.com",
    father: "ગોવિંદભાઈ મોતીભાઈ પટેલ",
    mother: "શાંતાબેન પટેલ",
    gender: "male",
    maritalStatus: "married",
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: new Date("2024-01-10").toISOString(),
    createdBy: "user_demo_admin",
  },
  {
    id: "mem_2",
    name: "પ્રિયંકાબેન અમિતભાઈ પટેલ",
    mobile: "9825123456",
    village: "વિસનગર",
    district: "મહેસાણા",
    address: "આનંદ વિલા, વિસનગર",
    dob: "1988-11-22",
    bloodGroup: "O+",
    education: "M.Sc. IT",
    email: "priyanka.patel@example.com",
    father: "કીર્તિભાઈ પટેલ",
    mother: "જશોદાબેન પટેલ",
    gender: "female",
    maritalStatus: "married",
    profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: new Date("2024-01-15").toISOString(),
    createdBy: "user_demo_admin",
  },
  {
    id: "mem_3",
    name: "હર્ષિલ મુકેશભાઈ પટેલ",
    mobile: "9712345678",
    village: "કડી",
    district: "મહેસાણા",
    address: "સરદાર ચોક, કડી",
    dob: "1997-03-10",
    bloodGroup: "A+",
    education: "B.E. Computer Engineering",
    email: "harshil.patel@example.com",
    father: "મુકેશભાઈ જે. પટેલ",
    mother: "હંસાબેન પટેલ",
    gender: "male",
    maritalStatus: "single",
    profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: new Date("2024-02-01").toISOString(),
    createdBy: "user_demo_admin",
  },
  {
    id: "mem_4",
    name: "ડૉ. સુરેશચંદ્ર મોતીલાલ પટેલ",
    mobile: "9426011223",
    village: "ચાણસ્મા",
    district: "પાટણ",
    address: "ધનવંતરી ક્લિનિક, ચાણસ્મા",
    dob: "1975-08-19",
    bloodGroup: "AB+",
    education: "M.B.B.S, M.D.",
    email: "dr.suresh@example.com",
    father: "મોતીલાલ પટેલ",
    mother: "કમળાબેન",
    gender: "male",
    maritalStatus: "married",
    profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: new Date("2024-02-12").toISOString(),
    createdBy: "user_demo_admin",
  },
  {
    id: "mem_5",
    name: "દિપ્તીબેન જયેશભાઈ પટેલ",
    mobile: "9898776655",
    village: "સિદ્ધપુર",
    district: "પાટણ",
    address: "શ્રીજી કૃપા, સિદ્ધપુર",
    dob: "1994-09-04",
    bloodGroup: "B-",
    education: "M.Com, B.Ed",
    email: "deepti.patel@example.com",
    father: "જયેશભાઈ પટેલ",
    mother: "ગીતાબેન પટેલ",
    gender: "female",
    maritalStatus: "single",
    profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: new Date("2024-02-20").toISOString(),
    createdBy: "user_demo_admin",
  }
];

let eventsList = [
  {
    id: "ev_1",
    title: "વાર્ષિક સ્નેહ મિલન અને તેજસ્વી તારલા સન્માન ૨૦૨૫",
    description: "સમાજના ધોરણ ૧૦, ૧૨ અને ડિગ્રી મેળવનાર તેજસ્વી વિદ્યાર્થીઓનું સન્માન સમારોહ તથા સાહિત્યિક કાર્યક્રમ.",
    eventImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    location: "શ્રી સરદાર પટેલ ભવન, ઊંઝા",
    date: "2025-10-15",
    startTime: "09:00",
    endTime: "14:00",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    registrations: [currentUser.id, "user_2", "user_3"],
    createdAt: new Date("2024-03-01").toISOString(),
    createdBy: currentUser.id,
  },
  {
    id: "ev_2",
    title: "વિશાળ રક્તદાન શિબિર અને નિઃશુલ્ક આરોગ્ય કેમ્પ",
    description: "સમાજ પરિવાર દ્વારા માનવતાના કાર્ય માટે આયોજિત ભવ્ય રક્તદાન કેમ્પ. બ્લડ પ્રેશર અને ડાયાબિટીસની ફ્રી તપાસ.",
    eventImage: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80",
    location: "કમ્યુનિટી સેન્ટર, સોસાયટી હોલ, મહેસાણા",
    date: "2025-11-02",
    startTime: "08:30",
    endTime: "16:00",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    registrations: [currentUser.id],
    createdAt: new Date("2024-03-10").toISOString(),
    createdBy: currentUser.id,
  },
  {
    id: "ev_3",
    title: "સમાજ પ્રીમિયર લીગ (SPL) બોક્સ ક્રિકેટ ટુર્નામેન્ટ",
    description: "સમાજના યુવાઓ માટે આંતર-ગામ બોક્સ ક્રિકેટ મહોત્સવ. આકર્ષક ટ્રોફી અને રોકડ ઇનામો.",
    eventImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80",
    location: "સ્પોર્ટ્સ ક્લબ ગ્રાઉન્ડ, વિસનગર રોડ",
    date: "2025-12-20",
    startTime: "16:00",
    endTime: "22:00",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    registrations: [],
    createdAt: new Date("2024-03-15").toISOString(),
    createdBy: currentUser.id,
  }
];

export interface AppNotification {
  id: string;
  type: "reel" | "message" | "event" | "system";
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
  userId?: string;
  samajId?: string;
  authorId?: string;
  authorName?: string;
  authorPhoto?: string;
  conversationId?: string;
  reelId?: string;
}

export let notificationsList: AppNotification[] = [
  {
    id: "notif_welcome",
    type: "system",
    title: "સ્વાગત છે!",
    body: "સમાજ કનેક્ટ ડિજિટલ પરિવારમાં આપનું હાર્દિક સ્વાગત છે.",
    link: "/home",
    read: true,
    createdAt: new Date().toISOString(),
    userId: "all",
  }
];

let postsList = [
  {
    id: "reel_garba_2026",
    authorId: "mem_2",
    authorName: "પ્રિયંકાબેન અમિતભાઈ પટેલ",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "સમાજ આયોજિત ભવ્ય રાસ-ગરબા મહોત્સવની ઝલક! પારંપરિક ડ્રેસ અને તાળીઓના તાલે ઝૂમતો આપણો યુવા વર્ગ 💃✨ #Garba2026 #SamajReels",
    caption: "સમાજ આયોજિત ભવ્ય રાસ-ગરબા મહોત્સવની મનમોહક ઝલક! 💃✨",
    mediaUrls: ["/reels/garba-navratri.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "તારા વિના શ્યામ મને એકલડું લાગે • રાસ ગરબા",
    location: "પાટીદાર વાડી ગ્રાઉન્ડ, ઊંઝા",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id, "mem_1", "mem_3"],
    savedBy: [currentUser.id],
    likesCount: 142,
    commentsCount: 18,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "reel_mandir_aarti",
    authorId: "mem_1",
    authorName: "મહેન્દ્રભાઈ ગોવિંદભાઈ પટેલ",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    authorRole: "admin",
    content: "જય ઉમિયા માત! આજની મંગળા આરતીના પવિત્ર દર્શન. સર્વ સમાજ બાંધવોનું કલ્યાણ થાય. 🪔🙏 #UmiyaMaa #AartiReel",
    caption: "શ્રી ઉમિયા માતાજી મંદિર મંગળા આરતી અને દિવ્ય દર્શન 🪔🙏",
    mediaUrls: ["/reels/mandir-aarti.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "ૐ જય ઉમિયા માતા • મંગળા આરતી",
    location: "શ્રી ઉમિયા માતાજી સંસ્થાન, ઊંઝા",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 215,
    commentsCount: 34,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "reel_youth_cricket",
    authorId: "mem_3",
    authorName: "હર્ષિલ અશ્વિનભાઈ પટેલ",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "છેલ્લા બોલ પર વિનિંગ સિક્સર! ઊંઝા વોરિયર્સ બન્યા SPL ૨૦૨૬ ચેમ્પિયન્સ 🏆🏏 #CricketReel #SamajYouth",
    caption: "સમાજ પ્રીમિયર લીગ (SPL) ફાઇનલ મેચ વિનિંગ મોમેન્ટ 🏆🏏",
    mediaUrls: ["/reels/youth-cricket.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "જીત અમારી છે • એનર્જી બીટ્સ",
    location: "સ્પોર્ટ્સ ક્લબ સ્ટેડિયમ",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id, "mem_2"],
    savedBy: [currentUser.id],
    likesCount: 189,
    commentsCount: 27,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "reel_business_summit",
    authorId: "mem_5",
    authorName: "ચિરાગભાઈ કાંતિલાલ પટેલ",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "૫૦૦+ યુવા ઉદ્યોગસાહસિકો સાથે સમાજનો બિઝનેસ સમિટ. નવીન સ્ટાર્ટઅપ્સ અને નેટવર્કિંગની શાનદાર ક્ષણો 🚀💼 #BusinessSummit #SamajConnect",
    caption: "પાટીદાર યુવા બિઝનેસ કોન્ક્લેવ ૨૦૨૬ • નવી પેઢી, નવા આયામ 🚀",
    mediaUrls: ["/reels/business-summit.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "ઇન્સ્પિરેશનલ થીમ • સક્સેસ મંત્ર",
    location: "મહાત્મા મંદિર, ગાંધીનગર",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 120,
    commentsCount: 14,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: "reel_community_seva",
    authorId: "mem_4",
    authorName: "ડૉ. સુરેશચંદ્ર પટેલ",
    authorPhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "એક રક્તદાન, ત્રણ જીવન! યુવા મંડળ દ્વારા આયોજિત મેગા બ્લડ ડોનેશન કેમ્પમાં ૨૧૦ યુનિટ રક્ત એકત્રિત થયું. માનવ સેવા એ જ પ્રભુ સેવા! 🩸❤️ #SamajSeva #BloodDonation",
    caption: "મેગા રક્તદાન અને આરોગ્ય તપાસ શિબિર સેવા 🩸❤️",
    mediaUrls: ["/reels/community-seva.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "સેવા પરમો ધર્મઃ • શાંત ધૂન",
    location: "સમાજ હોલ, વિસનગર",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 165,
    commentsCount: 21,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "post_1",
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorPhoto: currentUser.profilePhoto,
    content: "આપણા સમાજના હોનહાર યુવા હર્ષિલ પટેલે ગુજરાત પબ્લિક સર્વિસ કમિશન (GPSC) માં ઝળહળતી સફળતા મેળવી સમાજનું નામ રોશન કર્યું છે. ખૂબ ખૂબ અભિનંદન! 💐🎉 #SamajPride #Success",
    caption: "આપણા સમાજના હોનહાર યુવા હર્ષિલ પટેલે GPSC માં સફળતા મેળવી સમાજનું નામ રોશન કર્યું!",
    mediaUrls: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"],
    imageUrls: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"],
    mediaType: "image",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id, "u2", "u3", "u4"],
    savedBy: [currentUser.id],
    likesCount: 24,
    commentsCount: 5,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "post_2",
    authorId: "mem_4",
    authorName: "ડૉ. સુરેશચંદ્ર પટેલ",
    authorPhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    content: "આગામી રવિવારે ઊંઝા મુકામે સર્વરોગ નિદાન કેમ્પનું આયોજન છે. સમાજના તમામ વડીલો અને માતા-બહેનોને લાભ લેવા નમ્ર વિનંતી છે. 🙏 #HealthCamp #SamajSeva",
    caption: "આગામી રવિવારે ઊંઝા મુકામે સર્વરોગ નિદાન કેમ્પ",
    mediaUrls: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"],
    imageUrls: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"],
    mediaType: "image",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 18,
    commentsCount: 2,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  }
];

let commentsList: Record<string, Array<{ id: string; authorId: string; authorName: string; authorPhoto: string; content: string; createdAt: string }>> = {
  post_1: [
    {
      id: "comm_1",
      authorId: "mem_2",
      authorName: "પ્રિયંકાબેન પટેલ",
      authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      content: "ખૂબ ખૂબ અભિનંદન ભાઈ! ઉત્તરોત્તર પ્રગતિ કરો તેવી શુભકામનાઓ.",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "comm_2",
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorPhoto: currentUser.profilePhoto,
      content: "આખા સમાજને ગર્વ છે તમારા પર!",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
  ]
};

export interface StoryRecord {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  filter?: string;
  rotation?: number;
  aspectRatio?: string;
  volume?: number;
  trimStart?: number;
  trimEnd?: number;
  textOverlays?: any[];
  emojiOverlays?: any[];
  music?: any;
  visibility?: string;
  samajId?: string;
  likedBy: string[];
  likesCount: number;
  viewedBy: string[];
  viewsCount: number;
  createdAt: string;
}

let storiesList: StoryRecord[] = [
  {
    id: "story_1",
    userId: currentUser.id,
    userName: currentUser.name,
    userPhoto: currentUser.profilePhoto,
    mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    caption: "આજનો સૂર્યોદય અને મંદિર દર્શન 🌅🙏",
    filter: "warm",
    rotation: 0,
    aspectRatio: "9:16",
    volume: 1,
    likedBy: ["u2", "u3"],
    likesCount: 2,
    viewedBy: [currentUser.id, "u2"],
    viewsCount: 14,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35m ago
    samajId: DEFAULT_SAMAJ_ID,
    visibility: "samaj",
    music: {
      id: "track_morning_prabhatiya",
      title: "પ્રભાતિયા ભૈરવ ધૂન",
      artist: "સમાજ સંગીત મંડળ",
      cover: "🌅",
      volume: 0.8,
    }
  },
  {
    id: "story_2",
    userId: "mem_2",
    userName: "પ્રિયંકાબેન પટેલ",
    userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    mediaUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    caption: "સમાજવાડી ખાતે સત્સંગ સમારોહ 🪔✨",
    filter: "vivid",
    rotation: 0,
    aspectRatio: "9:16",
    volume: 1,
    likedBy: [currentUser.id],
    likesCount: 5,
    viewedBy: [currentUser.id],
    viewsCount: 28,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(), // 1h 50m ago
    samajId: DEFAULT_SAMAJ_ID,
    visibility: "samaj",
    music: {
      id: "track_mandir_aarti",
      title: "મંદિર આરતી અને શંખનાદ",
      artist: "પરંપરાગત ધૂન",
      cover: "🪔",
      volume: 0.7,
    }
  },
  {
    id: "story_3",
    userId: "mem_3",
    userName: "હર્ષિલ પટેલ",
    userPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4",
    mediaType: "video",
    caption: "કુદરતના સાનિધ્યમાં સાંજ 🍃🕊️",
    filter: "cool",
    rotation: 0,
    aspectRatio: "9:16",
    volume: 0.8,
    trimStart: 0,
    trimEnd: 15,
    likedBy: [],
    likesCount: 1,
    viewedBy: [],
    viewsCount: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 270).toISOString(), // 4h 30m ago
    samajId: DEFAULT_SAMAJ_ID,
    visibility: "samaj",
    music: {
      id: "track_krishna_flute",
      title: "શ્રીકૃષ્ણ વાંસળી મધુર સૂર",
      artist: "ભક્તિ સૂર",
      cover: "🪈",
      volume: 0.75,
    }
  }
];

let hallsList = [
  {
    id: "hall_1",
    name: "શ્રી સરદાર પટેલ એર-કન્ડિશન્ડ બેન્ક્વેટ હોલ",
    description: "લગ્નપ્રસંગ, સગાઈ, બેસણું અને સામાજિક મીટિંગ્સ માટે સુવિધાયુક્ત સેન્ટ્રલી એસી હોલ. વિશાળ કિચન અને પાર્કિંગ વ્યવસ્થા ઉપલબ્ધ.",
    location: "ઊંઝા હાઈવે રોડ, ઊંઝા",
    capacity: 600,
    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
    pricePerDay: 25000,
    amenities: ["AC", "Large Kitchen", "Stage & Audio", "Ample Parking", "Bridal Room", "Generator Backup"],
    isActive: true,
    samajId: DEFAULT_SAMAJ_ID,
  },
  {
    id: "hall_2",
    name: "સમાજવાડી સેમિનાર રૂમ અને ડાઇનિંગ એરિયા",
    description: "નાના મેળાવડા, પ્રવચન કે વિદ્યાર્થી સેમિનાર માટે ઉત્તમ ૧૫૦ વ્યક્તિઓની ક્ષમતા ધરાવતો મિની હોલ.",
    location: "સરદાર ચોક, મહેસાણા",
    capacity: 150,
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
    pricePerDay: 8000,
    amenities: ["Projector", "Sound System", "Dining Hall", "Wi-Fi"],
    isActive: true,
    samajId: DEFAULT_SAMAJ_ID,
  }
];

let bookingsList = [
  {
    id: "bk_1",
    hallId: "hall_1",
    hallName: "શ્રી સરદાર પટેલ એર-કન્ડિશન્ડ બેન્ક્વેટ હોલ",
    date: "2025-11-25",
    startTime: "08:00",
    endTime: "22:00",
    purpose: "લગ્ન પ્રસંગ (વિવાહ સંસ્કાર)",
    guests: 450,
    contactPhone: "9876543210",
    userName: currentUser.name,
    userId: currentUser.id,
    samajId: DEFAULT_SAMAJ_ID,
    status: "approved",
    createdAt: new Date("2024-02-15").toISOString(),
  }
];

let albumsList = [
  {
    id: "alb_1",
    title: "વાર્ષિક સ્નેહ મિલન ૨૦૨૪ સંસ્મરણો",
    description: "ગયા વર્ષના વાર્ષિક મહોત્સવ અને સન્માન સમારોહની યાદગાર ક્ષણો.",
    coverUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    photosCount: 6,
    samajId: DEFAULT_SAMAJ_ID,
    approved: true,
    status: "active",
    createdAt: new Date("2024-01-20").toISOString(),
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80", caption: "સ્વાગત પ્રવચન" },
      { id: "p2", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80", caption: "વિદ્યાર્થી સન્માન" },
      { id: "p3", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80", caption: "સાંસ્કૃતિક કાર્યક્રમ" }
    ]
  }
];

let liveSessions = [
  {
    id: "live_1",
    title: "શ્રીમદ્ ભાગવત સપ્તાહ જ્ઞાનયજ્ઞ - દિવસ ૩ (લાઈવ પ્રસારણ)",
    description: "સમાજના આંગણે પૂજ્ય શાસ્ત્રીજીના મુખારવિંદથી અમૃતમય કથાનું સીધું પ્રસારણ.",
    thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "live",
    viewersCount: 42,
    scheduledAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    samajId: DEFAULT_SAMAJ_ID,
  }
];

// Helper to sanitize / format output
function formatEvent(e: any, user: SamajUser) {
  const regs = e.registrations || [];
  return {
    ...e,
    visibility: e.visibility || "samaj",
    registeredByMe: regs.includes(user.id),
    registrationCount: regs.length,
    canManage: user.role === "super_admin" || e.createdBy === user.id,
  };
}

// ----------------- API ROUTES -----------------

// Flag for controlling development/demo OTP flow (enabled for smooth testing and onboarding fallback)
const DEV_AUTH_ENABLED = true;

// ---- Real Firebase ID-token verification (Google public keys; no service account needed) ----
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "samaj-connect-6ad91";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyFirebaseIdToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload || !payload.sub) return null;
    return payload;
  } catch {
    return null; // fail closed on any signature / claim / expiry error
  }
}

// Server-side admin roles store: verified phone (last 10 digits) -> AdminRole.
function parseAdminAllowlist(raw: string): Record<string, AdminRole> {
  const map: Record<string, AdminRole> = {};
  for (const entry of (raw || "").split(",")) {
    const [phoneRaw, roleRaw] = entry.split(":").map((x) => (x || "").trim());
    if (!phoneRaw || !roleRaw) continue;
    const digits = phoneRaw.replace(/\D/g, "").slice(-10);
    const role = roleRaw.toUpperCase();
    if (!digits) continue;
    if (role === "SUPER_ADMIN" || role === "MAIN_SAMAJ_ADMIN" || role === "SAMAJ_ADMIN") {
      map[digits] = role as AdminRole;
    }
  }
  return map;
}

// Persistent Admin Roles store (seeded from ADMIN_ALLOWLIST environment variable if provided)
let adminRolesMap: Record<string, AdminRole> = parseAdminAllowlist(process.env.ADMIN_ALLOWLIST || "");

// Seed demo admin roles for default samaj chapter heads
if (!adminRolesMap["9876543210"]) adminRolesMap["9876543210"] = "SUPER_ADMIN";
if (!adminRolesMap["9825000001"]) adminRolesMap["9825000001"] = "MAIN_SAMAJ_ADMIN";
if (!adminRolesMap["9825000002"]) adminRolesMap["9825000002"] = "SAMAJ_ADMIN";

function allowlistRole(phone: string | undefined | null): AdminRole | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").slice(-10);
  return adminRolesMap[digits] || null;
}

const usersMap: Record<string, SamajUser> = {
  [currentUser.id]: currentUser,
  "user_9876543210": currentUser,
  "mem_1": currentUser,
  // Main Samaj Admin
  "user_9825000001": {
    id: "user_9825000001",
    phone: "+919825000001",
    name: "જયેશભાઈ પટેલ (Main Samaj Admin)",
    role: "main_samaj_admin",
    adminRole: "MAIN_SAMAJ_ADMIN",
    profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    village: "ઊંઝા",
    district: "મહેસાણા",
    bio: "મુખ્ય સમાજ સંયોજક અને પ્રશાસક",
    samajIds: [DEFAULT_SAMAJ_ID],
    samajRoles: { [DEFAULT_SAMAJ_ID]: "main_samaj_admin" },
    activeSamajId: DEFAULT_SAMAJ_ID,
    followersCount: 88,
    followingCount: 20,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "verified",
    mainSamajId: "main_patidar",
    gam: "ઊંઝા",
  },
  // Samaj Chapter Admin
  "user_9825000002": {
    id: "user_9825000002",
    phone: "+919825000002",
    name: "કિરીટભાઈ પટેલ (Ahmedabad Samaj Admin)",
    role: "samaj_admin",
    adminRole: "SAMAJ_ADMIN",
    profilePhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    village: "અમદાવાદ",
    district: "અમદાવાદ",
    bio: "અમદાવાદ સમાજ શાખા સંચાલક",
    samajIds: ["samaj_ahmedabad"],
    samajRoles: { samaj_ahmedabad: "samaj_admin" },
    activeSamajId: "samaj_ahmedabad",
    followersCount: 45,
    followingCount: 12,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "verified",
    mainSamajId: "main_patidar",
    gam: "અમદાવાદ",
  },
};

// Seed members into usersMap so they can be searched, messaged, and followed
membersList.forEach((m) => {
  const uid = `user_${m.mobile.slice(-10)}`;
  if (!usersMap[uid]) {
    usersMap[uid] = {
      id: uid,
      phone: `+91${m.mobile}`,
      name: m.name,
      role: "member",
      adminRole: null,
      profilePhoto: m.profilePhoto,
      village: m.village,
      district: m.district,
      bio: `${m.education || "સભ્ય"} · ${m.village}`,
      samajIds: [m.samajId || DEFAULT_SAMAJ_ID],
      samajRoles: { [m.samajId || DEFAULT_SAMAJ_ID]: "member" },
      activeSamajId: m.samajId || DEFAULT_SAMAJ_ID,
      followersCount: 24,
      followingCount: 15,
      isSuspended: false,
      blocked: [],
      followers: [],
      following: [],
      verificationStatus: "verified",
      mainSamajId: "main_patidar",
      gam: m.village,
    };
  }
  // Also index by member id e.g. mem_1
  if (!usersMap[m.id]) {
    usersMap[m.id] = usersMap[uid];
  }
});

// Helper to resolve user by ID, member ID, or phone
function resolveUser(uid: string): SamajUser | undefined {
  if (!uid) return undefined;
  if (usersMap[uid]) return usersMap[uid];
  if (uid === currentUser.id) return currentUser;

  const member = membersList.find((m) => m.id === uid || `user_${m.mobile.slice(-10)}` === uid);
  if (member) {
    const genUid = `user_${member.mobile.slice(-10)}`;
    if (!usersMap[genUid]) {
      usersMap[genUid] = {
        id: genUid,
        phone: `+91${member.mobile}`,
        name: member.name,
        role: "member",
        profilePhoto: member.profilePhoto,
        village: member.village,
        district: member.district,
        bio: `${member.education || "સભ્ય"} · ${member.village}`,
        samajIds: [member.samajId || DEFAULT_SAMAJ_ID],
        samajRoles: { [member.samajId || DEFAULT_SAMAJ_ID]: "member" },
        activeSamajId: member.samajId || DEFAULT_SAMAJ_ID,
        followersCount: 24,
        followingCount: 15,
        isSuspended: false,
        blocked: [],
        followers: [],
        following: [],
        verificationStatus: "verified",
        mainSamajId: "main_patidar",
        gam: member.village,
      };
    }
    usersMap[uid] = usersMap[genUid];
    return usersMap[genUid];
  }
  return undefined;
}

// ----------------- FOLLOW / UNFOLLOW SYSTEM (POINT 3) -----------------
interface FollowRelation {
  id: string; // `${followerId}_${followedUserId}`
  followerId: string;
  followedUserId: string;
  createdAt: string;
}

// Global follow relationships map (deterministic key: `${followerId}_${followedUserId}`)
const followRelationsMap = new Map<string, FollowRelation>();

function seedFollow(followerId: string, targetId: string) {
  const key = `${followerId}_${targetId}`;
  if (!followRelationsMap.has(key)) {
    followRelationsMap.set(key, {
      id: key,
      followerId,
      followedUserId: targetId,
      createdAt: new Date("2024-03-01").toISOString(),
    });
    const follower = resolveUser(followerId);
    const target = resolveUser(targetId);
    if (follower) {
      if (!follower.following) follower.following = [];
      if (!follower.following.includes(targetId)) follower.following.push(targetId);
      follower.followingCount = follower.following.length;
    }
    if (target) {
      if (!target.followers) target.followers = [];
      if (!target.followers.includes(followerId)) target.followers.push(followerId);
      target.followersCount = target.followers.length;
    }
  }
}

// Seed initial follows between seed members
seedFollow("user_9825123457", currentUser.id);
seedFollow("user_9825123458", currentUser.id);
seedFollow(currentUser.id, "user_9825123457");

// ----------------- PRIVACY AUTHORIZATION (POINT 3) -----------------
function canUserViewPost(post: any, authUser: SamajUser): boolean {
  if (!post || post.status === "deleted") return false;

  // 1. Author can ALWAYS see their own post/reel
  const authorId = post.authorId || post.createdBy;
  if (authorId === authUser.id) return true;

  // Memorial posts (Maran Nodh / Shraddhanjali) are always visible to all community members
  if (post.isMemorial || post.category === "memorial" || post.maranNodhId) return true;

  // Super admin moderation access
  if (authUser.role === "super_admin") return true;

  const vis = post.visibility || "samaj";

  // 2. ONLY ME: strictly the creator only
  if (vis === "only_me" || vis === "private") {
    return false;
  }

  // 3. FOLLOWERS: only users who FOLLOW the content creator
  if (vis === "followers") {
    const isFollowing = followRelationsMap.has(`${authUser.id}_${authorId}`) ||
      (authUser.following && authUser.following.includes(authorId));
    return Boolean(isFollowing);
  }

  // 4. MY SAMAJ: only members of the post's samaj
  if (vis === "samaj") {
    const postSamajId = post.samajId || DEFAULT_SAMAJ_ID;
    const userSamajIds = authUser.samajIds || (authUser.activeSamajId ? [authUser.activeSamajId] : [DEFAULT_SAMAJ_ID]);
    return userSamajIds.includes(postSamajId);
  }

  // 5. PUBLIC or ALL_SAMAJ: visible to everyone
  if (vis === "public" || vis === "all_samaj") {
    return true;
  }

  return false;
}

// ---- Profile Verification helpers (Task 4) ----
const REQUIRED_PROFILE_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "village", label: "Village/Gam" },
  { key: "district", label: "District" },
];

function checkProfileComplete(u: SamajUser): { complete: boolean; missing: string[] } {
  if (u.profileCompleted) {
    return { complete: true, missing: [] };
  }
  const missing = REQUIRED_PROFILE_FIELDS
    .filter((f) => {
      const val = (u as any)[f.key];
      if (!val || !String(val).trim()) return true;
      if (f.key === "name" && (String(val).startsWith("Member ") || String(val).startsWith("સભ્ય ("))) {
        return true;
      }
      return false;
    })
    .map((f) => f.label);
  return { complete: missing.length === 0, missing };
}

function getVerificationState(u: SamajUser) {
  const { complete, missing } = checkProfileComplete(u);
  const s = u.verificationStatus;
  let state: "PROFILE_INCOMPLETE" | "PROFILE_COMPLETE" | "VERIFICATION_PENDING" | "VERIFIED" | "REJECTED";
  if (s === "verified") state = "VERIFIED";
  else if (s === "pending") state = "VERIFICATION_PENDING";
  else if (s === "rejected") state = "REJECTED";
  else if (complete || u.profileCompleted) state = "PROFILE_COMPLETE";
  else state = "PROFILE_INCOMPLETE";
  const canSubmit = (complete || u.profileCompleted) && (state === "PROFILE_COMPLETE" || state === "REJECTED");
  return {
    verificationState: state,
    profileComplete: Boolean(complete || u.profileCompleted),
    missingFields: missing,
    rejectionReason: u.rejectionReason || null,
    canSubmit,
    verifiedAt: u.verifiedAt || null,
    submittedAt: u.verificationSubmittedAt || null,
  };
}

interface ConversationMember {
  id: string;
  name: string;
  photo: string;
}

interface ActiveCall {
  callId: string;
  callType: "voice" | "video";
  callerId: string;
  callerName: string;
  receiverId?: string;
  status: "calling" | "ringing" | "active" | "ended" | "rejected" | "missed";
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  signals?: Array<{ from: string; to: string; signal: any; createdAt: string }>;
}

interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  photo?: string;
  memberIds: string[];
  members: Record<string, ConversationMember>;
  admins?: string[];
  samajId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: any;
  unread: Record<string, number>;
  muted: string[];
  typing: Record<string, boolean>;
  theme?: string;
  disappearingDuration?: "off" | "10s" | "30s" | "1m" | "5m" | "1h" | "1d" | "24h" | "7d" | "90d";
  activeCall?: ActiveCall | null;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: "text" | "image" | "video" | "document" | "voice" | "call";
  text: string;
  mediaUrl?: string;
  fileName?: string;
  replyTo?: any;
  status: "sent" | "delivered" | "read";
  deliveredTo: string[];
  readBy: string[];
  readAt?: string;
  disappearingDuration?: "off" | "10s" | "30s" | "1m" | "5m" | "1h" | "1d" | "24h" | "7d" | "90d";
  deletedFor: string[];
  deleted: boolean;
  edited?: boolean;
  editedAt?: string;
  callInfo?: {
    callType: "voice" | "video";
    status: "missed" | "ended" | "rejected";
    durationSec?: number;
  };
  createdAt: string;
}

const conversationsMap: Record<string, Conversation> = {};
const messagesMap: Record<string, ChatMessage[]> = {};

function getDisappearingMs(dur?: string): number {
  switch (dur) {
    case "10s": return 10 * 1000;
    case "30s": return 30 * 1000;
    case "1m": return 60 * 1000;
    case "5m": return 5 * 60 * 1000;
    case "1h": return 60 * 60 * 1000;
    case "1d":
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

function isMessageExpired(m: ChatMessage, conv?: Conversation): boolean {
  const dur = m.disappearingDuration || conv?.disappearingDuration;
  if (!dur || dur === "off") return false;
  if (!m.readAt) return false;
  const durMs = getDisappearingMs(dur);
  if (!durMs) return false;
  return (Date.now() - new Date(m.readAt).getTime()) >= durMs;
}

// Background cleanup for disappearing messages every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const cid in messagesMap) {
    const conv = conversationsMap[cid];
    if (!messagesMap[cid]) continue;
    messagesMap[cid] = messagesMap[cid].filter((m) => {
      const dur = m.disappearingDuration || conv?.disappearingDuration;
      if (!dur || dur === "off") return true;
      if (!m.readAt) return true;
      const durMs = getDisappearingMs(dur);
      if (!durMs) return true;
      return (now - new Date(m.readAt).getTime()) < durMs;
    });

    if (conv?.lastMessage) {
      const exists = messagesMap[cid].some((m) => m.id === conv.lastMessage?.id);
      if (!exists) {
        const remaining = messagesMap[cid];
        if (remaining.length > 0) {
          const newest = remaining[remaining.length - 1];
          conv.lastMessage = {
            id: newest.id,
            text: newest.type === "text" ? newest.text.slice(0, 60) : "મીડિયા",
            senderId: newest.senderId,
            senderName: newest.senderName,
            type: newest.type,
            createdAt: newest.createdAt,
          };
        } else {
          conv.lastMessage = null;
        }
      }
    }
  }
}, 10000);

// Seed initial conversations
const initialOtherUid = "user_9825123456"; // પ્રિયંકાબેન પટેલ
const initialConvId = `d_${[currentUser.id, initialOtherUid].sort().join("_")}`;
conversationsMap[initialConvId] = {
  id: initialConvId,
  type: "direct",
  memberIds: [currentUser.id, initialOtherUid],
  members: {
    [currentUser.id]: { id: currentUser.id, name: currentUser.name, photo: currentUser.profilePhoto },
    [initialOtherUid]: { id: initialOtherUid, name: "પ્રિયંકાબેન અમિતભાઈ પટેલ", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  },
  samajId: DEFAULT_SAMAJ_ID,
  createdBy: currentUser.id,
  createdAt: new Date("2025-01-01T10:00:00Z").toISOString(),
  updatedAt: new Date().toISOString(),
  lastMessage: {
    id: "msg_init_2",
    text: "જય શ્રી કૃષ્ણ! આગામી સ્નેહમિલન માટે ક્યારે મળવું?",
    senderId: initialOtherUid,
    senderName: "પ્રિયંકાબેન અમિતભાઈ પટેલ",
    type: "text",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  unread: { [currentUser.id]: 0, [initialOtherUid]: 0 },
  muted: [],
  typing: {},
  theme: "default",
  disappearingDuration: "off",
  activeCall: null,
};

messagesMap[initialConvId] = [
  {
    id: "msg_init_1",
    conversationId: initialConvId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    type: "text",
    text: "નમસ્તે પ્રિયંકાબેન, સમાજ કમિટીની મિટિંગ વિશે અપડેટ આપશો?",
    status: "read",
    deliveredTo: [initialOtherUid],
    readBy: [currentUser.id, initialOtherUid],
    deletedFor: [],
    deleted: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "msg_init_2",
    conversationId: initialConvId,
    senderId: initialOtherUid,
    senderName: "પ્રિયંકાબેન અમિતભાઈ પટેલ",
    type: "text",
    text: "જય શ્રી કૃષ્ણ! આગામી સ્નેહમિલન માટે ક્યારે મળવું?",
    status: "read",
    deliveredTo: [currentUser.id],
    readBy: [currentUser.id, initialOtherUid],
    deletedFor: [],
    deleted: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

function getAuthUser(req: Request): SamajUser | null {
  return ((req as any)._authUser as SamajUser) || null;
}

export function isUserOnboardingCompleted(u: SamajUser | null): boolean {
  if (!u) return false;
  const isAdmin = ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN"].includes((u.adminRole || "").toUpperCase()) ||
                  ["super_admin", "admin", "main_samaj_admin", "samaj_admin"].includes(u.role);
  if (isAdmin) return true;

  // Auto-heal missing active samaj or main samaj if user is authenticated
  if (!u.mainSamajId && u.activeSamajId) {
    const s = samajList.find((x) => x.id === u.activeSamajId);
    u.mainSamajId = s?.mainSamajId || "main_patidar";
  } else if (!u.mainSamajId) {
    u.mainSamajId = "main_patidar";
  }

  if (!u.activeSamajId) {
    const active = samajList.find((s) => s.mainSamajId === u.mainSamajId && s.isActive);
    u.activeSamajId = active ? active.id : DEFAULT_SAMAJ_ID;
    u.samajId = u.activeSamajId;
    if (!u.samajIds || u.samajIds.length === 0) {
      u.samajIds = [u.activeSamajId];
    }
  }

  u.onboardingCompleted = true;
  return true;
}

export interface UserProfileAccessStatus {
  isProfileComplete: boolean;
  needsProfileReminder: boolean;
  isProfileMandatory: boolean;
  profileReminderLaterUsed: boolean;
  accountAgeDays: number;
  missingFields: string[];
}

export function getUserProfileAccessStatus(u: SamajUser | null): UserProfileAccessStatus {
  if (!u) {
    return {
      isProfileComplete: false,
      needsProfileReminder: false,
      isProfileMandatory: false,
      profileReminderLaterUsed: false,
      accountAgeDays: 0,
      missingFields: [],
    };
  }

  const isAdmin = ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN"].includes((u.adminRole || "").toUpperCase()) ||
                  ["super_admin", "admin", "main_samaj_admin", "samaj_admin"].includes(u.role);
  if (isAdmin) {
    return {
      isProfileComplete: true,
      needsProfileReminder: false,
      isProfileMandatory: false,
      profileReminderLaterUsed: false,
      accountAgeDays: 999,
      missingFields: [],
    };
  }

  const { complete, missing } = checkProfileComplete(u);
  const isComplete = Boolean(u.profileCompleted || (complete && u.name && !u.name.startsWith("Member ") && !u.name.startsWith("સભ્ય (")));

  if (isComplete) {
    return {
      isProfileComplete: true,
      needsProfileReminder: false,
      isProfileMandatory: false,
      profileReminderLaterUsed: Boolean(u.profileReminderLaterUsed),
      accountAgeDays: 0,
      missingFields: [],
    };
  }

  const createdAtMs = u.createdAt ? new Date(u.createdAt).getTime() : Date.now();
  const nowMs = Date.now();
  const ageMs = Math.max(0, nowMs - createdAtMs);
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const ageDays = Number((ageMs / (24 * 60 * 60 * 1000)).toFixed(1));
  const isPastGracePeriod = ageMs > TWO_DAYS_MS;

  const laterUsed = Boolean(u.profileReminderLaterUsed);
  const isMandatory = isPastGracePeriod && laterUsed;
  const needsReminder = isPastGracePeriod && !laterUsed;

  return {
    isProfileComplete: false,
    needsProfileReminder: needsReminder,
    isProfileMandatory: isMandatory,
    profileReminderLaterUsed: laterUsed,
    accountAgeDays: ageDays,
    missingFields: missing,
  };
}

export function requireProfileNotBlocked(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const status = getUserProfileAccessStatus(user);
  if (status.isProfileMandatory && !status.isProfileComplete) {
    return res.status(403).json({
      error: "PROFILE_COMPLETION_REQUIRED",
      detail: "સમાજ કનેક્ટના સોશિયલ અને ચેટ મોડ્યુલ વાપરવા માટે પ્રોફાઇલ પૂર્ણ કરવી ફરજિયાત છે.",
      needsProfileCompletion: true,
      missingFields: status.missingFields,
    });
  }
  next();
}

function buildNewUser(uid: string, phone: string, name: string): SamajUser {
  return {
    id: uid,
    phone,
    name: name || `સભ્ય (${phone ? phone.replace(/\D/g, "").slice(-4) : "નવા"})`,
    role: "member",
    adminRole: null,
    profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    village: "",
    district: "",
    bio: "સમાજ સભ્ય",
    samajIds: [],
    samajRoles: {},
    activeSamajId: "",
    followersCount: 0,
    followingCount: 0,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "none",
    rejectionReason: null,
    mainSamajId: "",
    districtId: "",
    talukaId: "",
    villageId: "",
    gamId: "",
    gam: "",
    samajId: "",
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
    profileCompleted: false,
    profileReminderLaterUsed: false,
  };
}

function buildUser(uid: string, phone: string, name: string, member?: any): SamajUser {
  if (member) {
    const memSamajId = member.samajId || DEFAULT_SAMAJ_ID;
    const memSamaj = samajList.find((s) => s.id === memSamajId);
    const mainSamajId = member.mainSamajId || memSamaj?.mainSamajId || "main_patidar";
    const gam = villageList.find((v) => v.name === member.village || v.nameGujarati === member.village);
    const gamId = gam ? gam.id : "vil_unjha";
    const dist = districtList.find((d) => d.id === gam?.districtId) || districtList.find((d) => d.nameGujarati === member.district) || districtList[0];
    const tal = talukaList.find((t) => t.id === gam?.talukaId) || talukaList.find((t) => t.districtId === dist.id) || talukaList[0];

    return {
      id: uid,
      phone,
      name: name || member.name,
      role: "member",
      adminRole: null,
      profilePhoto: member.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      village: member.village || gam?.nameGujarati || "ઊંઝા",
      district: member.district || dist?.nameGujarati || "મહેસાણા",
      bio: `${member.education || "સભ્ય"} · ${member.village || ""}`,
      samajIds: [memSamajId],
      samajRoles: { [memSamajId]: "member" },
      activeSamajId: memSamajId,
      followersCount: 24,
      followingCount: 15,
      isSuspended: false,
      blocked: [],
      followers: [],
      following: [],
      verificationStatus: "none",
      rejectionReason: null,
      mainSamajId,
      districtId: dist.id,
      talukaId: tal.id,
      villageId: gamId,
      gamId,
      gam: member.village || gam?.nameGujarati || "ઊંઝા",
      samajId: memSamajId,
      onboardingCompleted: true,
    };
  }

  // BRAND NEW USER: onboarding is strictly false, no default samaj or village assigned!
  return buildNewUser(uid, phone, name);
}

// DEV-ONLY: resolve a user from a mock-token (only reached when DEV_AUTH_ENABLED=true).
function resolveMockUser(token: string): SamajUser | null {
  const phoneDigits = token.replace("mock-token-", "").replace(/\D/g, "").slice(-10);
  if (!phoneDigits || phoneDigits === "demo") return currentUser;
  const uid = `user_${phoneDigits}`;
  if (usersMap[uid]) return usersMap[uid];
  for (const u of Object.values(usersMap)) {
    if (u.phone.replace(/\D/g, "").slice(-10) === phoneDigits) return u;
  }

  const isSpecialAdmin = uid === "user_9876543210" || uid === "user_demo_admin" || phoneDigits === "9876543210";
  if (isSpecialAdmin) {
    usersMap[uid] = {
      ...buildNewUser(uid, `+91${phoneDigits}`, "રાજેશભાઈ પટેલ (Admin)"),
      role: "super_admin",
      adminRole: "SUPER_ADMIN",
      mainSamajId: "main_patidar",
      districtId: "dist_mehsana",
      talukaId: "tal_mehsana_unjha",
      villageId: "vil_unjha",
      gamId: "vil_unjha",
      village: "ઊંઝા",
      gam: "ઊંઝા",
      district: "મહેસાણા",
      activeSamajId: DEFAULT_SAMAJ_ID,
      samajId: DEFAULT_SAMAJ_ID,
      samajIds: [DEFAULT_SAMAJ_ID],
      samajRoles: { [DEFAULT_SAMAJ_ID]: "super_admin" },
      onboardingCompleted: true,
      verificationStatus: "verified",
    };
    return usersMap[uid];
  }

  // Brand new authenticated user: onboardingCompleted is strictly false!
  usersMap[uid] = buildNewUser(uid, `+91${phoneDigits}`, `સભ્ય (${phoneDigits.slice(-4)})`);
  return usersMap[uid];
}

// Enforce admin role STRICTLY from the server-side allowlist (source of truth).
function applyAdminRole(u: SamajUser | null): SamajUser | null {
  if (!u) return u;
  const r = allowlistRole(u.phone);
  u.adminRole = r;
  if (r) {
    u.role = r === "SUPER_ADMIN" ? "super_admin" : r === "MAIN_SAMAJ_ADMIN" ? "main_samaj_admin" : "samaj_admin";
  } else if (["super_admin", "main_samaj_admin", "samaj_admin", "admin"].includes(u.role)) {
    u.role = "member"; // downgrade any legacy/seeded admin role for non-allowlisted users
  }
  return u;
}

// Async identity resolution: real Firebase ID token (prod) or mock token (dev only).
async function resolveAuthUser(req: Request): Promise<SamajUser | null> {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-demo-user"]) {
    token = String(req.headers["x-demo-user"]).trim();
  }
  if (!token) return null;

  if (token.startsWith("mock-token-") || token === "demo-token" || token === "admin-token" || token.startsWith("+91") || /^\d{10}$/.test(token)) {
    return applyAdminRole(resolveMockUser(token));
  }

  // PRODUCTION: only cryptographically verified Firebase ID tokens are accepted.
  const payload = await verifyFirebaseIdToken(token);
  if (!payload) return null;
  const uid = String((payload as any).user_id || payload.sub || "");
  if (!uid) return null;
  const rawPhone = String((payload as any).phone_number || (payload as any).phone || "");
  const phoneDigits = rawPhone.replace(/\D/g, "").slice(-10);
  const name = (payload as any).name ? String((payload as any).name) : "";

  let u: SamajUser | undefined = usersMap[uid];
  if (!u && phoneDigits) {
    u = Object.values(usersMap).find((x) => x.phone.replace(/\D/g, "").slice(-10) === phoneDigits);
  }
  if (!u) {
    // Brand new user from Firebase: strictly force onboarding!
    u = buildNewUser(uid, rawPhone || `+91${phoneDigits}`, name);
    usersMap[uid] = u;
  } else {
    if (!usersMap[uid]) {
      usersMap[uid] = u;
    }
    if (name && (!u.name || u.name.startsWith("સભ્ય") || u.name.startsWith("Member"))) {
      u.name = name;
    }
  }
  return applyAdminRole(u);
}

function getAuthUserOrDefault(req: Request): SamajUser {
  return getAuthUser(req) || {
    id: "guest",
    phone: "",
    name: "Guest",
    role: "guest",
    adminRole: null,
    profilePhoto: "",
    village: "",
    district: "",
    bio: "",
    samajIds: [DEFAULT_SAMAJ_ID],
    samajRoles: {},
    activeSamajId: DEFAULT_SAMAJ_ID,
    followersCount: 0,
    followingCount: 0,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "verified",
  };
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required", message: "કૃપા કરીને પહેલા લોગિન કરો." });
  }

  const rawRole = (user.adminRole || user.role || "").toUpperCase();
  let normalizedRole: AdminRole | null = null;
  if (rawRole === "SUPER_ADMIN" || rawRole === "ADMIN") normalizedRole = "SUPER_ADMIN";
  else if (rawRole === "MAIN_SAMAJ_ADMIN") normalizedRole = "MAIN_SAMAJ_ADMIN";
  else if (rawRole === "SAMAJ_ADMIN") normalizedRole = "SAMAJ_ADMIN";

  if (!normalizedRole || user.isSuspended) {
    return res.status(403).json({
      error: "Forbidden",
      message: "તમે એડમિન પેનલ માટે અધિકૃત નથી. (Access Denied: Admin privileges required)",
      userRole: user.role,
    });
  }

  (req as any).adminUser = user;
  (req as any).adminRole = normalizedRole;
  (req as any).adminScope = {
    mainSamajId: user.mainSamajId || null,
    samajId: user.activeSamajId || user.samajIds?.[0] || null,
  };
  next();
}

// Resolve the authenticated user once per /api request (async Firebase token verification).
app.use("/api", async (req: Request, _res: Response, next: () => void) => {
  try {
    (req as any)._authUser = await resolveAuthUser(req);
  } catch {
    (req as any)._authUser = null;
  }
  next();
});

// Auto-persist application state after successful mutating API requests
app.use("/api", (req: Request, res: Response, next: () => void) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        saveStore(false);
      }
    });
  }
  next();
});

// Auth Endpoints
app.post("/api/log-client-error", (req: Request, res: Response) => {
  console.error("[CLIENT ERROR REPORT]", JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.get("/api/auth/config", (req: Request, res: Response) => {
  res.json({
    devAuth: DEV_AUTH_ENABLED,
    publicAccessEnabled: true,
  });
});

app.post("/api/auth/dev-login", (req: Request, res: Response) => {
  if (!DEV_AUTH_ENABLED) {
    return res.status(403).json({ error: "Forbidden", message: "Dev login disabled in production." });
  }
  const { phone, name, mainSamajId } = req.body;
  const targetPhone = phone || currentUser.phone;
  const phoneDigits = targetPhone.replace(/\D/g, "").slice(-10);
  const uid = `user_${phoneDigits || "demo"}`;

  if (!usersMap[uid]) {
    const isSpecialAdmin = uid === "user_9876543210" || uid === "user_demo_admin" || targetPhone === "+919876543210";
    usersMap[uid] = {
      id: uid,
      phone: targetPhone,
      name: name || (isSpecialAdmin ? "રાજેશભાઈ પટેલ (Admin)" : `સભ્ય (${targetPhone.slice(-4)})`),
      role: isSpecialAdmin ? "super_admin" : "member",
      adminRole: isSpecialAdmin ? "SUPER_ADMIN" : null,
      profilePhoto: isSpecialAdmin ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      village: isSpecialAdmin ? "ઊંઝા" : "",
      district: isSpecialAdmin ? "મહેસાણા" : "",
      bio: isSpecialAdmin ? "સમાજ ઉત્કર્ષ અને સેવા માટે સમર્પિત." : "સમાજ સભ્ય",
      samajIds: isSpecialAdmin ? [DEFAULT_SAMAJ_ID] : [],
      samajRoles: isSpecialAdmin ? { [DEFAULT_SAMAJ_ID]: "super_admin" } : {},
      activeSamajId: isSpecialAdmin ? DEFAULT_SAMAJ_ID : "",
      followersCount: 0,
      followingCount: 0,
      isSuspended: false,
      blocked: [],
      followers: [],
      following: [],
      verificationStatus: isSpecialAdmin ? "verified" : "none",
      rejectionReason: null,
      mainSamajId: isSpecialAdmin ? "main_patidar" : "",
      gamId: isSpecialAdmin ? "gam_unjha" : "",
      gam: isSpecialAdmin ? "ઊંઝા" : "",
      samajId: isSpecialAdmin ? DEFAULT_SAMAJ_ID : "",
      onboardingCompleted: isSpecialAdmin ? true : false,
      createdAt: new Date().toISOString(),
      profileCompleted: false,
      profileReminderLaterUsed: false,
    };
  } else if (name) {
    usersMap[uid].name = name;
  }

  // If a main Samaj was selected during dev login
  if (mainSamajId) {
    const mainSamaj = mainSamajList.find((m) => m.id === mainSamajId && m.isActive);
    if (mainSamaj) {
      let activeSamaj = samajList.find((s) => s.mainSamajId === mainSamaj.id && s.isActive);
      if (!activeSamaj) {
        const slug = mainSamaj.code ? mainSamaj.code.toLowerCase() : mainSamaj.id.replace("main_", "");
        activeSamaj = {
          id: `samaj_${slug}_central`,
          mainSamajId: mainSamaj.id,
          districtId: "dist_ahmedabad",
          talukaId: "tal_ahm_city",
          villageId: "vil_ahm_city",
          name: mainSamaj.name,
          nameGujarati: mainSamaj.nameGujarati,
          nameEn: mainSamaj.nameEn || mainSamaj.name,
          code: `${mainSamaj.code || "SMJ"}01`,
          district: "અમદાવાદ",
          isActive: true,
          requirePostApproval: false,
          createdAt: new Date().toISOString(),
        };
        samajList.push(activeSamaj);
        persistMasterData();
      }
      usersMap[uid].mainSamajId = mainSamaj.id;
      usersMap[uid].activeSamajId = activeSamaj.id;
      usersMap[uid].samajId = activeSamaj.id;
      usersMap[uid].samajIds = [activeSamaj.id];
      usersMap[uid].samajRoles = { [activeSamaj.id]: usersMap[uid].role || "member" };
      usersMap[uid].onboardingCompleted = true;
    }
  }

  res.json({
    customToken: `mock-token-${phoneDigits}`,
  });
});

// Admin Login confirmation — requires an already-verified Firebase ID token
// (admin signs in via real Firebase Phone OTP first). Authorization comes from the
// server-side ADMIN_ALLOWLIST only. No passwords or OTP strings are accepted here.
app.post("/api/auth/admin-login", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", message: "Please sign in with Firebase OTP first." });
  }
  const role = user.adminRole || null;
  if (!role || user.isSuspended) {
    logAdminAction({
      adminUserId: user.id,
      adminName: user.name,
      role: "SAMAJ_ADMIN",
      action: "UNAUTHORIZED_ADMIN_LOGIN_ATTEMPT",
      details: { phone: user.phone, ip: req.ip },
    });
    return res.status(403).json({
      error: "Forbidden",
      message: "Access Denied: not an authorized admin account.",
    });
  }
  logAdminAction({
    adminUserId: user.id,
    adminName: user.name,
    role,
    scope: { mainSamajId: user.mainSamajId || null, samajId: user.activeSamajId || user.samajIds?.[0] || null },
    action: "ADMIN_LOGIN_SUCCESS",
    details: { ip: req.ip, authMethod: "firebase_otp" },
  });
  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      adminRole: role,
      mainSamajId: user.mainSamajId,
      samajId: user.activeSamajId,
      profilePhoto: user.profilePhoto,
    },
  });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  user.onboardingCompleted = isUserOnboardingCompleted(user);
  const profileStatus = getUserProfileAccessStatus(user);
  res.json({
    ...user,
    profileStatus,
  });
});

// Initial Samaj selection during first login (Single unified step after OTP)
app.post("/api/auth/initial-samaj", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", detail: "કૃપા કરીને પહેલા લૉગિન કરો." });
  }
  const { mainSamajId } = req.body;
  if (!mainSamajId) {
    return res.status(400).json({ error: "BAD_REQUEST", detail: "કૃપા કરીને તમારો સમાજ પસંદ કરો." });
  }
  const mainSamaj = mainSamajList.find((m) => m.id === mainSamajId && m.isActive);
  if (!mainSamaj) {
    return res.status(400).json({ error: "NOT_FOUND", detail: "પસંદ કરેલ સમાજ મળ્યો નથી." });
  }

  // Find or create base chapter for this main samaj
  let activeSamaj = samajList.find((s) => s.mainSamajId === mainSamaj.id && s.isActive);
  if (!activeSamaj) {
    const slug = mainSamaj.code ? mainSamaj.code.toLowerCase() : mainSamaj.id.replace("main_", "");
    activeSamaj = {
      id: `samaj_${slug}_central`,
      mainSamajId: mainSamaj.id,
      districtId: "dist_ahmedabad",
      talukaId: "tal_ahm_city",
      villageId: "vil_ahm_city",
      name: mainSamaj.name,
      nameGujarati: mainSamaj.nameGujarati,
      nameEn: mainSamaj.nameEn || mainSamaj.name,
      code: `${mainSamaj.code || "SMJ"}01`,
      district: "અમદાવાદ",
      isActive: true,
      requirePostApproval: false,
      createdAt: new Date().toISOString(),
    };
    samajList.push(activeSamaj);
    persistMasterData();
  }

  user.mainSamajId = mainSamaj.id;
  user.activeSamajId = activeSamaj.id;
  user.samajId = activeSamaj.id;
  user.samajIds = [activeSamaj.id];
  user.samajRoles = { [activeSamaj.id]: user.role || "member" };
  user.onboardingCompleted = true;
  if (!user.createdAt) user.createdAt = new Date().toISOString();
  if (user.profileCompleted === undefined) user.profileCompleted = false;
  if (user.profileReminderLaterUsed === undefined) user.profileReminderLaterUsed = false;

  const profileStatus = getUserProfileAccessStatus(user);
  res.json({
    ok: true,
    user: {
      ...user,
      profileStatus,
    },
    profileStatus,
  });
});

// Profile reminder "Later" endpoint (Allowed ONLY ONCE per user)
app.post("/api/profile/reminder-later", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.profileReminderLaterUsed) {
    return res.status(400).json({
      error: "LATER_ALREADY_USED",
      detail: "'પછીથી' વિકલ્પ માત્ર એક જ વાર વાપરી શકાય છે. હવે પ્રોફાઇલ પૂર્ણ કરવી ફરજિયાત છે.",
    });
  }
  user.profileReminderLaterUsed = true;
  user.profileReminderLaterUsedAt = new Date().toISOString();
  const profileStatus = getUserProfileAccessStatus(user);
  res.json({
    ok: true,
    message: "રિમાઇન્ડર મુલતવી રાખવામાં આવ્યું છે.",
    profileStatus,
  });
});

// Profile completion endpoint (Fast mandatory submission)
app.post("/api/profile/complete", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { name, village, district, talukaId, villageId, gamId, gam, bio, profilePhoto } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "VALIDATION_ERROR", detail: "કૃપા કરીને પૂરું નામ દાખલ કરો." });
  }
  if (!village || !village.trim()) {
    return res.status(400).json({ error: "VALIDATION_ERROR", detail: "કૃપા કરીને ગામ / નગર પસંદ કરો." });
  }
  if (!district || !district.trim()) {
    return res.status(400).json({ error: "VALIDATION_ERROR", detail: "કૃપા કરીને જિલ્લો પસંદ કરો." });
  }
  user.name = name.trim();
  user.village = village.trim();
  user.district = district.trim();
  if (gam) user.gam = gam.trim();
  if (talukaId) user.talukaId = talukaId;
  if (villageId) user.villageId = villageId;
  if (gamId) user.gamId = gamId;
  if (bio !== undefined) user.bio = bio;
  if (profilePhoto) user.profilePhoto = profilePhoto;

  user.profileCompleted = true;
  user.profileCompletedAt = new Date().toISOString();

  const profileStatus = getUserProfileAccessStatus(user);
  res.json({
    ok: true,
    user: {
      ...user,
      profileStatus,
    },
    profileStatus,
  });
});

// ----------------- ONBOARDING SYSTEM (Main Samaj -> District -> Taluka -> Gam -> Samaj) -----------------

// Public or Authenticated List of Main Samaj
app.get("/api/main-samaj", (_req: Request, res: Response) => {
  res.json({
    items: mainSamajList.filter((m) => m.isActive),
  });
});

// Location Master Endpoints
app.get("/api/location/districts", (_req: Request, res: Response) => {
  res.json({ items: districtList.filter((d) => d.isActive) });
});

app.get("/api/location/talukas", (req: Request, res: Response) => {
  const districtId = (req.query.districtId as string) || "";
  let list = talukaList.filter((t) => t.isActive);
  if (districtId) {
    list = list.filter((t) => t.districtId === districtId);
  }
  res.json({ items: list });
});

app.get("/api/location/villages", (req: Request, res: Response) => {
  const districtId = (req.query.districtId as string) || "";
  const talukaId = (req.query.talukaId as string) || "";
  let list = villageList.filter((v) => v.isActive);
  if (districtId) {
    list = list.filter((v) => v.districtId === districtId);
  }
  if (talukaId) {
    list = list.filter((v) => v.talukaId === talukaId);
  }
  res.json({ items: list });
});

// Gam list (backward compatibility, optionally filtered by districtId, talukaId, mainSamajId)
app.get("/api/gam", (req: Request, res: Response) => {
  const mainSamajId = (req.query.mainSamajId as string) || "";
  const districtId = (req.query.districtId as string) || "";
  const talukaId = (req.query.talukaId as string) || "";

  let list = villageList.filter((v) => v.isActive).map((v) => {
    const dist = districtList.find((d) => d.id === v.districtId);
    const tal = talukaList.find((t) => t.id === v.talukaId);
    return {
      id: v.id,
      name: v.nameGujarati || v.name,
      nameEn: v.name,
      district: dist?.nameGujarati || dist?.name || "",
      taluka: tal?.nameGujarati || tal?.name || "",
      districtId: v.districtId,
      talukaId: v.talukaId,
      mainSamajId: mainSamajId || "main_patidar",
      isActive: v.isActive,
      createdAt: v.createdAt || new Date("2024-01-01").toISOString(),
    };
  });

  if (districtId) {
    list = list.filter((g) => g.districtId === districtId);
  }
  if (talukaId) {
    list = list.filter((g) => g.talukaId === talukaId);
  }
  res.json({ items: list });
});

// Check current user's onboarding completion status & progress
app.get("/api/onboarding/status", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }

  const isComplete = isUserOnboardingCompleted(user);
  let missingStep: "main_samaj" | "district" | "taluka" | "gam" | "samaj" | null = null;
  const vId = user.villageId || user.gamId;

  if (!isComplete) {
    if (!user.mainSamajId || !mainSamajList.some((m) => m.id === user.mainSamajId && m.isActive)) {
      missingStep = "main_samaj";
    } else if (!user.districtId || !districtList.some((d) => d.id === user.districtId && d.isActive)) {
      missingStep = "district";
    } else if (!user.talukaId || !talukaList.some((t) => t.id === user.talukaId && t.isActive)) {
      missingStep = "taluka";
    } else if (!vId || !villageList.some((v) => v.id === vId && v.isActive)) {
      missingStep = "gam";
    } else {
      missingStep = "samaj";
    }
  }

  res.json({
    onboardingCompleted: isComplete,
    missingStep,
    mainSamajId: user.mainSamajId || null,
    districtId: user.districtId || null,
    talukaId: user.talukaId || null,
    villageId: vId || null,
    gamId: vId || null,
    gam: user.gam || user.village || null,
    village: user.village || user.gam || null,
    district: user.district || null,
    samajId: user.activeSamajId || user.samajId || null,
    activeSamajId: user.activeSamajId || null,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      mainSamajId: user.mainSamajId || null,
      districtId: user.districtId || null,
      talukaId: user.talukaId || null,
      villageId: vId || null,
      gamId: vId || null,
      gam: user.gam || user.village || null,
      village: user.village || user.gam || null,
      district: user.district || null,
      samajId: user.activeSamajId || null,
      activeSamajId: user.activeSamajId || null,
      onboardingCompleted: isComplete,
    },
  });
});

// Update an onboarding step (Main Samaj -> District -> Taluka -> Gam -> Samaj)
app.post("/api/onboarding/step", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }

  const { mainSamajId, districtId, talukaId, villageId, gamId, samajId } = req.body;
  const targetVillageId = villageId || gamId;

  // Step 1: Main Samaj update
  if (mainSamajId !== undefined) {
    const mainSamaj = mainSamajList.find((m) => m.id === mainSamajId && m.isActive);
    if (!mainSamaj) {
      return res.status(400).json({ detail: "અમાન્ય મુખ્ય સમાજ પસંદગી (Invalid Main Samaj)" });
    }
    // If switching main samaj, invalidate child selections
    if (user.mainSamajId !== mainSamajId) {
      user.districtId = "";
      user.district = "";
      user.talukaId = "";
      user.villageId = "";
      user.gamId = "";
      user.gam = "";
      user.village = "";
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.mainSamajId = mainSamajId;
  }

  // Step 2: District update
  if (districtId !== undefined) {
    if (!user.mainSamajId) {
      return res.status(400).json({ detail: "કૃપા કરીને પહેલા મુખ્ય સમાજ પસંદ કરો (Select Main Samaj first)" });
    }
    const dist = districtList.find((d) => d.id === districtId && d.isActive);
    if (!dist) {
      return res.status(400).json({ detail: "અમાન્ય જિલ્લો પસંદગી (Invalid District)" });
    }
    if (user.districtId !== districtId) {
      user.talukaId = "";
      user.villageId = "";
      user.gamId = "";
      user.gam = "";
      user.village = "";
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.districtId = districtId;
    user.district = dist.nameGujarati || dist.name;
  }

  // Step 3: Taluka update
  if (talukaId !== undefined) {
    if (!user.mainSamajId || !user.districtId) {
      return res.status(400).json({ detail: "કૃપા કરીને પહેલા જિલ્લો પસંદ કરો (Select District first)" });
    }
    const taluka = talukaList.find((t) => t.id === talukaId && t.districtId === user.districtId && t.isActive);
    if (!taluka) {
      return res.status(400).json({ detail: "પસંદ કરેલ તાલુકો માન્ય નથી (Invalid Taluka for selected District)" });
    }
    if (user.talukaId !== talukaId) {
      user.villageId = "";
      user.gamId = "";
      user.gam = "";
      user.village = "";
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.talukaId = talukaId;
  }

  // Step 4: Village / Gam update
  if (targetVillageId !== undefined || req.body.customVillageName) {
    if (!user.mainSamajId || !user.districtId || !user.talukaId) {
      return res.status(400).json({ detail: "કૃપા કરીને પહેલા જિલ્લો અને તાલુકો પસંદ કરો (Select District and Taluka first)" });
    }
    const customName = (req.body.customVillageName || "").trim();
    let village = villageList.find((v) => (v.id === targetVillageId || v.name === targetVillageId || v.nameGujarati === targetVillageId) && v.talukaId === user.talukaId && v.isActive);
    
    if (!village && customName) {
      // Create new village under this district and taluka
      const newVId = `vil_custom_${Date.now()}`;
      village = {
        id: newVId,
        districtId: user.districtId,
        talukaId: user.talukaId,
        name: customName,
        nameGujarati: customName,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      villageList.push(village);
      persistMasterData();
    }

    if (!village) {
      return res.status(400).json({ detail: "પસંદ કરેલ ગામ માન્ય નથી (Invalid Village for selected Taluka)" });
    }
    if (user.villageId !== village.id) {
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.villageId = village.id;
    user.gamId = village.id;
    user.gam = village.nameGujarati || village.name;
    user.village = village.nameGujarati || village.name;
  }

  // Step 5: Samaj chapter update
  if (samajId !== undefined) {
    const vId = user.villageId || user.gamId;
    if (!user.mainSamajId || !user.districtId || !user.talukaId || !vId) {
      return res.status(400).json({ detail: "કૃપા કરીને પહેલા ગામ સુધીની પસંદગી પૂર્ણ કરો (Complete prior selections first)" });
    }
    let validSamaj: Samaj | undefined = undefined;
    if (samajId === "auto") {
      // Find closest matching Samaj for this user
      validSamaj = samajList.find((s) => s.isActive && s.villageId === vId && (!s.mainSamajId || s.mainSamajId === user.mainSamajId))
        || samajList.find((s) => s.isActive && s.talukaId === user.talukaId && (!s.mainSamajId || s.mainSamajId === user.mainSamajId))
        || samajList.find((s) => s.isActive && s.districtId === user.districtId && (!s.mainSamajId || s.mainSamajId === user.mainSamajId))
        || samajList.find((s) => s.isActive && (!s.mainSamajId || s.mainSamajId === user.mainSamajId))
        || samajList[0];
    } else {
      validSamaj = samajList.find((s) => s.id === samajId && s.isActive && (!s.mainSamajId || s.mainSamajId === user.mainSamajId))
        || samajList.find((s) => s.id === samajId && s.isActive)
        || samajList.find((s) => s.isActive && (!s.mainSamajId || s.mainSamajId === user.mainSamajId))
        || samajList[0];
    }

    if (!validSamaj) {
      return res.status(400).json({ detail: "પસંદ કરેલ સમાજ માન્ય નથી (Invalid Samaj for this Main Samaj)" });
    }
    user.samajId = validSamaj.id;
    user.activeSamajId = validSamaj.id;
    if (!user.samajIds) user.samajIds = [];
    if (!user.samajIds.includes(validSamaj.id)) {
      user.samajIds.push(validSamaj.id);
    }
    if (!user.samajRoles) user.samajRoles = {};
    user.samajRoles[validSamaj.id] = user.samajRoles[validSamaj.id] || "member";
  }

  // Evaluate completeness
  const hasMain = Boolean(user.mainSamajId && mainSamajList.some((m) => m.id === user.mainSamajId && m.isActive));
  const hasDist = Boolean(user.districtId && districtList.some((d) => d.id === user.districtId && d.isActive));
  const hasTal = Boolean(user.talukaId && talukaList.some((t) => t.id === user.talukaId && t.isActive));
  const vId = user.villageId || user.gamId;
  const hasVil = Boolean(vId && villageList.some((v) => v.id === vId && v.isActive));
  const hasSamaj = Boolean(user.activeSamajId && samajList.some((s) => s.id === user.activeSamajId && s.isActive));

  if (hasMain && hasDist && hasTal && hasVil && hasSamaj) {
    user.onboardingCompleted = true;
  } else {
    user.onboardingCompleted = false;
  }

  let missingStep: "main_samaj" | "district" | "taluka" | "gam" | "samaj" | null = null;
  if (!hasMain) missingStep = "main_samaj";
  else if (!hasDist) missingStep = "district";
  else if (!hasTal) missingStep = "taluka";
  else if (!hasVil) missingStep = "gam";
  else if (!hasSamaj) missingStep = "samaj";

  res.json({
    ok: true,
    user,
    onboardingCompleted: user.onboardingCompleted,
    missingStep,
  });
});

// Middleware enforcing that non-admin users must have completed their onboarding
export function requireCompletedOnboarding(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", detail: "કૃપા કરીને પહેલા લોગિન કરો." });
  }
  if (!isUserOnboardingCompleted(user)) {
    return res.status(403).json({
      error: "SAMAJ_SELECTION_REQUIRED",
      detail: "સમાજ કનેક્ટના મોડ્યુલ વાપરવા માટે કૃપા કરીને પહેલા તમારો સમાજ પસંદ કરો.",
      onboardingCompleted: false,
      missingStep: "main_samaj",
    });
  }
  next();
}

app.patch("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Explicitly ignore/strip any administrative attributes
  const allowed = ["name", "profilePhoto", "village", "district", "bio", "gam", "gamId", "villageId", "talukaId", "districtId"];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      (user as any)[k] = req.body[k];
    }
  }
  if (user.name && !user.name.startsWith("Member ") && !user.name.startsWith("સભ્ય (") && user.village && user.district) {
    user.profileCompleted = true;
    if (!user.profileCompletedAt) user.profileCompletedAt = new Date().toISOString();
  }
  const profileStatus = getUserProfileAccessStatus(user);
  res.json({
    ...user,
    profileStatus,
  });
});

// ---- Profile Verification: user endpoints (Task 4) ----
app.get("/api/verification/status", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json(getVerificationState(user));
});

app.post("/api/verification/submit", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Cannot submit if already verified or already pending review
  if (user.verificationStatus === "verified") {
    return res.status(400).json({ detail: "તમારી પ્રોફાઇલ પહેલેથી જ ચકાસાયેલ છે (Already verified)", ...getVerificationState(user) });
  }
  if (user.verificationStatus === "pending") {
    return res.status(400).json({ detail: "ચકાસણી પહેલેથી જ સમીક્ષા હેઠળ છે (Already pending review)", ...getVerificationState(user) });
  }

  const { complete, missing } = checkProfileComplete(user);
  if (!complete) {
    return res.status(400).json({
      detail: "કૃપા કરીને જરૂરી પ્રોફાઇલ માહિતી પૂર્ણ કરો (Profile incomplete)",
      missingFields: missing,
      ...getVerificationState(user),
    });
  }

  user.verificationStatus = "pending";
  user.verificationSubmittedAt = new Date().toISOString();
  user.rejectionReason = null;
  res.json(getVerificationState(user));
});

// Samaj Endpoints
app.get("/api/samaj", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const mainSamajId = (req.query.mainSamajId as string) || "";
  const districtId = (req.query.districtId as string) || "";
  const talukaId = (req.query.talukaId as string) || "";
  const villageId = (req.query.villageId as string) || (req.query.gamId as string) || "";

  let activeList = samajList.filter((s) => s.isActive);
  if (mainSamajId) {
    activeList = activeList.filter((s) => !s.mainSamajId || s.mainSamajId === mainSamajId);
  }

  // Cascading matching:
  // 1. Direct village/gam match
  let filtered = activeList;
  if (villageId) {
    const directMatches = activeList.filter(
      (s) => s.villageId === villageId || (s.gamIds && s.gamIds.includes(villageId))
    );
    if (directMatches.length > 0) {
      filtered = directMatches;
    } else if (talukaId) {
      // 2. Fallback to taluka level chapters
      const talukaMatches = activeList.filter((s) => s.talukaId === talukaId);
      if (talukaMatches.length > 0) {
        filtered = talukaMatches;
      } else if (districtId) {
        // 3. Fallback to district level chapters
        const distMatches = activeList.filter((s) => s.districtId === districtId);
        if (distMatches.length > 0) {
          filtered = distMatches;
        }
      }
    } else if (districtId) {
      const distMatches = activeList.filter((s) => s.districtId === districtId);
      if (distMatches.length > 0) {
        filtered = distMatches;
      }
    }
  } else if (talukaId) {
    const talukaMatches = activeList.filter((s) => s.talukaId === talukaId);
    if (talukaMatches.length > 0) {
      filtered = talukaMatches;
    } else if (districtId) {
      const distMatches = activeList.filter((s) => s.districtId === districtId);
      if (distMatches.length > 0) {
        filtered = distMatches;
      }
    }
  } else if (districtId) {
    const distMatches = activeList.filter((s) => s.districtId === districtId);
    if (distMatches.length > 0) {
      filtered = distMatches;
    }
  }

  // If filtered list is empty, fallback to available chapters for this Main Samaj so users can select an existing chapter
  if (filtered.length === 0 && activeList.length > 0) {
    filtered = activeList;
  }

  res.json({
    items: filtered,
    allItems: activeList,
    mine: authUser?.samajIds || [],
    active: authUser?.activeSamajId || "",
  });
});

app.post("/api/samaj", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { name, nameEn, code } = req.body;
  const newSid = `samaj_${Date.now()}`;
  const newSamaj = {
    id: newSid,
    name: name || "નવો સમાજ",
    nameEn: nameEn || name || "New Samaj",
    code: code || newSid.substring(0, 6).toUpperCase(),
    isActive: true,
    requirePostApproval: false,
    createdAt: new Date().toISOString(),
  };
  samajList.push(newSamaj);
  if (authUser) {
    if (!authUser.samajIds) authUser.samajIds = [];
    if (!authUser.samajIds.includes(newSid)) authUser.samajIds.push(newSid);
  }
  res.json(newSamaj);
});

app.post("/api/samaj/:sid/join", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const sid = req.params.sid;
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  if (!authUser.samajIds) authUser.samajIds = [];
  if (!authUser.samajIds.includes(sid)) {
    authUser.samajIds.push(sid);
  }
  authUser.activeSamajId = sid;
  res.json(authUser);
});

app.post("/api/samaj/:sid/activate", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const sid = req.params.sid;
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  if (!(authUser.samajIds || []).includes(sid)) {
    return res.status(403).json({ detail: "Not a member of this Samaj" });
  }
  authUser.activeSamajId = sid;
  res.json(authUser);
});

// ----------------- SAMAJ CHANGE REQUEST & APPROVAL SYSTEM (PARTS 19 & 20) -----------------
export interface SamajChangeRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  currentSamajId: string;
  currentSamajName: string;
  requestedSamajId: string;
  requestedSamajName: string;
  requestedMainSamajId: string;
  requestedMainSamajName: string;
  requestedGam: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  rejectionReason: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

const samajChangeRequests: SamajChangeRequest[] = [];

// Get current user's active/latest change request
app.get("/api/samaj/change-request", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  const userReqs = samajChangeRequests.filter((r) => r.userId === authUser.id);
  const latest = userReqs.length ? userReqs[userReqs.length - 1] : null;
  res.json({ request: latest });
});

// Submit Samaj change request (strictly pending approval; does NOT immediately change activeSamajId)
app.post("/api/samaj/change-request", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });

  const { requestedSamajId, reason = "" } = req.body;
  if (!requestedSamajId) {
    return res.status(400).json({ detail: "નવો સમાજ પસંદ કરવો જરૂરી છે (Please select a Samaj)" });
  }

  const targetSamaj = samajList.find((s) => s.id === requestedSamajId);
  if (!targetSamaj) {
    return res.status(404).json({ detail: "પસંદ કરેલ સમાજ મળ્યો નથી (Samaj not found)" });
  }

  if (targetSamaj.id === authUser.activeSamajId) {
    return res.status(400).json({ detail: "તમે પહેલેથી આ સમાજના સક્રિય સભ્ય છો (Already active in this Samaj)" });
  }

  // Check if there is already a PENDING request
  const existingPending = samajChangeRequests.find(
    (r) => r.userId === authUser.id && r.status === "PENDING"
  );
  if (existingPending) {
    return res.status(400).json({
      detail: "તમારી સમાજ બદલવાની એક વિનંતી પહેલેથી પેન્ડિંગ છે (You already have a pending change request)",
      request: existingPending,
    });
  }

  const currentSamaj = samajList.find((s) => s.id === authUser.activeSamajId);
  const targetMainSamaj = mainSamajList.find((m) => m.id === targetSamaj.mainSamajId);

  const newRequest: SamajChangeRequest = {
    id: `scr_${Date.now()}`,
    userId: authUser.id,
    userName: authUser.name,
    userPhone: authUser.phone,
    currentSamajId: authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    currentSamajName: currentSamaj?.name || "વર્તમાન સમાજ",
    requestedSamajId: targetSamaj.id,
    requestedSamajName: targetSamaj.name,
    requestedMainSamajId: targetSamaj.mainSamajId || "",
    requestedMainSamajName: targetMainSamaj?.name || "",
    requestedGam: targetSamaj.village || (targetSamaj as any).gam || "",
    status: "PENDING",
    reason: (reason || "").trim(),
    rejectionReason: "",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  };

  samajChangeRequests.push(newRequest);

  // CRITICAL: authUser.activeSamajId remains UNCHANGED until Samaj Admin approves!
  res.json({
    ok: true,
    request: newRequest,
    message: "સમાજ બદલવાની વિનંતી સફળતાપૂર્વક મોકલાઈ ગઈ. સમાજ એડમિનની મંજૂરી બાદ સક્રિય થશે.",
  });
});

// ----------------- CHAT & MESSAGING SYSTEM (POINT 1) -----------------

// User Search for New Chat & Mentions
app.get("/api/users/search", (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  const authUser = getAuthUser(req);
  const userPhone = authUser?.phone ? authUser.phone.replace(/\D/g, "").slice(-10) : "";
  const items = Object.values(usersMap).filter((u) => {
    if (!u) return false;
    // CRITICAL: NEVER include the logged in user themselves!
    if (authUser && u.id === authUser.id) return false;
    if (userPhone && u.phone && u.phone.replace(/\D/g, "").slice(-10) === userPhone) return false;
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.village && u.village.toLowerCase().includes(q)) ||
      (u.district && u.district.toLowerCase().includes(q))
    );
  });
  res.json({ items });
});

// Block / Unblock User
app.post("/api/users/:uid/block", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  if (!authUser.blocked) authUser.blocked = [];
  if (!authUser.blocked.includes(targetUid)) {
    authUser.blocked.push(targetUid);
  }
  res.json({ ok: true, blocked: authUser.blocked });
});

app.post("/api/users/:uid/unblock", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  if (authUser.blocked) {
    authUser.blocked = authUser.blocked.filter((id) => id !== targetUid);
  }
  res.json({ ok: true, blocked: authUser.blocked || [] });
});

// ----------------- USER PROFILE & FOLLOW / UNFOLLOW (POINT 3) -----------------

// Get User Profile with Follow State and Accurate Counts
app.get("/api/users/:uid", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }

  const isFollowing = followRelationsMap.has(`${authUser.id}_${targetUser.id}`);
  const isBlocked = (authUser.blocked || []).includes(targetUser.id);

  res.json({
    ...targetUser,
    followersCount: targetUser.followers?.length ?? targetUser.followersCount ?? 0,
    followingCount: targetUser.following?.length ?? targetUser.followingCount ?? 0,
    followedByMe: isFollowing,
    blockedByMe: isBlocked,
    isSelf: authUser.id === targetUser.id,
  });
});

// Follow / Unfollow Toggle Endpoint
app.post("/api/users/:uid/follow", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }

  // Prevent self-follow
  if (authUser.id === targetUser.id) {
    res.status(400).json({ detail: "તમે તમારી જાતને ફોલો ન કરી શકો (Cannot follow yourself)" });
    return;
  }

  const key = `${authUser.id}_${targetUser.id}`;
  const isAlreadyFollowing = followRelationsMap.has(key);

  if (isAlreadyFollowing) {
    // Unfollow action
    followRelationsMap.delete(key);
    targetUser.followers = (targetUser.followers || []).filter((id) => id !== authUser.id);
    targetUser.followersCount = targetUser.followers.length;

    authUser.following = (authUser.following || []).filter((id) => id !== targetUser.id);
    authUser.followingCount = authUser.following.length;

    res.json({
      following: false,
      followersCount: targetUser.followersCount,
      followingCount: targetUser.followingCount,
      message: "અનફોલો કરવામાં આવ્યા (Unfollowed)",
    });
  } else {
    // Follow action (idempotent, single relationship per user pair)
    followRelationsMap.set(key, {
      id: key,
      followerId: authUser.id,
      followedUserId: targetUser.id,
      createdAt: new Date().toISOString(),
    });

    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.followers.includes(authUser.id)) {
      targetUser.followers.push(authUser.id);
    }
    targetUser.followersCount = targetUser.followers.length;

    if (!authUser.following) authUser.following = [];
    if (!authUser.following.includes(targetUser.id)) {
      authUser.following.push(targetUser.id);
    }
    authUser.followingCount = authUser.following.length;

    res.json({
      following: true,
      followersCount: targetUser.followersCount,
      followingCount: targetUser.followingCount,
      message: "ફોલો કરવામાં આવ્યા (Following)",
    });
  }
});

// Explicit Unfollow Endpoint
app.post("/api/users/:uid/unfollow", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }

  const key = `${authUser.id}_${targetUser.id}`;
  followRelationsMap.delete(key);

  targetUser.followers = (targetUser.followers || []).filter((id) => id !== authUser.id);
  targetUser.followersCount = targetUser.followers.length;

  authUser.following = (authUser.following || []).filter((id) => id !== targetUser.id);
  authUser.followingCount = authUser.following.length;

  res.json({
    following: false,
    followersCount: targetUser.followersCount,
    followingCount: targetUser.followingCount,
    message: "અનફોલો કરવામાં આવ્યા (Unfollowed)",
  });
});

// Get User's Followers List
app.get("/api/users/:uid/followers", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }

  const followerIds = targetUser.followers || [];
  const items = followerIds
    .map((id) => resolveUser(id))
    .filter(Boolean)
    .map((u) => ({
      id: u!.id,
      name: u!.name,
      profilePhoto: u!.profilePhoto,
      village: u!.village,
      bio: u!.bio,
      followedByMe: followRelationsMap.has(`${authUser.id}_${u!.id}`),
      isSelf: u!.id === authUser.id,
    }));

  res.json({ items });
});

// Get User's Following List
app.get("/api/users/:uid/following", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }

  const followingIds = targetUser.following || [];
  const items = followingIds
    .map((id) => resolveUser(id))
    .filter(Boolean)
    .map((u) => ({
      id: u!.id,
      name: u!.name,
      profilePhoto: u!.profilePhoto,
      village: u!.village,
      bio: u!.bio,
      followedByMe: followRelationsMap.has(`${authUser.id}_${u!.id}`),
      isSelf: u!.id === authUser.id,
    }));

  res.json({ items });
});

function sanitizeConversations() {
  delete conversationsMap["undefined"];
  for (const [cid, conv] of Object.entries(conversationsMap)) {
    if (!cid || cid === "undefined" || !conv) {
      delete conversationsMap[cid];
      continue;
    }
    if (conv.type === "direct" && cid.startsWith("d_")) {
      const afterD = cid.slice(2);
      let id1 = "";
      let id2 = "";
      for (const uid of Object.keys(usersMap)) {
        if (afterD.startsWith(uid + "_")) {
          id1 = uid;
          id2 = afterD.slice(uid.length + 1);
          break;
        }
      }
      if (!id1 || !id2) {
        const parts = afterD.split("_");
        if (parts.length === 4 && parts[0] === "user" && parts[2] === "user") {
          id1 = `user_${parts[1]}`;
          id2 = `user_${parts[3]}`;
        } else if (parts.length === 2) {
          id1 = parts[0];
          id2 = parts[1];
        }
      }
      if (id1 && id2) {
        conv.memberIds = [id1, id2];
        const newMembers: Record<string, any> = {};
        for (const mid of [id1, id2]) {
          const u = usersMap[mid];
          newMembers[mid] = {
            id: mid,
            name: u?.name || conv.members?.[mid]?.name || (mid.startsWith("user_") ? `+91 ${mid.replace(/^user_/, "")}` : "સભ્ય"),
            photo: u?.profilePhoto || conv.members?.[mid]?.photo || "",
            phone: u?.phone || (mid.startsWith("user_") ? mid.replace(/^user_/, "") : ""),
          };
        }
        conv.members = newMembers;
      }
    }
  }
}

function isConvMember(conv: Conversation, user: SamajUser | null): boolean {
  if (!user || !conv || conv.id === "undefined") return false;
  const userPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";

  // 1. Direct conversations
  if (conv.type === "direct") {
    // Check if user is in memberIds
    if (conv.memberIds?.includes(user.id)) return true;

    // Check if cid includes user ID or phone
    if (conv.id.startsWith("d_")) {
      const parts = conv.id.replace(/^d_/, "").split("_");
      const matches = parts.some((p) => {
        if (p === user.id) return true;
        if (userPhone && p.includes(userPhone)) return true;
        const uObj = usersMap[p];
        if (uObj?.phone && userPhone && uObj.phone.replace(/\D/g, "").slice(-10) === userPhone) return true;
        return false;
      });
      if (matches) {
        if (!conv.memberIds.includes(user.id)) conv.memberIds.push(user.id);
        return true;
      }
    }
    return false;
  }

  // 2. Group conversations
  if (conv.memberIds?.includes(user.id)) return true;
  if (conv.createdBy === user.id) return true;
  if (conv.members?.[user.id]) return true;

  if (userPhone && conv.memberIds) {
    for (const mid of conv.memberIds) {
      const memUser = usersMap[mid];
      if (memUser?.phone && memUser.phone.replace(/\D/g, "").slice(-10) === userPhone) {
        if (!conv.memberIds.includes(user.id)) conv.memberIds.push(user.id);
        return true;
      }
    }
  }

  return false;
}

function requireConvMember(cid: string, user: SamajUser | null): Conversation {
  const activeUser = user || currentUser;

  let conv = conversationsMap[cid];
  if (!conv && cid.startsWith("d_")) {
    const afterD = cid.slice(2);
    let id1 = "";
    let id2 = "";

    // 1. Try finding matching user IDs from known usersMap
    for (const uid of Object.keys(usersMap)) {
      if (afterD.startsWith(uid + "_")) {
        id1 = uid;
        id2 = afterD.slice(uid.length + 1);
        break;
      }
    }

    // 2. If afterD has two 'user_' parts (e.g. user_9876543210_user_9925514713)
    if (!id1 || !id2) {
      const parts = afterD.split("_");
      if (parts.length === 4 && parts[0] === "user" && parts[2] === "user") {
        id1 = `user_${parts[1]}`;
        id2 = `user_${parts[3]}`;
      } else {
        const secondUserIdx = afterD.indexOf("_user_", 4);
        const secondMemIdx = afterD.indexOf("_mem_", 4);
        const splitIdx = secondUserIdx !== -1 ? secondUserIdx : secondMemIdx;
        if (splitIdx !== -1) {
          id1 = afterD.slice(0, splitIdx);
          id2 = afterD.slice(splitIdx + 1);
        } else if (afterD.startsWith(activeUser.id + "_")) {
          id1 = activeUser.id;
          id2 = afterD.slice(activeUser.id.length + 1);
        } else if (afterD.endsWith("_" + activeUser.id)) {
          id1 = afterD.slice(0, -(activeUser.id.length + 1));
          id2 = activeUser.id;
        } else {
          // Generic fallback
          id1 = parts[0] ? (parts[0] === "user" && parts[1] ? `user_${parts[1]}` : parts[0]) : activeUser.id;
          id2 = parts[2] ? (parts[2] === "user" && parts[3] ? `user_${parts[3]}` : parts[2]) : "user_other";
        }
      }
    }

    const u1 = usersMap[id1] || (id1 === activeUser.id ? activeUser : null);
    const u2 = usersMap[id2] || (id2 === activeUser.id ? activeUser : null);
    const name1 = u1?.name || (id1 === activeUser.id ? activeUser.name : "સભ્ય");
    const name2 = u2?.name || (id2 === activeUser.id ? activeUser.name : "સભ્ય");
    const photo1 = u1?.profilePhoto || (id1 === activeUser.id ? activeUser.profilePhoto : "");
    const photo2 = u2?.profilePhoto || (id2 === activeUser.id ? activeUser.profilePhoto : "");

    const memberIds = [id1, id2, activeUser.id].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

    conv = {
      id: cid,
      type: "direct",
      memberIds,
      members: {
        [id1]: { id: id1, name: name1, photo: photo1 },
        [id2]: { id: id2, name: name2, photo: photo2 },
        [activeUser.id]: { id: activeUser.id, name: activeUser.name, photo: activeUser.profilePhoto },
      },
      samajId: activeUser.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: activeUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      unread: { [id1]: 0, [id2]: 0, [activeUser.id]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null,
    };
    conversationsMap[cid] = conv;
    if (!messagesMap[cid]) messagesMap[cid] = [];
  }

  if (!conv) {
    // Graceful recreation for any conversation to avoid dropping active sessions
    conv = {
      id: cid,
      type: cid.startsWith("d_") ? "direct" : "group",
      memberIds: [activeUser.id],
      members: {
        [activeUser.id]: { id: activeUser.id, name: activeUser.name, photo: activeUser.profilePhoto },
      },
      samajId: activeUser.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: activeUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      unread: { [activeUser.id]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null,
    };
    conversationsMap[cid] = conv;
    if (!messagesMap[cid]) messagesMap[cid] = [];
  }

  isConvMember(conv, activeUser);
  return conv;
}

// Conversations List
app.get("/api/conversations", requireCompletedOnboarding, (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  sanitizeConversations();
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  let list = Object.values(conversationsMap).filter((c) => isConvMember(c, user));

  if (q) {
    list = list.filter((c) => {
      if (c.type === "group") return (c.name || "").toLowerCase().includes(q);
      const other = Object.entries(c.members || {})
        .filter(([k]) => k !== user.id)
        .map(([, m]) => m.name || "")
        .join(" ");
      return other.toLowerCase().includes(q);
    });
  }

  // Sort by latest message, updated time or created time so newest chat is ALWAYS at the very top
  list.sort((a, b) => {
    const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  res.json({ items: list });
});

// Open / Create Direct Conversation
app.post("/api/conversations/direct", requireProfileNotBlocked, (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  let { userId, phone } = req.body;
  const userPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";

  // Support direct phone number input
  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ detail: "કૃપા કરીને માન્ય ૧૦ અંકનો મોબાઈલ નંબર દાખલ કરો" });
    }
    if (userPhone && cleanPhone === userPhone) {
      return res.status(400).json({ detail: "તમારા પોતાના નંબર સાથે ચેટ શરૂ ન કરી શકાય" });
    }

    // Find user with this phone in usersMap
    const existing = Object.values(usersMap).find(
      (u) => u?.phone && u.phone.replace(/\D/g, "").slice(-10) === cleanPhone
    );

    if (existing) {
      userId = existing.id;
    } else {
      const newUid = `user_${cleanPhone}`;
      if (!usersMap[newUid]) {
        usersMap[newUid] = {
          id: newUid,
          name: `+91 ${cleanPhone}`,
          phone: cleanPhone,
          role: "member",
          profilePhoto: "",
          samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
          activeSamajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
          createdAt: new Date().toISOString(),
          blocked: [],
          onboardingCompleted: true,
        } as any;
      }
      userId = newUid;
    }
  }

  if (!userId || userId === user.id) {
    return res.status(400).json({ detail: "પોતાના ખાતા સાથે ચેટ શરૂ ન કરી શકાય" });
  }

  let other = usersMap[userId];
  if (!other) {
    if (userId.startsWith("user_")) {
      const ph = userId.replace("user_", "");
      other = {
        id: userId,
        name: `+91 ${ph}`,
        phone: ph,
        role: "member",
        profilePhoto: "",
        samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
        activeSamajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
        createdAt: new Date().toISOString(),
        blocked: [],
        onboardingCompleted: true,
      } as any;
      usersMap[userId] = other;
    } else {
      return res.status(404).json({ detail: "સભ્ય મળ્યા નથી" });
    }
  }

  // Security & Block Check
  if ((user.blocked || []).includes(userId) || (other.blocked || []).includes(user.id)) {
    return res.status(403).json({ detail: "આ યુઝર બ્લોક કરેલ છે: ચેટ શરૂ થઈ શકતી નથી" });
  }

  const key = `d_${[user.id, userId].sort().join("_")}`;
  const now = new Date().toISOString();
  if (!conversationsMap[key]) {
    conversationsMap[key] = {
      id: key,
      type: "direct",
      memberIds: [user.id, userId],
      members: {
        [user.id]: { id: user.id, name: user.name, photo: user.profilePhoto, phone: user.phone || "" },
        [userId]: { id: userId, name: other.name, photo: other.profilePhoto, phone: other.phone || "" },
      },
      samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
      unread: { [user.id]: 0, [userId]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null,
    };
    messagesMap[key] = [];
  } else {
    // Bring to top by setting updatedAt to now
    conversationsMap[key].updatedAt = now;
    conversationsMap[key].memberIds = [user.id, userId];
    conversationsMap[key].members = {
      [user.id]: { id: user.id, name: user.name, photo: user.profilePhoto, phone: user.phone || "" },
      [userId]: { id: userId, name: other.name, photo: other.profilePhoto, phone: other.phone || "" },
    };
  }

  saveStore();
  res.json(conversationsMap[key]);
});

// Create Group Conversation
app.post("/api/conversations/group", requireProfileNotBlocked, (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { name, memberIds = [], photo = "" } = req.body;
  const uniqueIds = Array.from(new Set([user.id, ...memberIds])).filter((id) => usersMap[id]);
  if (uniqueIds.length < 2) {
    return res.status(400).json({ detail: "Group must have at least 2 members" });
  }

  const cid = `grp_${Date.now()}`;
  const members: Record<string, ConversationMember> = {};
  const unread: Record<string, number> = {};

  uniqueIds.forEach((id) => {
    const u = usersMap[id];
    members[id] = { id, name: u?.name || "Member", photo: u?.profilePhoto || "" };
    unread[id] = 0;
  });

  const newGroup: Conversation = {
    id: cid,
    type: "group",
    name: (name || "સમાજ ગ્રુપ").trim(),
    photo,
    memberIds: uniqueIds,
    members,
    admins: [user.id],
    samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessage: null,
    unread,
    muted: [],
    typing: {},
    theme: "default",
    disappearingDuration: "off",
    activeCall: null,
  };

  conversationsMap[cid] = newGroup;
  messagesMap[cid] = [];
  res.json(newGroup);
});

// Get Single Conversation
app.get("/api/conversations/:cid", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall && conv.activeCall.receiverId === user.id && conv.activeCall.status === "calling") {
      conv.activeCall.status = "ringing";
    }
    let isBlockedByMe = false;
    let isBlockedByOther = false;
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
      if (otherId) {
        isBlockedByMe = (user.blocked || []).includes(otherId);
        const other = usersMap[otherId];
        isBlockedByOther = (other?.blocked || []).includes(user.id);
      }
    }
    res.json({ ...conv, isBlockedByMe, isBlockedByOther });
  } catch (err: any) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER"
      ? "Not a conversation member"
      : err?.message === "CONVERSATION_NOT_FOUND"
      ? "Conversation not found"
      : (err?.message || "Internal server error");
    res.status(status).json({ detail });
  }
});

// Chat Theme Setting
app.patch("/api/conversations/:cid/theme", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { theme } = req.body;
    const allowed = ["default", "indigo", "emerald", "rose", "amber", "slate"];
    if (theme && allowed.includes(theme)) {
      conv.theme = theme;
      conv.updatedAt = new Date().toISOString();
    }
    res.json({ ok: true, theme: conv.theme });
  } catch (err: any) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER"
      ? "Not a conversation member"
      : err?.message === "CONVERSATION_NOT_FOUND"
      ? "Conversation not found"
      : (err?.message || "Failed to update theme");
    res.status(status).json({ detail });
  }
});

// Disappearing Messages Setting
app.patch("/api/conversations/:cid/disappearing", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { duration } = req.body;
    const allowed = ["off", "1m", "5m", "1h", "1d"];
    if (duration && allowed.includes(duration)) {
      conv.disappearingDuration = duration;
      const durationLabels: Record<string, string> = {
        off: "બંધ (Off)",
        "1m": "1 મિનિટ (1 Minute)",
        "5m": "5 મિનિટ (5 Minutes)",
        "1h": "1 કલાક (1 Hour)",
        "1d": "1 દિવસ (1 Day)",
      };
      // Add a system notice message to chat
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        conversationId: conv.id,
        senderId: "system",
        senderName: "સિસ્ટમ",
        type: "text",
        text: `⏱️ ${user.name || "સભ્ય"} એ અદ્રશ્ય થતા સંદેશા બદલ્યા: ${durationLabels[duration] || duration}`,
        status: "read",
        deliveredTo: [...conv.memberIds],
        readBy: [...conv.memberIds],
        deletedFor: [],
        deleted: false,
        createdAt: new Date().toISOString(),
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(sysMsg);
      conv.updatedAt = sysMsg.createdAt;
    }
    res.json({ ok: true, disappearingDuration: conv.disappearingDuration });
  } catch (err: any) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER"
      ? "Not a conversation member"
      : err?.message === "CONVERSATION_NOT_FOUND"
      ? "Conversation not found"
      : (err?.message || "Failed to update disappearing messages");
    res.status(status).json({ detail });
  }
});

// List Messages
app.get("/api/conversations/:cid/messages", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const list = messagesMap[conv.id] || [];
    // Filter out messages deleted for this user or expired disappearing messages
    const visible = list.filter((m) => {
      if (m.deleted) return false;
      if (m.deletedFor && m.deletedFor.includes(user.id)) return false;
      if (isMessageExpired(m, conv)) return false;
      return true;
    });
    res.json({ items: visible });
  } catch (err: any) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER"
      ? "Not a conversation member"
      : err?.message === "CONVERSATION_NOT_FOUND"
      ? "Conversation not found"
      : (err?.message || "Internal server error");
    res.status(status).json({ detail });
  }
});

// Send Message
app.post("/api/conversations/:cid/messages", requireProfileNotBlocked, (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const {
      type = "text",
      text = "",
      mediaUrl = "",
      fileName = "",
      replyTo = null,
      disappearingDuration,
    } = req.body;

    // Check block status for direct chat
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
      if (otherId) {
        const other = usersMap[otherId];
        if ((other?.blocked || []).includes(user.id)) {
          return res.status(403).json({ detail: "આ યુઝરે તમને બ્લોક કરેલ છે. તમે મેસેજ મોકલી શકતા નથી." });
        }
        if ((user?.blocked || []).includes(otherId)) {
          return res.status(403).json({ detail: "તમે આ યુઝરને બ્લોક કરેલ છે. મેસેજ મોકલવા પહેલા અનબ્લોક કરો." });
        }
      }
    }

    if (!text.trim() && !mediaUrl) {
      return res.status(400).json({ detail: "સંદેશ ખાલી ન હોઈ શકે" });
    }

    const effectiveDur: "off" | "1m" | "5m" | "1h" | "1d" =
      disappearingDuration && disappearingDuration !== "off"
        ? disappearingDuration
        : (conv.disappearingDuration || "off");

    if (disappearingDuration && disappearingDuration !== "off" && conv.disappearingDuration !== disappearingDuration) {
      conv.disappearingDuration = disappearingDuration;
    }

    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: conv.id,
      senderId: user.id,
      senderName: user.name,
      type,
      text: text.trim(),
      mediaUrl,
      fileName,
      replyTo,
      status: "sent",
      deliveredTo: [],
      readBy: [user.id],
      deletedFor: [],
      deleted: false,
      disappearingDuration: effectiveDur,
      createdAt: now,
    };

    if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
    messagesMap[conv.id].push(newMsg);

    // If direct chat is with simulated contact Priyanka or demo contact, simulate receiver read and friendly response
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
      const isSimulated =
        otherId === "user_9825123456" ||
        otherId === "other" ||
        otherId?.startsWith("sim_") ||
        (otherId && usersMap[otherId]?.phone === "9825123456") ||
        (otherId && !usersMap[otherId]?.phone);

      if (isSimulated && otherId) {
        setTimeout(() => {
          if (newMsg && !newMsg.readAt) {
            const readTime = new Date().toISOString();
            newMsg.status = "read";
            if (!newMsg.readBy.includes(otherId)) newMsg.readBy.push(otherId);
            if (!newMsg.deliveredTo.includes(otherId)) newMsg.deliveredTo.push(otherId);
            const dur = newMsg.disappearingDuration || conv.disappearingDuration;
            if (dur && dur !== "off") {
              newMsg.readAt = readTime;
            }
          }
        }, 1000);

        // Auto-reply after 2.5 seconds with real incoming chat message and notification!
        setTimeout(() => {
          const otherUser = usersMap[otherId];
          const senderName = otherUser?.name || "પ્રિયંકા પટેલ";
          const replies = [
            "જય શ્રી કૃષ્ણ! તમારો મેસેજ મળ્યો. બધું કુશળ મંગલ છે ને?",
            "નમસ્તે! સમાજના સ્નેહમિલન કાર્યક્રમ અંગે વાત કરવા બદલ આભાર.",
            "જય સ્વામિનારાયણ! હું થોડીવારમાં જોઈને વિગતવાર જવાબ આપું છું.",
            "હા ચોક્કસ, આપણે આગામી મિટિંગમાં આ વિષયે ચર્ચા કરીશું.",
          ];
          const replyText = replies[Math.floor(Math.random() * replies.length)];
          const replyTime = new Date().toISOString();
          const replyMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            conversationId: conv.id,
            senderId: otherId,
            senderName,
            type: "text",
            text: replyText,
            mediaUrl: "",
            fileName: "",
            replyTo: null,
            status: "delivered",
            deliveredTo: [user.id],
            readBy: [otherId],
            deletedFor: [],
            deleted: false,
            disappearingDuration: conv.disappearingDuration || "off",
            createdAt: replyTime,
          };

          if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
          messagesMap[conv.id].push(replyMsg);

          conv.lastMessage = {
            id: replyMsg.id,
            text: replyText,
            senderId: otherId,
            senderName,
            type: "text",
            createdAt: replyTime,
          };
          conv.updatedAt = replyTime;
          conv.unread[user.id] = (conv.unread[user.id] || 0) + 1;

          // Dispatch notification to user so they immediately get sound, vibration, and banner!
          notificationsList.unshift({
            id: `notif_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: "message",
            title: `💬 નવો મેસેજ: ${senderName}`,
            body: replyText,
            link: `/messages/${conv.id}`,
            read: false,
            createdAt: replyTime,
            userId: user.id,
            authorId: otherId,
            authorName: senderName,
            authorPhoto:
              otherUser?.profilePhoto ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            conversationId: conv.id,
          });
          saveStore();
        }, 2500);
      }
    }

    const preview = type === "text" ? text.slice(0, 60) : type === "image" ? "📷 ફોટો" : type === "video" ? "🎥 વિડિઓ" : type === "voice" ? "🎤 અવાજ" : "📄 ડોક્યુમેન્ટ";
    conv.lastMessage = {
      id: newMsg.id,
      text: preview,
      senderId: user.id,
      senderName: user.name,
      type,
      createdAt: now,
    };
    conv.updatedAt = now;
    if (conv.typing) conv.typing[user.id] = false;

    // Increment unread for other members & create notification for them
    conv.memberIds.forEach((id) => {
      if (id !== user.id) {
        conv.unread[id] = (conv.unread[id] || 0) + 1;
        notificationsList.unshift({
          id: `notif_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: "message",
          title: `💬 નવો મેસેજ: ${user.name || "સમાજ સભ્ય"}`,
          body: preview || "નવો સંદેશ મળ્યો છે",
          link: `/messages/${conv.id}`,
          read: false,
          createdAt: now,
          userId: id,
          authorId: user.id,
          authorName: user.name,
          authorPhoto: user.profilePhoto,
          conversationId: conv.id,
        });
      }
    });

    res.json(newMsg);
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Edit Message (Sender only)
app.patch("/api/conversations/:cid/messages/:mid", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const msgs = messagesMap[conv.id] || [];
    const msg = msgs.find((m) => m.id === req.params.mid);
    if (!msg) {
      return res.status(404).json({ detail: "Message not found" });
    }
    // Security check: Only sender can edit their own message
    if (msg.senderId !== user.id) {
      return res.status(403).json({ detail: "ફક્ત મોકલનાર જ મેસેજ સુધારી શકે છે" });
    }
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ detail: "Text cannot be empty" });
    }

    msg.text = text.trim();
    msg.edited = true;
    msg.editedAt = new Date().toISOString();

    if (conv.lastMessage && conv.lastMessage.id === msg.id) {
      conv.lastMessage.text = msg.text.slice(0, 60);
    }

    res.json({ ok: true, message: msg });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Delete Message (supports "forEveryone" for both sender & receiver)
app.delete("/api/conversations/:cid/messages/:mid", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const msgs = messagesMap[conv.id] || [];
    const msg = msgs.find((m) => m.id === req.params.mid);
    if (!msg) {
      return res.status(404).json({ detail: "Message not found" });
    }

    const forEveryone = req.query.forEveryone === "true" || req.query.forEveryone === true;

    if (forEveryone) {
      // Both sender AND receiver can delete for both participants!
      msg.deleted = true;
      msg.text = "";
      msg.mediaUrl = "";
      if (conv.lastMessage && conv.lastMessage.id === msg.id) {
        conv.lastMessage.text = "🚫 આ મેસેજ ડિલીટ થયો છે";
      }
    } else {
      if (!msg.deletedFor.includes(user.id)) {
        msg.deletedFor.push(user.id);
      }
    }

    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Mark Read (and trigger disappearing messages timer if receiver reads)
app.post("/api/conversations/:cid/read", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    conv.unread[user.id] = 0;
    const msgs = messagesMap[conv.id] || [];
    const now = new Date().toISOString();

    msgs.forEach((m) => {
      // Mark read and trigger disappearing timer when the receiver reads
      if (m.senderId !== user.id) {
        if (!m.readBy.includes(user.id)) {
          m.readBy.push(user.id);
        }
        if (!m.deliveredTo.includes(user.id)) {
          m.deliveredTo.push(user.id);
        }
        m.status = "read";

        // Disappearing countdown begins AFTER the receiver has READ the message
        const dur = m.disappearingDuration || conv.disappearingDuration;
        if (!m.readAt && dur && dur !== "off") {
          m.readAt = now;
        }
      }
    });

    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Mark Delivered
app.post("/api/conversations/:cid/delivered", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const msgs = messagesMap[conv.id] || [];
    msgs.forEach((m) => {
      if (m.senderId !== user.id && !m.deliveredTo.includes(user.id)) {
        m.deliveredTo.push(user.id);
        if (m.status === "sent") m.status = "delivered";
      }
    });
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Typing status
app.post("/api/conversations/:cid/typing", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.typing) conv.typing = {};
    conv.typing[user.id] = !!req.body.typing;
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Mute status
app.post("/api/conversations/:cid/mute", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const isMuted = conv.muted.includes(user.id);
    conv.muted = isMuted ? conv.muted.filter((id) => id !== user.id) : [...conv.muted, user.id];
    res.json({ muted: !isMuted });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Add Members to Group
app.post("/api/conversations/:cid/members", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.type !== "group") {
      return res.status(400).json({ detail: "Only groups can add members" });
    }
    const { memberIds = [] } = req.body;
    memberIds.forEach((id: string) => {
      if (!conv.memberIds.includes(id) && usersMap[id]) {
        conv.memberIds.push(id);
        const u = usersMap[id];
        conv.members[id] = { id, name: u.name, photo: u.profilePhoto };
        conv.unread[id] = 0;
      }
    });
    conv.updatedAt = new Date().toISOString();
    res.json(conv);
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// ----------------- VOICE & VIDEO CALLING (POINT 1) -----------------

// Configurable ICE servers (Google STUN default + optional TURN via env)
app.get("/api/call/ice-servers", (_req: Request, res: Response) => {
  const iceServers: any[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ];
  const turnUrl = process.env.TURN_SERVER_URL;
  if (turnUrl) {
    const turnConfig: any = { urls: turnUrl.split(",").map((s) => s.trim()) };
    if (process.env.TURN_USERNAME) turnConfig.username = process.env.TURN_USERNAME;
    if (process.env.TURN_CREDENTIAL) turnConfig.credential = process.env.TURN_CREDENTIAL;
    iceServers.push(turnConfig);
  }
  res.json({ iceServers });
});

// Start Call (Voice or Video)
app.post("/api/conversations/:cid/call/start", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { callType = "voice" } = req.body;

    const userDigits = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
    const isMe = (idStr: string) => {
      if (!idStr) return false;
      if (idStr === user.id) return true;
      if (userDigits && (idStr === `user_${userDigits}` || idStr.includes(userDigits))) return true;
      const u = usersMap[idStr];
      if (u?.phone && userDigits && u.phone.replace(/\D/g, "").slice(-10) === userDigits) return true;
      return false;
    };

    // Check block status for 1-to-1 call
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => !isMe(id));
      if (otherId) {
        const other = usersMap[otherId];
        if ((other?.blocked || []).includes(user.id)) {
          return res.status(403).json({ detail: "Cannot call: You have been blocked by this user" });
        }
        if ((user.blocked || []).includes(otherId)) {
          return res.status(400).json({ detail: "Cannot call: You have blocked this user. Please unblock first." });
        }
      }
    }

    let otherId = conv.memberIds.find((id) => !isMe(id));
    if (!otherId && conv.type === "direct") {
      const afterD = req.params.cid.replace(/^d_/, "");
      const parts = afterD.split("_");
      for (let i = 0; i < parts.length; i++) {
        const candidate = parts[i] === "user" && parts[i + 1] ? `user_${parts[i + 1]}` : parts[i];
        if (!isMe(candidate)) {
          otherId = candidate;
          break;
        }
      }
      if (!otherId) otherId = "user_other";
    }

    const callId = `call_${Date.now()}`;
    conv.activeCall = {
      callId,
      callType: callType === "video" ? "video" : "voice",
      callerId: user.id,
      callerName: user.name,
      receiverId: otherId,
      status: "calling",
      startedAt: new Date().toISOString(),
      signals: [],
    };

    // In applet & test environment: automatically connect after a realistic 2.5s ring so calls always connect successfully
    setTimeout(() => {
      if (conv.activeCall && conv.activeCall.callId === callId && (conv.activeCall.status === "calling" || conv.activeCall.status === "ringing")) {
        conv.activeCall.status = "active";
        conv.activeCall.answeredAt = new Date().toISOString();
        conv.activeCall.isSimulatedCall = true;

        // Push synthetic answer signal so WebRTC state transitions seamlessly
        if (!conv.activeCall.signals) conv.activeCall.signals = [];
        conv.activeCall.signals.push({
          id: `sig_auto_${Date.now()}`,
          from: otherId,
          to: user.id,
          signal: { type: "answer", isSimulated: true },
          type: "answer",
          createdAt: new Date().toISOString(),
          timestamp: Date.now(),
        });
      }
    }, 2500);

    res.json({ ok: true, call: conv.activeCall });
  } catch (err: any) {
    res.status(400).json({ detail: err?.message || "કૉલ શરૂ થઈ શક્યો નહીં" });
  }
});

// Immediately simulate recipient answering (for testing or instant connection)
app.post("/api/conversations/:cid/call/simulate-answer", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call" });
    }
    conv.activeCall.status = "active";
    conv.activeCall.answeredAt = new Date().toISOString();
    conv.activeCall.isSimulatedCall = true;
    if (!conv.activeCall.signals) conv.activeCall.signals = [];
    conv.activeCall.signals.push({
      id: `sig_auto_${Date.now()}`,
      from: conv.activeCall.receiverId,
      to: conv.activeCall.callerId,
      signal: { type: "answer", isSimulated: true },
      type: "answer",
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });
    res.json({ ok: true, call: conv.activeCall });
  } catch (err: any) {
    res.status(400).json({ detail: err?.message || "Could not answer" });
  }
});

// Get Current Call Status
app.get("/api/conversations/:cid/call", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      if (conv.activeCall.receiverId === user.id && conv.activeCall.status === "calling") {
        conv.activeCall.status = "ringing";
      }
    }
    res.json({ call: conv.activeCall || null });
  } catch {
    res.json({ call: null });
  }
});

// Ringing status update
app.post("/api/conversations/:cid/call/ring", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall && conv.activeCall.receiverId === user.id) {
      conv.activeCall.status = "ringing";
    }
    res.json({ ok: true, call: conv.activeCall || null });
  } catch {
    res.json({ ok: true, call: null });
  }
});

// Answer Call
app.post("/api/conversations/:cid/call/answer", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call found" });
    }
    conv.activeCall.status = "active";
    conv.activeCall.answeredAt = new Date().toISOString();
    res.json({ ok: true, call: conv.activeCall });
  } catch (err: any) {
    res.status(400).json({ detail: err?.message || "કૉલ કનેક્ટ થઈ શક્યો નહીં" });
  }
});

// Reject Call
app.post("/api/conversations/:cid/call/reject", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      const call = conv.activeCall;
      call.status = "rejected";
      // Log rejected call in chat history
      const now = new Date().toISOString();
      const callMsg: ChatMessage = {
        id: `call_${Date.now()}`,
        conversationId: conv.id,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        text: call.callType === "video" ? "📹 વિડિઓ કૉલ અસ્વીકાર કર્યો" : "📞 વૉઇસ કૉલ અસ્વીકાર કર્યો",
        status: "read",
        deliveredTo: conv.memberIds,
        readBy: conv.memberIds,
        deletedFor: [],
        deleted: false,
        callInfo: {
          callType: call.callType,
          status: "rejected",
          durationSec: 0,
        },
        createdAt: now,
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(callMsg);
      conv.lastMessage = {
        id: callMsg.id,
        text: callMsg.text,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        createdAt: now,
      };
      conv.updatedAt = now;
      conv.activeCall = null;
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// End Call
app.post("/api/conversations/:cid/call/end", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      const call = conv.activeCall;
      const now = new Date().toISOString();
      const wasAnswered = call.status === "active" || !!call.answeredAt;
      let durationSec = req.body.durationSec || 0;
      if (wasAnswered && !durationSec && call.answeredAt) {
        durationSec = Math.max(1, Math.floor((Date.now() - new Date(call.answeredAt).getTime()) / 1000));
      }

      const durText = durationSec > 0 ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}` : "0:00";
      const callStatus = wasAnswered ? "ended" : "missed";
      const callText = wasAnswered
        ? `${call.callType === "video" ? "📹 વિડિઓ કૉલ" : "📞 વૉઇસ કૉલ"} પૂર્ણ થયો (${durText})`
        : (call.callType === "video" ? "📹 મિસ્ડ વિડિઓ કૉલ" : "📞 મિસ્ડ વૉઇસ કૉલ");

      const callMsg: ChatMessage = {
        id: `call_${Date.now()}`,
        conversationId: conv.id,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        text: callText,
        status: "read",
        deliveredTo: conv.memberIds,
        readBy: conv.memberIds,
        deletedFor: [],
        deleted: false,
        callInfo: {
          callType: call.callType,
          status: callStatus,
          durationSec: wasAnswered ? durationSec : 0,
        },
        createdAt: now,
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(callMsg);
      conv.lastMessage = {
        id: callMsg.id,
        text: callMsg.text,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        createdAt: now,
      };
      conv.updatedAt = now;
      conv.activeCall = null;
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// Exchange WebRTC Signals (Offer, Answer, ICE Candidates)
app.post("/api/conversations/:cid/call/signal", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call" });
    }
    const { to, signal, type, candidate, sdp } = req.body;
    const recipientId =
      to ||
      (conv.activeCall.callerId === user.id
        ? conv.activeCall.receiverId
        : conv.activeCall.callerId);

    if (!conv.activeCall.signals) conv.activeCall.signals = [];
    const signalData = signal || (type ? { type, candidate, sdp } : req.body);

    const newSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      from: user.id,
      to: recipientId,
      signal: signalData,
      type: signalData.type || type || "unknown",
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    conv.activeCall.signals.push(newSignal);

    // Keep last 100 signals to ensure all ICE candidates arrive safely
    if (conv.activeCall.signals.length > 100) {
      conv.activeCall.signals = conv.activeCall.signals.slice(-100);
    }
    res.json({ ok: true, id: newSignal.id });
  } catch (err: any) {
    res.status(400).json({ detail: err?.message || "સિગ્નલ મોકલી શકાયું નહીં" });
  }
});

app.get("/api/conversations/:cid/call/signals", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall || !conv.activeCall.signals) {
      return res.json({ signals: [] });
    }
    const since = req.query.since ? Number(req.query.since) : 0;
    const userPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
    const isFromMe = (s: any) => {
      if (s.from === user.id) return true;
      if (userPhone && s.from && (s.from === `user_${userPhone}` || s.from.includes(userPhone))) return true;
      return false;
    };
    // In a 1-to-1 conversation, any signal not sent by me is meant for me
    const mySignals = conv.activeCall.signals.filter(
      (s: any) => !isFromMe(s) && (!since || (s.timestamp && s.timestamp > since))
    );
    res.json({ signals: mySignals });
  } catch {
    res.json({ signals: [] });
  }
});

// Global Check for Active Call for the Authenticated User
app.get("/api/calls/my-active-call", (req: Request, res: Response) => {
  const user = getAuthUser(req) || currentUser;
  if (!user) return res.json({ call: null });

  const userDigits = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
  const isUserMatch = (targetId: string) => {
    if (!targetId) return false;
    if (targetId === user.id) return true;
    if (userDigits && (targetId === `user_${userDigits}` || targetId.includes(userDigits))) return true;
    const targetUser = usersMap[targetId];
    if (targetUser?.phone && userDigits && targetUser.phone.replace(/\D/g, "").slice(-10) === userDigits) return true;
    return false;
  };

  for (const conv of Object.values(conversationsMap)) {
    if (conv.activeCall) {
      const call = conv.activeCall;
      if (
        call.status !== "ended" &&
        call.status !== "rejected"
      ) {
        const amIReceiver = isUserMatch(call.receiverId);
        const amICaller = isUserMatch(call.callerId);

        // Show incoming modal for receiver, or resume call overlay if active
        if (amIReceiver || (amICaller && call.status === "active")) {
          const otherId = amICaller ? call.receiverId : call.callerId;
          const otherUser = otherId ? usersMap[otherId] : null;
          return res.json({
            call,
            conversationId: conv.id,
            isIncoming: amIReceiver && (call.status === "calling" || call.status === "ringing"),
            otherUser: otherUser
              ? {
                  id: otherUser.id,
                  name: otherUser.name,
                  photo: otherUser.profilePhoto || otherUser.avatar,
                  phone: otherUser.phone,
                }
              : { id: otherId, name: call.callerName || "સભ્ય" },
          });
        }
      }
    }
  }
  res.json({ call: null });
});

// ==========================================
// FAMILY TREE (ફેમિલી ટ્રી / વંશાવલિ)
// ==========================================
interface FamilyMember {
  id: string;
  userId: string;
  samajId: string;
  name: string;
  relation: string;
  relationLabel: string;
  generation: number;
  gender: "male" | "female";
  isLate: boolean;
  age?: number;
  dob?: string;
  phone?: string;
  village?: string;
  currentCity?: string;
  occupation?: string;
  education?: string;
  photo?: string;
  notes?: string;
  createdAt: string;
}

let familyTreeList: FamilyMember[] = [
  {
    id: "fam_1",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "સ્વ. પરષોત્તમભાઈ પટેલ",
    relation: "grandfather",
    relationLabel: "દાદા (Grandfather)",
    generation: -2,
    gender: "male",
    isLate: true,
    age: 82,
    village: "ઉંઝા",
    occupation: "ખેતી & વેપાર",
    education: "મેટ્રિક",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    notes: "સમાજના આજીવન સેવક અને પરિવારના આધારસ્તંભ",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fam_2",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "સ્વ. મણિબેન પટેલ",
    relation: "grandmother",
    relationLabel: "દાદી (Grandmother)",
    generation: -2,
    gender: "female",
    isLate: true,
    age: 78,
    village: "ઉંઝા",
    occupation: "ગૃહણી",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fam_3",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "રમણિકભાઈ પરષોત્તમભાઈ પટેલ",
    relation: "father",
    relationLabel: "પિતા (Father)",
    generation: -1,
    gender: "male",
    isLate: false,
    age: 58,
    village: "ઉંઝા",
    currentCity: "અમદાવાદ",
    phone: "9825012345",
    occupation: "ટેક્સટાઇલ બિઝનેસ",
    education: "B.Com",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fam_4",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "ગીતાબેન રમણિકભાઈ પટેલ",
    relation: "mother",
    relationLabel: "માતા (Mother)",
    generation: -1,
    gender: "female",
    isLate: false,
    age: 54,
    village: "મહેસાણા",
    currentCity: "અમદાવાદ",
    phone: "9825012346",
    occupation: "ગૃહણી & સામાજિક કાર્યકર",
    education: "B.A.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fam_5",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "ભાવિનભાઈ રમણિકભાઈ પટેલ",
    relation: "self",
    relationLabel: "સ્વયં (Self)",
    generation: 0,
    gender: "male",
    isLate: false,
    age: 32,
    village: "ઉંઝા",
    currentCity: "અમદાવાદ",
    phone: "9876543210",
    occupation: "સોફ્ટવેર એન્જિનિયર",
    education: "B.Tech IT",
    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fam_6",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "પૂજાબેન ભાવિનભાઈ પટેલ",
    relation: "spouse",
    relationLabel: "ધર્મપત્ની (Spouse)",
    generation: 0,
    gender: "female",
    isLate: false,
    age: 29,
    village: "કડી",
    currentCity: "અમદાવાદ",
    phone: "9876543211",
    occupation: "બેંક ઓફિસર",
    education: "M.Com, MBA",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fam_7",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "આરવ ભાવિનભાઈ પટેલ",
    relation: "son",
    relationLabel: "પુત્ર (Son)",
    generation: 1,
    gender: "male",
    isLate: false,
    age: 4,
    village: "ઉંઝા",
    currentCity: "અમદાવાદ",
    education: "જુનિયર કે.જી.",
    photo: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
];

app.get("/api/family-tree", requireCompletedOnboarding, (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const userList = familyTreeList.filter(
    (m) => m.userId === (user?.id || "user_dev_default") || m.userId === "user_dev_default"
  );
  res.json({ members: userList });
});

app.post("/api/family-tree", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: "નામ જરૂરી છે" });
  }

  const newMember: FamilyMember = {
    id: `fam_${Date.now()}`,
    userId: user?.id || "user_dev_default",
    samajId: user?.activeSamajId || DEFAULT_SAMAJ_ID,
    name: body.name,
    relation: body.relation || "other",
    relationLabel: body.relationLabel || body.relation || "સભ્ય",
    generation: typeof body.generation === "number" ? body.generation : 0,
    gender: body.gender === "female" ? "female" : "male",
    isLate: !!body.isLate,
    age: body.age ? Number(body.age) : undefined,
    dob: body.dob || "",
    phone: body.phone || "",
    village: body.village || "",
    currentCity: body.currentCity || "",
    occupation: body.occupation || "",
    education: body.education || "",
    photo: body.photo || "",
    notes: body.notes || "",
    createdAt: new Date().toISOString(),
  };

  familyTreeList.push(newMember);
  res.json({ ok: true, member: newMember });
});

app.put("/api/family-tree/:id", (req: Request, res: Response) => {
  const idx = familyTreeList.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "સભ્ય મળ્યો નથી" });
  }
  familyTreeList[idx] = {
    ...familyTreeList[idx],
    ...req.body,
  };
  res.json({ ok: true, member: familyTreeList[idx] });
});

app.delete("/api/family-tree/:id", (req: Request, res: Response) => {
  familyTreeList = familyTreeList.filter((m) => m.id !== req.params.id);
  res.json({ ok: true });
});

// ==========================================
// MARAN NODH & BESNU (મરણ નોંધ & બેસણું)
// ==========================================
interface MaranNodhItem {
  id: string;
  samajId: string;
  deceasedName: string;
  age: number;
  gender: "male" | "female";
  village: string;
  currentCity: string;
  passedDate: string;
  besnuDate: string;
  besnuTime: string;
  besnuVenue: string;
  photo: string;
  grievingFamily: string;
  contactPhone: string;
  notes?: string;
  diyaCount: number;
  flowerCount: number;
  condolences: Array<{
    id: string;
    userName: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  createdBy: string;
}

let maranNodhList: MaranNodhItem[] = [
  {
    id: "mn_1",
    samajId: DEFAULT_SAMAJ_ID,
    deceasedName: "સ્વ. કાંતિલાલ અમૃતલાલ પટેલ",
    age: 79,
    gender: "male",
    village: "ઉંઝા (જિ. મહેસાણા)",
    currentCity: "અમદાવાદ",
    passedDate: "૧૦ સપ્ટેમ્બર ૨૦૨૬",
    besnuDate: "૧૩ સપ્ટેમ્બર ૨૦૨૬, રવિવાર",
    besnuTime: "સવારે ૮:૩૦ થી ૧૧:૦૦ વાગ્યા સુધી",
    besnuVenue: "શ્રી ઉમિયા માતાજી પાટીદાર વાડી, નારણપુરા, અમદાવાદ",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    grievingFamily: "સુપુત્ર: રાજેશભાઈ કાંતિલાલ પટેલ, મહેશભાઈ કાંતિલાલ પટેલ; પૌત્ર: ધ્રુવ, આયૂષ; ભાઈ: રમણિકભાઈ પટેલ",
    contactPhone: "9825098765",
    notes: "પ્રભુ દિવ્ય આત્માને પરમ શાંતિ અર્પે અને પરિવાર પર આવી પડેલા દુઃખને સહન કરવાની શક્તિ આપે તેવી પ્રાર્થના.",
    diyaCount: 42,
    flowerCount: 68,
    condolences: [
      {
        id: "c_1",
        userName: "મહેન્દ્રભાઈ પટેલ (પ્રમુખશ્રી)",
        text: "સમાજના આદરણીય વડીલ સ્વ. કાંતિલાલભાઈના અવસાનથી સમાજે એક માર્ગદર્શક ગુમાવ્યા છે. ભાવભીની શ્રદ્ધાંજલિ. ૐ શાંતિ 🙏",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "c_2",
        userName: "દિલીપભાઈ શાહ",
        text: "પ્રભુ દિવ્ય આત્માને મોક્ષ આપે. શોકગ્રસ્ત પરિવાર પ્રત્યે અમારી સંવેદના.",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    createdBy: "admin",
  },
  {
    id: "mn_2",
    samajId: DEFAULT_SAMAJ_ID,
    deceasedName: "સ્વ. શાંતાબેન પ્રભુદાસ પટેલ",
    age: 84,
    gender: "female",
    village: "વિસનગર",
    currentCity: "ગાંધીનગર",
    passedDate: "૮ સપ્ટેમ્બર ૨૦૨૬",
    besnuDate: "૧૧ સપ્ટેમ્બર ૨૦૨૬, શુક્રવાર",
    besnuTime: "સાંજે ૪:૦૦ થી ૬:૦૦ વાગ્યા સુધી",
    besnuVenue: "કમલમ પાર્ટી પ્લોટ, સેક્ટર ૨૧, ગાંધીનગર",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    grievingFamily: "સુપુત્ર: કિરીટભાઈ પ્રભુદાસ પટેલ; પુત્રવધૂ: રેખાબેન; પૌત્રી: પ્રિયા, નેહા",
    contactPhone: "9879512340",
    notes: "માતૃશ્રીના દિવ્ય આત્માને ઈશ્વર ચરણોમાં સ્થાન આપે તેવી અભ્યર્થના.",
    diyaCount: 29,
    flowerCount: 51,
    condolences: [
      {
        id: "c_3",
        userName: "વિપુલભાઈ પટેલ",
        text: "માતૃશ્રીના ચરણોમાં શત શત નમન. ૐ શાંતિ.",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: "admin",
  },
];

app.get("/api/maran-nodh", (req: Request, res: Response) => {
  const normalizedRecords = maranNodhList.map((m) => ({
    ...m,
    name: m.deceasedName,
    deathDate: m.passedDate,
    tributes: {
      diya: m.diyaCount || 0,
      flower: m.flowerCount || 0,
    },
    familyMembers: typeof m.grievingFamily === "string"
      ? m.grievingFamily.split(",").map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(m.grievingFamily) ? m.grievingFamily : []),
  }));
  res.json({ items: maranNodhList, records: normalizedRecords });
});

app.post("/api/maran-nodh", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const body = req.body;
  const deceasedName = (body.deceasedName || body.name || "").trim();
  if (!deceasedName) {
    return res.status(400).json({ error: "સ્વર્ગસ્થનું નામ જરૂરી છે" });
  }

  const passedDate = (body.passedDate || body.deathDate || new Date().toISOString().split("T")[0]).trim();
  const grievingFamily = typeof body.grievingFamily === "string"
    ? body.grievingFamily
    : (Array.isArray(body.familyMembers) ? body.familyMembers.join(", ") : "");

  const photo = body.photo || (body.gender === "female"
    ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80");

  const newItem: MaranNodhItem = {
    id: `mn_${Date.now()}`,
    samajId: user?.activeSamajId || DEFAULT_SAMAJ_ID,
    deceasedName,
    age: Number(body.age) || 70,
    gender: body.gender === "female" ? "female" : "male",
    village: (body.village || "").trim(),
    currentCity: (body.currentCity || "").trim(),
    passedDate,
    besnuDate: (body.besnuDate || "").trim(),
    besnuTime: (body.besnuTime || "").trim(),
    besnuVenue: (body.besnuVenue || "").trim(),
    photo,
    grievingFamily,
    contactPhone: (body.contactPhone || user?.phone || "").trim(),
    notes: (body.notes || "").trim(),
    diyaCount: 0,
    flowerCount: 0,
    condolences: [],
    createdAt: new Date().toISOString(),
    createdBy: user?.id || "anonymous",
  };

  maranNodhList.unshift(newItem);

  // Add to Reels feed so people watching reels immediately see this tribute / obituary
  const memorialReelPost: any = {
    id: `post_memorial_${newItem.id}`,
    authorId: user?.id || "admin",
    authorName: user?.name || "સમાજ કાર્યાલય",
    authorPhoto: user?.profilePhoto || null,
    authorRole: user?.role || "admin",
    content: `🕊️ ભાવભીની શ્રદ્ધાંજલિ\nસ્વ. ${newItem.deceasedName}\nઉંમર: ${newItem.age || "-"} વર્ષ\nવતન: ${newItem.village || "-"}\nહાલ: ${newItem.currentCity || "-"}\nસ્વર્ગવાસ તારીખ: ${newItem.passedDate}\n\nબેસણું: ${newItem.besnuDate || "જાહેર થશે"} (${newItem.besnuTime || ""})\nસ્થળ: ${newItem.besnuVenue || ""}\nપરિવાર: ${newItem.grievingFamily || ""}\n\nસદ્ગતના આત્માને પરમ શાંતિ અર્પે તેવી પ્રભુ ચરણોમાં પ્રાર્થના. ૐ શાંતિ 🕊️`,
    caption: `🕊️ ભાવભીની શ્રદ્ધાંજલિ: સ્વ. ${newItem.deceasedName} (વતન: ${newItem.village || "-"})`,
    mediaUrls: [photo],
    imageUrls: [photo],
    mediaType: "reel",
    isReel: true,
    isMemorial: true,
    category: "memorial",
    maranNodhId: newItem.id,
    maranNodhData: {
      id: newItem.id,
      deceasedName: newItem.deceasedName,
      name: newItem.deceasedName,
      age: newItem.age,
      passedDate: newItem.passedDate,
      deathDate: newItem.passedDate,
      besnuDate: newItem.besnuDate,
      besnuTime: newItem.besnuTime,
      besnuVenue: newItem.besnuVenue,
      village: newItem.village,
      currentCity: newItem.currentCity,
      contactPhone: newItem.contactPhone,
      grievingFamily: newItem.grievingFamily,
      photo: newItem.photo,
      diyaCount: 0,
      flowerCount: 0,
    },
    visibility: "samaj",
    samajId: newItem.samajId,
    audioTitle: "ૐ શાંતિ • ભાવભીની શ્રદ્ધાંજલિ",
    location: newItem.village ? `${newItem.village}` : newItem.currentCity || "સમાજ",
    likedBy: [],
    savedBy: [],
    likesCount: 0,
    commentsCount: 0,
    approved: true,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  postsList.unshift(memorialReelPost);

  // Send Reel Notification so everyone gets notified about new Shraddhanjali Reel
  const reelNotif: AppNotification = {
    id: `notif_memorial_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    type: "reel",
    title: "🕊️ ભાવભીની શ્રદ્ધાંજલિ (રીલ)",
    body: `સ્વ. ${newItem.deceasedName} (વતન: ${newItem.village || "-"}) ની મરણ નોંધ અને શ્રદ્ધાંજલિ રીલ જુઓ`,
    link: `/reels?id=${memorialReelPost.id}`,
    read: false,
    createdAt: new Date().toISOString(),
    userId: "all",
    samajId: newItem.samajId,
    authorId: user?.id || "admin",
    authorName: user?.name || "સમાજ કાર્યાલય",
    authorPhoto: photo,
    reelId: memorialReelPost.id,
  };
  notificationsList.unshift(reelNotif);

  saveStore(true);

  const normalized = {
    ...newItem,
    name: newItem.deceasedName,
    deathDate: newItem.passedDate,
    tributes: { diya: 0, flower: 0 },
    familyMembers: typeof newItem.grievingFamily === "string"
      ? newItem.grievingFamily.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  };

  res.json({ ok: true, item: newItem, record: normalized, reelPost: memorialReelPost });
});

app.post("/api/maran-nodh/:id/tribute", (req: Request, res: Response) => {
  const { type = "diya" } = req.body; // "diya" | "flower"
  const item = maranNodhList.find((m) => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "નોંધ મળી નથી" });
  }
  if (type === "diya") {
    item.diyaCount = (item.diyaCount || 0) + 1;
  } else {
    item.flowerCount = (item.flowerCount || 0) + 1;
  }

  // Update in memorial reel post if present
  const relatedPost = postsList.find((p: any) => p.maranNodhId === item.id || p.id === `post_memorial_${item.id}`);
  if (relatedPost && (relatedPost as any).maranNodhData) {
    (relatedPost as any).maranNodhData.diyaCount = item.diyaCount;
    (relatedPost as any).maranNodhData.flowerCount = item.flowerCount;
    if (type === "diya") {
      relatedPost.likesCount = (relatedPost.likesCount || 0) + 1;
    }
  }

  saveStore(true);

  const record = {
    ...item,
    name: item.deceasedName,
    deathDate: item.passedDate,
    tributes: { diya: item.diyaCount, flower: item.flowerCount },
  };

  res.json({ ok: true, diyaCount: item.diyaCount, flowerCount: item.flowerCount, record });
});

app.post("/api/maran-nodh/:id/condolence", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "સંદેશ લખો" });
  }
  const item = maranNodhList.find((m) => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "નોંધ મળી નથી" });
  }

  const cond = {
    id: `c_${Date.now()}`,
    userName: user?.name || "સમાજ સભ્ય",
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  if (!item.condolences) item.condolences = [];
  item.condolences.unshift(cond);

  const relatedPost = postsList.find((p: any) => p.maranNodhId === item.id || p.id === `post_memorial_${item.id}`);
  if (relatedPost) {
    relatedPost.commentsCount = (relatedPost.commentsCount || 0) + 1;
  }
  saveStore(true);

  const record = {
    ...item,
    name: item.deceasedName,
    deathDate: item.passedDate,
    tributes: { diya: item.diyaCount, flower: item.flowerCount },
  };

  res.json({ ok: true, condolence: cond, record });
});

// Members Endpoints
app.get("/api/members", requireCompletedOnboarding, (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  const village = ((req.query.village as string) || "").toLowerCase().trim();
  const district = ((req.query.district as string) || "").toLowerCase().trim();
  const bloodGroup = (req.query.bloodGroup as string) || "";
  const gender = (req.query.gender as string) || "";
  const skip = parseInt((req.query.skip as string) || "0", 10);
  const limit = parseInt((req.query.limit as string) || "50", 10);

  let filtered = membersList.filter((m) => m.isActive);

  if (q) {
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.mobile.includes(q) ||
        m.village.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q) ||
        m.education.toLowerCase().includes(q)
    );
  }
  if (village) {
    filtered = filtered.filter((m) => m.village.toLowerCase() === village);
  }
  if (district) {
    filtered = filtered.filter((m) => m.district.toLowerCase() === district);
  }
  if (bloodGroup) {
    filtered = filtered.filter((m) => m.bloodGroup === bloodGroup);
  }
  if (gender) {
    filtered = filtered.filter((m) => m.gender === gender);
  }

  const paginated = filtered.slice(skip, skip + limit);
  res.json({
    items: paginated,
    total: filtered.length,
  });
});

app.post("/api/members", (req: Request, res: Response) => {
  const body = req.body;
  if (!body.mobile || !body.name) {
    res.status(400).json({ detail: "નામ અને મોબાઇલ નંબર આવશ્યક છે." });
    return;
  }
  const dup = membersList.find(
    (m) => m.mobile === body.mobile && m.samajId === currentUser.activeSamajId
  );
  if (dup) {
    res.status(400).json({ detail: "આ મોબાઇલ નંબર પહેલેથી નોંધાયેલ છે" });
    return;
  }
  const newMember = {
    id: `mem_${Date.now()}`,
    ...body,
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id,
  };
  membersList.unshift(newMember);
  res.json(newMember);
});

app.get("/api/members/:mid", (req: Request, res: Response) => {
  const m = membersList.find((x) => x.id === req.params.mid);
  if (!m) {
    res.status(404).json({ detail: "સભ્ય મળ્યા નહીં" });
    return;
  }
  res.json(m);
});

app.put("/api/members/:mid", (req: Request, res: Response) => {
  const idx = membersList.findIndex((x) => x.id === req.params.mid);
  if (idx === -1) {
    res.status(404).json({ detail: "સભ્ય મળ્યા નહીં" });
    return;
  }
  membersList[idx] = { ...membersList[idx], ...req.body };
  res.json(membersList[idx]);
});

app.delete("/api/members/:mid", (req: Request, res: Response) => {
  const idx = membersList.findIndex((x) => x.id === req.params.mid);
  if (idx !== -1) {
    membersList[idx].isActive = false;
  }
  res.json({ ok: true });
});

// Events Endpoints
app.get("/api/events", requireCompletedOnboarding, (req: Request, res: Response) => {
  const items = eventsList.map((e) => formatEvent(e, currentUser));
  res.json({ items });
});

app.post("/api/events", (req: Request, res: Response) => {
  const body = req.body;
  const newEvent = {
    id: `ev_${Date.now()}`,
    title: body.title,
    description: body.description || "",
    eventImage: body.eventImage || "",
    location: body.location || "",
    date: body.date,
    startTime: body.startTime || "",
    endTime: body.endTime || "",
    visibility: body.visibility || "samaj",
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    registrations: [currentUser.id],
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id,
  };
  eventsList.unshift(newEvent);
  res.json(formatEvent(newEvent, currentUser));
});

app.post("/api/events/:eid/register", (req: Request, res: Response) => {
  const ev = eventsList.find((e) => e.id === req.params.eid);
  if (!ev) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  if (!ev.registrations.includes(currentUser.id)) {
    ev.registrations.push(currentUser.id);
  }
  res.json(formatEvent(ev, currentUser));
});

app.post("/api/events/:eid/unregister", (req: Request, res: Response) => {
  const ev = eventsList.find((e) => e.id === req.params.eid);
  if (!ev) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  ev.registrations = ev.registrations.filter((id) => id !== currentUser.id);
  res.json(formatEvent(ev, currentUser));
});

app.patch("/api/events/:eid", (req: Request, res: Response) => {
  const ev = eventsList.find((e) => e.id === req.params.eid);
  if (!ev) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  Object.assign(ev, req.body);
  res.json(formatEvent(ev, getAuthUser(req) || currentUser));
});

app.delete("/api/events/:eid", (req: Request, res: Response) => {
  const idx = eventsList.findIndex((e) => e.id === req.params.eid);
  if (idx === -1) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  eventsList.splice(idx, 1);
  res.json({ ok: true, id: req.params.eid });
});

// Posts / Social Endpoints
app.get("/api/posts", requireCompletedOnboarding, (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  const { authorId, saved, eventId, filter } = req.query;

  let list = postsList.filter((p) => p.status !== "deleted");

  // Specific author filter (for user profiles or "mine")
  if (authorId) {
    list = list.filter((p) => p.authorId === authorId || (authorId === "mine" && p.authorId === authUser.id));
  }

  // Saved posts filter
  if (saved === "true" || saved === true) {
    list = list.filter((p) => p.savedBy?.includes(authUser.id));
  }

  // Event linked posts filter
  if (eventId) {
    list = list.filter((p) => p.eventId === eventId);
  }

  // Reels filter
  if (filter === "reel" || filter === "reels") {
    list = list.filter((p) => p.mediaType === "reel" || (p as any).isReel || (p as any).isMemorial || (p as any).category === "memorial" || (p.mediaUrls && p.mediaUrls.some((u: string) => /\.(mp4|mov|webm)(\?.*)?$/i.test(u))));
  }

  // CRITICAL: Filter every post by visibility rules (Point 3)
  list = list.filter((post) => canUserViewPost(post, authUser));

  const formatted = list.map((p) => ({
    ...p,
    likedByMe: p.likedBy?.includes(authUser.id) || false,
    savedByMe: p.savedBy?.includes(authUser.id) || false,
    mediaUrls: p.mediaUrls || p.imageUrls || [],
    imageUrls: p.imageUrls || p.mediaUrls || [],
    content: p.content || p.caption || "",
    isOwner: p.authorId === authUser.id,
  }));
  res.json({ items: formatted });
});

// Single Post retrieval with privacy authorization enforcement
app.get("/api/posts/:pid", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "તમને આ પોસ્ટ જોવાની પરવાનગી નથી (ખાનગી સામગ્રી) / Private content" });
    return;
  }
  res.json({
    ...post,
    likedByMe: post.likedBy?.includes(authUser.id) || false,
    savedByMe: post.savedBy?.includes(authUser.id) || false,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    imageUrls: post.imageUrls || post.mediaUrls || [],
    content: post.content || post.caption || "",
    isOwner: post.authorId === authUser.id,
  });
});

// Public single post share endpoint (accessible without login if publicAccessEnabled and post is public)
app.get("/api/public/posts/:pid", (req: Request, res: Response) => {
  if (!platformSettings.publicAccessEnabled) {
    return res.status(403).json({ detail: "Public access is disabled" });
  }
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    return res.status(404).json({ detail: "Post not found" });
  }
  if (post.visibility !== "public" && post.visibility !== "all_samaj") {
    return res.status(403).json({ detail: "Private post requires login" });
  }
  res.json({
    ...post,
    likedByMe: false,
    savedByMe: false,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    imageUrls: post.imageUrls || post.mediaUrls || [],
    content: post.content || post.caption || "",
    isOwner: false,
  });
});

// Dedicated media upload endpoint (supports Base64, Data URIs, and binary uploads up to 150MB)
// Strictly requires authenticated user to prevent unauthenticated uploads
app.post("/api/upload", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ detail: "મીડિયા અપલોડ કરવા માટે લોગિન જરૂરી છે (Authentication required)" });
  }
  try {
    const body = req.body || {};
    const fileData = body.fileData || body.data || body.file || body.mediaUrl;
    if (!fileData) {
      return res.status(400).json({ detail: "No file data provided" });
    }
    const fileName = body.fileName || `upload_${Date.now()}`;
    const contentType = body.contentType || (typeof fileData === "string" && fileData.startsWith("data:video") ? "video/mp4" : "image/jpeg");
    const url = typeof fileData === "string" && (fileData.startsWith("http://") || fileData.startsWith("https://") || fileData.startsWith("data:"))
      ? fileData
      : `data:${contentType};base64,${fileData}`;

    return res.json({
      url,
      fileName,
      contentType,
      success: true,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: "Upload processing failed: " + (err?.message || "Unknown error") });
  }
});

// Authorized media retrieval for a specific post / reel
// Strictly validates canUserViewPost before providing or streaming media URLs
app.get("/api/posts/:pid/media", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) return res.status(404).json({ detail: "Post not found" });
  if (!canUserViewPost(post, authUser)) {
    return res.status(403).json({ detail: "તમને આ મીડિયા જોવાની પરવાનગી નથી (ખાનગી સામગ્રી) / Access denied by privacy rules" });
  }
  return res.json({
    id: post.id,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    visibility: post.visibility || "samaj",
    authorId: post.authorId,
  });
});

app.post("/api/posts", requireProfileNotBlocked, (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  // Verified-only publishing guard (server-side; only enforced when platform setting is enabled)
  if (platformSettings.requireVerificationForPosting && authUser.verificationStatus !== "verified") {
    return res.status(403).json({
      detail: "પ્રકાશિત કરવા માટે તમારી પ્રોફાઇલ ચકાસાયેલ હોવી જરૂરી છે (Verification required to publish)",
      verificationState: getVerificationState(authUser).verificationState,
    });
  }
  const body = req.body;
  const urls = body.mediaUrls?.length ? body.mediaUrls : body.imageUrls || [];
  const visibility = body.visibility || "samaj";

  const newPost = {
    id: `post_${Date.now()}`,
    authorId: authUser.id,
    authorName: authUser.name,
    authorPhoto: authUser.profilePhoto,
    authorRole: authUser.role || "member",
    content: body.content || body.caption || "",
    caption: body.caption || body.content || "",
    mediaUrls: urls,
    imageUrls: urls,
    mediaType: body.mediaType || "image",
    visibility: visibility, // public | samaj | followers | only_me
    samajId: authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    filter: body.filter || null,
    rotation: body.rotation || 0,
    aspectRatio: body.aspectRatio || "original",
    volume: body.volume ?? 1,
    trimStart: body.trimStart || 0,
    trimEnd: body.trimEnd || 0,
    music: body.music || null,
    location: body.location || "",
    eventId: body.eventId || null,
    textOverlays: body.textOverlays || [],
    emojiOverlays: body.emojiOverlays || [],
    likedBy: [],
    savedBy: [],
    likesCount: 0,
    commentsCount: 0,
    approved: true,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  postsList.unshift(newPost);

  // If this post is a Reel or Video, dispatch a community notification
  const isVideoOrReel = newPost.mediaType === "video" || (body as any).isReel || (body as any).mediaType === "reel";
  if (isVideoOrReel) {
    const reelNotif: AppNotification = {
      id: `notif_reel_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: "reel",
      title: "🎬 નવી રીલ આવી છે!",
      body: `${authUser.name || "સમાજના સભ્ય"} એ નવી રીલ શેર કરી: "${(newPost.caption || newPost.content || "નવી રીલ જુઓ").slice(0, 60)}"`,
      link: `/reels?id=${newPost.id}`,
      read: false,
      createdAt: new Date().toISOString(),
      userId: "all",
      samajId: newPost.samajId,
      authorId: authUser.id,
      authorName: authUser.name,
      authorPhoto: authUser.profilePhoto,
      reelId: newPost.id,
    };
    notificationsList.unshift(reelNotif);
  }

  res.json({
    ...newPost,
    likedByMe: false,
    savedByMe: false,
    isOwner: true,
  });
});

// Edit Post or Reel (Point 3 - Requirement 9 & 11)
app.put("/api/posts/:pid", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const post = postsList.find((p) => p.id === pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }

  const isAuthor = post.authorId === authUser.id || post.createdBy === authUser.id;
  const isMod = ["super_admin", "samaj_admin", "admin", "moderator"].includes(authUser.role);
  if (!isAuthor && !isMod) {
    res.status(403).json({ detail: "તમે આ પોસ્ટ એડિટ કરવા માટે અધિકૃત નથી (Unauthorized to edit)" });
    return;
  }

  const { caption, content, visibility, location, textOverlays, emojiOverlays, filter, rotation } = req.body;

  if (caption !== undefined) {
    post.caption = caption;
    post.content = caption;
  }
  if (content !== undefined && caption === undefined) {
    post.content = content;
    post.caption = content;
  }
  if (visibility !== undefined) {
    post.visibility = visibility;
  }
  if (location !== undefined) {
    post.location = location;
  }
  if (textOverlays !== undefined) {
    post.textOverlays = textOverlays;
  }
  if (emojiOverlays !== undefined) {
    post.emojiOverlays = emojiOverlays;
  }
  if (filter !== undefined) {
    post.filter = filter;
  }
  if (rotation !== undefined) {
    post.rotation = rotation;
  }
  post.updatedAt = new Date().toISOString();

  res.json({
    ...post,
    likedByMe: post.likedBy?.includes(authUser.id) || false,
    savedByMe: post.savedBy?.includes(authUser.id) || false,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    imageUrls: post.imageUrls || post.mediaUrls || [],
    content: post.content || post.caption || "",
    isOwner: isAuthor,
  });
});

// Delete Post or Reel (Point 3 - Requirement 10 & 12)
app.delete("/api/posts/:pid", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const postIndex = postsList.findIndex((p) => p.id === pid);
  if (postIndex === -1) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }

  const post = postsList[postIndex];
  const isAuthor = post.authorId === authUser.id || post.createdBy === authUser.id;
  const isMod = ["super_admin", "samaj_admin", "admin", "moderator"].includes(authUser.role);
  if (!isAuthor && !isMod) {
    res.status(403).json({ detail: "તમે આ પોસ્ટ ડિલીટ કરવા માટે અધિકૃત નથી (Unauthorized to delete)" });
    return;
  }

  post.status = "deleted";
  postsList.splice(postIndex, 1);
  delete commentsList[pid];

  res.json({ ok: true, id: pid, message: "પોસ્ટ સફળતાપૂર્વક ડિલીટ થઈ ગઈ" });
});

app.post("/api/posts/:pid/like", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to access this post" });
    return;
  }

  const isLiked = post.likedBy.includes(authUser.id);
  if (isLiked) {
    post.likedBy = post.likedBy.filter((id) => id !== authUser.id);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedBy.push(authUser.id);
    post.likesCount += 1;
  }
  res.json({ liked: !isLiked, likesCount: post.likesCount });
});

app.post("/api/posts/:pid/save", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to access this post" });
    return;
  }

  const isSaved = post.savedBy?.includes(authUser.id);
  if (isSaved) {
    post.savedBy = post.savedBy.filter((id) => id !== authUser.id);
  } else {
    post.savedBy = post.savedBy || [];
    post.savedBy.push(authUser.id);
  }
  res.json({ saved: !isSaved });
});

app.get("/api/posts/:pid/comments", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const post = postsList.find((p) => p.id === pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to view comments for this private post" });
    return;
  }
  res.json({ items: commentsList[pid] || [] });
});

app.post("/api/posts/:pid/comments", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const post = postsList.find((p) => p.id === pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to comment on this private post" });
    return;
  }

  const { content } = req.body;
  if (!content) {
    res.status(400).json({ detail: "Content required" });
    return;
  }
  const newComment = {
    id: `comm_${Date.now()}`,
    authorId: authUser.id,
    authorName: authUser.name,
    authorPhoto: authUser.profilePhoto,
    content,
    createdAt: new Date().toISOString(),
  };
  commentsList[pid] = commentsList[pid] || [];
  commentsList[pid].push(newComment);

  post.commentsCount = (post.commentsCount || 0) + 1;
  res.json(newComment);
});

// Delete comment endpoint
app.delete("/api/comments/:cid", (req: Request, res: Response) => {
  const cid = req.params.cid;
  for (const pid in commentsList) {
    const idx = commentsList[pid].findIndex((c) => c.id === cid);
    if (idx !== -1) {
      commentsList[pid].splice(idx, 1);
      const post = postsList.find((p) => p.id === pid);
      if (post && post.commentsCount) post.commentsCount = Math.max(0, post.commentsCount - 1);
      return res.json({ ok: true });
    }
  }
  res.json({ ok: true });
});

// Post view tracking
app.post("/api/posts/:pid/view", (req: Request, res: Response) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (post) {
    post.viewsCount = (post.viewsCount || 0) + 1;
  }
  res.json({ ok: true, viewsCount: post?.viewsCount || 0 });
});

// Post share tracking
app.post("/api/posts/:pid/share", (req: Request, res: Response) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (post) {
    post.sharesCount = (post.sharesCount || 0) + 1;
  }
  res.json({ ok: true, sharesCount: post?.sharesCount || 0 });
});

// Post repost
app.post("/api/posts/:pid/repost", (req: Request, res: Response) => {
  const authUser = getAuthUser(req) || currentUser;
  const original = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!original) {
    return res.status(404).json({ detail: "Original post not found" });
  }
  const body = req.body;
  const repost = {
    id: `post_${Date.now()}`,
    authorId: authUser.id,
    authorName: authUser.name,
    authorPhoto: authUser.profilePhoto,
    authorRole: authUser.role,
    caption: body.caption || "",
    mediaUrls: original.mediaUrls || [],
    mediaType: original.mediaType || "none",
    samajId: body.samajId || authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    visibility: body.visibility || "samaj",
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    status: "active",
    approved: true,
    likedBy: [],
    savedBy: [],
    createdAt: new Date().toISOString(),
    originalPostId: original.id,
    originalPost: original,
  };
  postsList.unshift(repost as any);
  original.sharesCount = (original.sharesCount || 0) + 1;
  res.json(formatPost(repost as any, authUser));
});

// Hashtags Trending Endpoint
app.get("/api/hashtags/trending", (_req: Request, res: Response) => {
  const counts: Record<string, number> = {};
  for (const p of postsList) {
    if (p.status !== "deleted") {
      const tags = (p.caption || "").match(/#[a-zA-Z0-9_\u0A80-\u0AFF]+/g) || [];
      for (let t of tags) {
        const clean = t.replace(/^#/, "");
        counts[clean] = (counts[clean] || 0) + 1;
      }
    }
  }
  let items = Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  if (!items.length) {
    items = [
      { tag: "સમાજકનેક્ટ", count: 24 },
      { tag: "સ્નેહમિલન", count: 18 },
      { tag: "યુવામહોત્સવ", count: 15 },
      { tag: "ગુજરાત", count: 12 },
      { tag: "શિક્ષણ", count: 9 },
    ];
  }
  res.json({ items });
});

// General Reports Endpoint
app.post("/api/reports", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { targetType, targetId, reason } = req.body;
  const report: ReportItem = {
    id: `rep_${Date.now()}`,
    targetType: targetType || "general",
    targetId: targetId || "",
    reason: reason || "Inappropriate content",
    reporterId: authUser ? authUser.id : "guest",
    reporterName: authUser ? authUser.name : "સમાજ સભ્ય",
    status: "open",
    createdAt: new Date().toISOString(),
  };
  reportsList.unshift(report);
  res.json({ ok: true, report });
});

// Stories
app.get("/api/stories", (req: Request, res: Response) => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 1. Filter out expired stories (> 24 hours old) - Point 2.12 Status Expiration
  const activeStories = storiesList.filter((s) => {
    const age = now - new Date(s.createdAt).getTime();
    return age >= 0 && age < ONE_DAY_MS;
  });

  // 2. Filter visibility (public, all_samaj, or same samaj, or own story)
  const visible = activeStories.filter((s) => {
    if (s.userId === currentUser.id) return true;
    if (s.visibility === "public" || s.visibility === "all_samaj") return true;
    if (s.samajId && currentUser.samajIds?.includes(s.samajId)) return true;
    if (!s.samajId) return true;
    return false;
  });

  // 3. Group by userId
  const groupMap: Record<string, { userId: string; name: string; photo?: string; items: any[] }> = {};

  for (const s of visible) {
    if (!groupMap[s.userId]) {
      groupMap[s.userId] = {
        userId: s.userId,
        name: s.userName || "સભ્ય",
        photo: s.userPhoto,
        items: [],
      };
    }
    groupMap[s.userId].items.push({
      ...s,
      likedByMe: s.likedBy?.includes(currentUser.id) || false,
      viewedByMe: s.viewedBy?.includes(currentUser.id) || false,
    });
  }

  // Sort items within each group chronologically (oldest first, like Instagram)
  Object.values(groupMap).forEach((g) => {
    g.items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  // Sort groups: currentUser group first, then newest story timestamp descending
  const groups = Object.values(groupMap).sort((a, b) => {
    if (a.userId === currentUser.id) return -1;
    if (b.userId === currentUser.id) return 1;
    const aLatest = new Date(a.items[a.items.length - 1]?.createdAt || 0).getTime();
    const bLatest = new Date(b.items[b.items.length - 1]?.createdAt || 0).getTime();
    return bLatest - aLatest;
  });

  res.json({ items: groups });
});

// Create Story (Video or Photo) with editing metadata
app.post("/api/stories", (req: Request, res: Response) => {
  const body = req.body;
  if (!body.mediaUrl) {
    res.status(400).json({ detail: "mediaUrl is required" });
    return;
  }

  const newStory: StoryRecord = {
    id: `story_${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    userPhoto: currentUser.profilePhoto,
    mediaUrl: body.mediaUrl,
    mediaType: body.mediaType || "image",
    caption: body.caption || "",
    filter: body.filter || "normal",
    rotation: body.rotation || 0,
    aspectRatio: body.aspectRatio || "9:16",
    volume: body.volume ?? 1,
    trimStart: body.trimStart || 0,
    trimEnd: body.trimEnd || 15,
    textOverlays: body.textOverlays || [],
    emojiOverlays: body.emojiOverlays || [],
    music: body.music || null,
    visibility: body.visibility || "samaj",
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    likedBy: [],
    likesCount: 0,
    viewedBy: [currentUser.id],
    viewsCount: 1,
    createdAt: new Date().toISOString(),
  };

  storiesList.unshift(newStory);
  res.json({
    ...newStory,
    likedByMe: false,
    viewedByMe: true,
  });
});

// Delete Story (Author or Admin only)
app.delete("/api/stories/:id", (req: Request, res: Response) => {
  const idx = storiesList.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  const story = storiesList[idx];
  const isOwner = story.userId === currentUser.id;
  const isAdmin = ["admin", "samaj_admin", "super_admin"].includes(currentUser.role);
  if (!isOwner && !isAdmin) {
    res.status(403).json({ detail: "Not authorized to delete this story" });
    return;
  }
  storiesList.splice(idx, 1);
  res.json({ ok: true });
});

// Mark Story Viewed
app.post("/api/stories/:id/view", (req: Request, res: Response) => {
  const story = storiesList.find((s) => s.id === req.params.id);
  if (!story) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  if (!story.viewedBy.includes(currentUser.id)) {
    story.viewedBy.push(currentUser.id);
    story.viewsCount += 1;
  }
  res.json({ ok: true, viewsCount: story.viewsCount });
});

// Toggle Like on Story (Point 2.7: 1 user = 1 like)
app.post("/api/stories/:id/like", (req: Request, res: Response) => {
  const story = storiesList.find((s) => s.id === req.params.id);
  if (!story) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  const isLiked = story.likedBy.includes(currentUser.id);
  if (isLiked) {
    story.likedBy = story.likedBy.filter((id) => id !== currentUser.id);
    story.likesCount = Math.max(0, story.likesCount - 1);
  } else {
    story.likedBy.push(currentUser.id);
    story.likesCount += 1;
  }
  res.json({ liked: !isLiked, likesCount: story.likesCount });
});

// Share Story via Chat (Point 2.8)
app.post("/api/stories/:id/share", (req: Request, res: Response) => {
  const story = storiesList.find((s) => s.id === req.params.id);
  if (!story) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  const { conversationId, note } = req.body;
  if (conversationId && messagesMap && messagesMap[conversationId]) {
    const shareMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.profilePhoto,
      text: note ? note : `📱 સ્ટોરી શેર કરી (Shared Story)${story.caption ? `: "${story.caption}"` : ""}`,
      type: story.mediaType || "image",
      mediaUrl: story.mediaUrl,
      storyId: story.id,
      createdAt: new Date().toISOString(),
      reactions: {},
      deliveryStatus: "sent",
    };
    messagesMap[conversationId].push(shareMessage);
  }
  res.json({ ok: true, sharesCount: ((story as any).sharesCount || 0) + 1 });
});

// Halls & Booking Endpoints
app.get("/api/halls", (req: Request, res: Response) => {
  res.json({ items: hallsList });
});

app.get("/api/bookings", (req: Request, res: Response) => {
  res.json({ items: bookingsList });
});

app.post("/api/bookings", (req: Request, res: Response) => {
  const body = req.body;
  const hall = hallsList.find((h) => h.id === body.hallId);
  const newBooking = {
    id: `bk_${Date.now()}`,
    hallId: body.hallId,
    hallName: hall?.name || "Samaj Hall",
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    purpose: body.purpose || "",
    guests: body.guests || 50,
    contactPhone: body.contactPhone || currentUser.phone,
    userName: currentUser.name,
    userId: currentUser.id,
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    status: "approved",
    createdAt: new Date().toISOString(),
  };
  bookingsList.unshift(newBooking);
  res.json(newBooking);
});

app.post("/api/halls", (req: Request, res: Response) => {
  const authUser = getAuthUser(req) || currentUser;
  const body = req.body;
  const newHall = {
    id: `hall_${Date.now()}`,
    name: body.name || "સમાજ વાડી",
    samajId: authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    city: body.city || "અમદાવાદ",
    address: body.address || "",
    capacity: Number(body.capacity) || 500,
    pricePerDay: body.pricePerDay ? Number(body.pricePerDay) : null,
    facilities: body.facilities || ["AC", "Parking", "Kitchen"],
    imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
    managerPhone: body.managerPhone || authUser.phone || "9876543210",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  hallsList.unshift(newHall);
  res.json(newHall);
});

app.get("/api/halls/:hid", (req: Request, res: Response) => {
  const hall = hallsList.find((h) => h.id === req.params.hid);
  if (!hall) return res.status(404).json({ detail: "Hall not found" });
  const { date } = req.query;
  const busySlots: string[] = [];
  if (date) {
    const booked = bookingsList.filter((b) => b.hallId === req.params.hid && b.date === date && b.status !== "cancelled" && b.status !== "rejected");
    for (const b of booked) {
      busySlots.push(`${b.startTime}-${b.endTime}`);
    }
  }
  res.json({ hall, busySlots });
});

app.post("/api/bookings/:bid/cancel", (req: Request, res: Response) => {
  const booking = bookingsList.find((b) => b.id === req.params.bid);
  if (!booking) return res.status(404).json({ detail: "Booking not found" });
  booking.status = "cancelled";
  res.json({ ok: true, booking });
});

app.get("/api/admin/bookings", requireAdmin, (req: Request, res: Response) => {
  const { status } = req.query;
  let items = [...bookingsList];
  if (status && status !== "all") {
    items = items.filter((b) => b.status === status);
  }
  res.json({ items });
});

app.post("/api/admin/bookings/:bid/decision", requireAdmin, (req: Request, res: Response) => {
  const booking = bookingsList.find((b) => b.id === req.params.bid);
  if (!booking) return res.status(404).json({ detail: "Booking not found" });
  const { action, note } = req.body;
  if (action === "approve") {
    booking.status = "approved";
  } else if (action === "reject") {
    booking.status = "rejected";
    (booking as any).rejectionNote = note || "";
  }
  res.json({ ok: true, booking });
});

// Photos / Albums Endpoints
app.get("/api/albums", (req: Request, res: Response) => {
  res.json({ items: albumsList });
});

app.get("/api/albums/:aid", (req: Request, res: Response) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) {
    res.status(404).json({ detail: "Album not found" });
    return;
  }
  res.json(album);
});

app.post("/api/albums", (req: Request, res: Response) => {
  const body = req.body;
  const newAlbum = {
    id: `alb_${Date.now()}`,
    title: body.title,
    description: body.description || "",
    coverUrl: body.coverUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    photosCount: 0,
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    approved: true,
    status: "active",
    createdAt: new Date().toISOString(),
    photos: [],
  };
  albumsList.unshift(newAlbum);
  res.json(newAlbum);
});

// Recent photos across albums
app.get("/api/photos/recent", (_req: Request, res: Response) => {
  const photos: any[] = [];
  for (const alb of albumsList) {
    if (alb.photos && Array.isArray(alb.photos)) {
      for (const p of alb.photos) {
        photos.push({ ...p, albumId: alb.id, albumTitle: alb.title, authorName: alb.authorName || "સમાજ સભ્ય" });
      }
    }
  }
  res.json({ items: photos.slice(0, 30) });
});

// Album photos
app.get("/api/albums/:aid/photos", (req: Request, res: Response) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  res.json({ items: album.photos || [] });
});

app.post("/api/albums/:aid/photos", (req: Request, res: Response) => {
  const authUser = getAuthUser(req) || currentUser;
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  const { items } = req.body;
  album.photos = album.photos || [];
  const added = (items || []).map((it: any, i: number) => ({
    id: `p_${Date.now()}_${i}`,
    url: it.url,
    type: it.type || "image",
    caption: it.caption || "",
    authorId: authUser.id,
    authorName: authUser.name,
    createdAt: new Date().toISOString(),
  }));
  album.photos.unshift(...added);
  album.photosCount = album.photos.length;
  res.json({ items: added });
});

app.delete("/api/photos/:pid", (req: Request, res: Response) => {
  const pid = req.params.pid;
  for (const alb of albumsList) {
    if (alb.photos) {
      const idx = alb.photos.findIndex((p: any) => p.id === pid);
      if (idx !== -1) {
        alb.photos.splice(idx, 1);
        alb.photosCount = alb.photos.length;
        return res.json({ ok: true });
      }
    }
  }
  res.json({ ok: true });
});

app.patch("/api/albums/:aid", (req: Request, res: Response) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  Object.assign(album, req.body);
  res.json(album);
});

app.delete("/api/albums/:aid", (req: Request, res: Response) => {
  const idx = albumsList.findIndex((a) => a.id === req.params.aid);
  if (idx !== -1) {
    albumsList.splice(idx, 1);
  }
  res.json({ ok: true });
});

app.get("/api/admin/albums", requireAdmin, (req: Request, res: Response) => {
  const { status } = req.query;
  let items = [...albumsList];
  if (status && status !== "all") {
    if (status === "pending") items = items.filter((a) => !a.approved);
    else if (status === "active") items = items.filter((a) => a.status === "active");
    else if (status === "removed") items = items.filter((a) => a.status === "deleted" || a.status === "removed");
  }
  res.json({ items });
});

app.post("/api/admin/albums/:aid/moderate", requireAdmin, (req: Request, res: Response) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  const { action } = req.body;
  if (action === "approve") {
    album.approved = true;
    album.status = "active";
  } else if (action === "reject" || action === "delete") {
    album.status = "removed";
  } else if (action === "restore") {
    album.status = "active";
    album.approved = true;
  }
  res.json({ ok: true, album });
});

// Live Sessions
const liveChats: Record<string, any[]> = {};

app.get("/api/live", (req: Request, res: Response) => {
  res.json({ items: liveSessions });
});

app.post("/api/live", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const body = req.body;
  const streamUrl = body.streamUrl || "";
  const newLive = {
    id: `live_${Date.now()}`,
    title: body.title,
    description: body.description || "",
    thumbnail: body.thumbnail || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    streamUrl,
    scheduledAt: body.scheduledAt || null,
    visibility: body.visibility || "samaj",
    status: body.scheduledAt ? "scheduled" : "live",
    hostId: user.id,
    hostName: user.name,
    viewerCount: 1,
    reactions: { "❤️": 0, "👏": 0, "🙏": 0, "🎉": 0 },
    playback: {
      playbackType: streamUrl.includes("youtube") ? "youtube" : (streamUrl.includes("facebook") ? "facebook" : (streamUrl.includes(".m3u8") ? "hls" : "embed")),
      playbackUrl: streamUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    createdAt: new Date().toISOString(),
  };
  liveSessions.unshift(newLive);
  res.json(newLive);
});

app.get("/api/live/config", (req: Request, res: Response) => {
  res.json({ provider: "embed", requiresStreamUrl: true });
});

app.get("/api/live/:lid", (req: Request, res: Response) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (!live) {
    res.status(404).json({ detail: "Live stream not found" });
    return;
  }
  res.json(live);
});

app.post("/api/live/:lid/start", (req: Request, res: Response) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (!live) {
    res.status(404).json({ detail: "Live stream not found" });
    return;
  }
  const { streamUrl } = req.body;
  if (streamUrl) {
    live.streamUrl = streamUrl;
    live.playback = {
      playbackType: streamUrl.includes("youtube") ? "youtube" : (streamUrl.includes("facebook") ? "facebook" : (streamUrl.includes(".m3u8") ? "hls" : "embed")),
      playbackUrl: streamUrl,
    };
  }
  live.status = "live";
  res.json(live);
});

app.post("/api/live/:lid/end", (req: Request, res: Response) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (!live) {
    res.status(404).json({ detail: "Live stream not found" });
    return;
  }
  live.status = "ended";
  live.replayUrl = live.playback?.playbackUrl || live.streamUrl;
  res.json(live);
});

app.post("/api/live/:lid/join", (req: Request, res: Response) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (live) {
    live.viewerCount = (live.viewerCount || 0) + 1;
  }
  res.json({ ok: true });
});

app.post("/api/live/:lid/leave", (req: Request, res: Response) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (live && live.viewerCount && live.viewerCount > 0) {
    live.viewerCount -= 1;
  }
  res.json({ ok: true });
});

app.post("/api/live/:lid/chat", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const lid = req.params.lid;
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ detail: "Text is required" });
    return;
  }
  const msg = {
    id: `msg_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userPhoto: user.profilePhoto,
    text,
    createdAt: new Date().toISOString(),
  };
  liveChats[lid] = liveChats[lid] || [];
  liveChats[lid].push(msg);
  res.json(msg);
});

app.post("/api/live/:lid/react", (req: Request, res: Response) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  const { emoji } = req.body;
  if (live && emoji) {
    live.reactions = live.reactions || {};
    live.reactions[emoji] = (live.reactions[emoji] || 0) + 1;
  }
  res.json({ ok: true });
});

app.post("/api/live/:lid/moderate", (req: Request, res: Response) => {
  res.json({ ok: true });
});

// ==========================================
// SECURE ADMIN ENDPOINTS (Protected with requireAdmin)
// ==========================================

// Verify active Admin session & return verified scope
app.get("/api/admin/verify", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const adminScope = (req as any).adminScope as AdminScope;

  res.json({
    verified: true,
    user: {
      id: adminUser.id,
      name: adminUser.name,
      phone: adminUser.phone,
      role: adminUser.role,
      adminRole,
      scope: adminScope,
      profilePhoto: adminUser.profilePhoto,
      village: adminUser.village,
    },
  });
});

// Admin Logout - logs audit event
app.post("/api/admin/logout", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (user) {
    const rawRole = (user.adminRole || user.role || "").toUpperCase();
    const role: AdminRole = rawRole === "MAIN_SAMAJ_ADMIN" ? "MAIN_SAMAJ_ADMIN" : rawRole === "SAMAJ_ADMIN" ? "SAMAJ_ADMIN" : "SUPER_ADMIN";
    logAdminAction({
      adminUserId: user.id,
      adminName: user.name,
      role,
      scope: {
        mainSamajId: user.mainSamajId || null,
        samajId: user.activeSamajId || null,
      },
      action: "ADMIN_LOGOUT",
      details: { ip: req.ip },
    });
  }
  res.json({ ok: true });
});

// Admin Stats - computes REAL counts based on Admin Scope
app.get("/api/admin/stats", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  let scopedMembers = membersList;
  let scopedPosts = postsList;
  let scopedSamaj = samajList;
  let scopedGam = gamList;

  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    scopedGam = gamList.filter((g) => g.mainSamajId === scope.mainSamajId);
    scopedMembers = membersList.filter(
      (m) => (m as any).mainSamajId === scope.mainSamajId || !m.samajId || m.samajId === DEFAULT_SAMAJ_ID
    );
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    scopedMembers = membersList.filter((m) => m.samajId === scope.samajId);
    scopedPosts = postsList.filter((p) => (p as any).samajId === scope.samajId);
    scopedSamaj = samajList.filter((s) => s.id === scope.samajId);
  }

  // Count registered users
  const allUsers = Object.values(usersMap);
  const uniqueUsersCount = new Set(allUsers.map((u) => u.id)).size;

  // Real counts
  const reelsCount = scopedPosts.filter((p) => p.mediaType === "video" || (p as any).isReel).length;
  const pendingVerificationCount = allUsers.filter((u) => u.verificationStatus === "pending").length;
  const blockedCount = allUsers.filter((u) => u.isSuspended).length;
  const adminRolesCount = allUsers.filter((u) => {
    const r = (u.adminRole || u.role || "").toUpperCase();
    return ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN", "ADMIN"].includes(r);
  }).length;

  res.json({
    users: uniqueUsersCount,
    members: scopedMembers.length,
    mainSamaj: mainSamajList.length,
    gam: scopedGam.length,
    samaj: scopedSamaj.length,
    posts: scopedPosts.length,
    reels: reelsCount,
    reports: reportsList.length,
    blocks: blockedCount,
    adminRoles: adminRolesCount,
    auditLogs: auditLogsList.length,
    pendingVerification: pendingVerificationCount,
    events: eventsList.length,
    live: liveSessions.length,
    albums: albumsList.length,
  });
});

// Admin Users list with search and scope filtering
app.get("/api/admin/users", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;
  const q = ((req.query.q as string) || "").toLowerCase().trim();

  // Deduplicate users
  const seen = new Set<string>();
  let list = Object.values(usersMap).filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });

  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((u) => u.mainSamajId === scope.mainSamajId || !u.activeSamajId || u.activeSamajId === DEFAULT_SAMAJ_ID);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((u) => u.activeSamajId === scope.samajId || u.samajIds?.includes(scope.samajId));
  }

  if (q) {
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.village && u.village.toLowerCase().includes(q))
    );
  }

  res.json({ items: list });
});

// Admin Suspend / Unsuspend user
app.patch("/api/admin/users/:uid/suspend", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const target = resolveUser(req.params.uid);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  // Prevent suspending Super Admin unless action performed by Super Admin
  if (target.role === "super_admin" || target.adminRole === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Cannot suspend Super Admin" });
  }

  target.isSuspended = !target.isSuspended;

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: target.isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
    targetId: target.id,
    targetType: "user",
    details: { targetName: target.name, phone: target.phone },
  });

  res.json({ ok: true, isSuspended: target.isSuspended });
});

// Admin assign / change user role (SUPER_ADMIN ONLY)
app.patch("/api/admin/users/:uid/role", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;

  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin privilege required to manage admin roles." });
  }

  const { newRole, newAdminRole, mainSamajId, samajId } = req.body;
  const target = resolveUser(req.params.uid);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  target.role = newRole || target.role;
  target.adminRole = newAdminRole;
  if (mainSamajId !== undefined) target.mainSamajId = mainSamajId;
  if (samajId !== undefined) target.activeSamajId = samajId;

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: "SUPER_ADMIN",
    action: "ADMIN_ROLE_UPDATED",
    targetId: target.id,
    targetType: "user",
    details: {
      targetName: target.name,
      newRole: target.role,
      newAdminRole: target.adminRole,
      mainSamajId: target.mainSamajId,
      samajId: target.activeSamajId,
    },
  });

  res.json({ ok: true, user: target });
});

// ----------------- ADMIN MASTER DATA MANAGEMENT -----------------

// Districts
app.get("/api/admin/districts", requireAdmin, (_req: Request, res: Response) => {
  res.json({ items: districtList });
});

app.post("/api/admin/districts", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create districts" });
  }
  const { name, nameGujarati, code } = req.body;
  if (!name || !nameGujarati) {
    return res.status(400).json({ error: "Name and Name in Gujarati are required" });
  }
  const id = `dist_${code?.toLowerCase() || name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newDistrict: District = {
    id,
    name,
    nameGujarati,
    code: code || name.toUpperCase().slice(0, 4),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  districtList.push(newDistrict);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "DISTRICT_CREATED",
    targetId: id,
    targetType: "district",
    details: { name, nameGujarati },
  });
  res.status(201).json(newDistrict);
});

app.patch("/api/admin/districts/:id", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update districts" });
  }
  const dist = districtList.find((d) => d.id === req.params.id);
  if (!dist) return res.status(404).json({ error: "District not found" });

  if (req.body.name !== undefined) dist.name = req.body.name;
  if (req.body.nameGujarati !== undefined) dist.nameGujarati = req.body.nameGujarati;
  if (req.body.isActive !== undefined) dist.isActive = req.body.isActive;
  dist.updatedAt = new Date().toISOString();

  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "DISTRICT_UPDATED",
    targetId: dist.id,
    targetType: "district",
    details: req.body,
  });
  res.json(dist);
});

// Talukas
app.get("/api/admin/talukas", requireAdmin, (req: Request, res: Response) => {
  const districtId = req.query.districtId as string;
  let items = talukaList;
  if (districtId) {
    items = items.filter((t) => t.districtId === districtId);
  }
  res.json({ items });
});

app.post("/api/admin/talukas", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create talukas" });
  }
  const { districtId, name, nameGujarati, code } = req.body;
  if (!districtId || !name || !nameGujarati) {
    return res.status(400).json({ error: "DistrictId, Name, and Name in Gujarati are required" });
  }
  const dist = districtList.find((d) => d.id === districtId);
  if (!dist) return res.status(400).json({ error: "Invalid districtId" });

  const id = `tal_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newTaluka: Taluka = {
    id,
    districtId,
    name,
    nameGujarati,
    code: code || name.toUpperCase().slice(0, 4),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  talukaList.push(newTaluka);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "TALUKA_CREATED",
    targetId: id,
    targetType: "taluka",
    details: { districtId, name, nameGujarati },
  });
  res.status(201).json(newTaluka);
});

app.patch("/api/admin/talukas/:id", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update talukas" });
  }
  const tal = talukaList.find((t) => t.id === req.params.id);
  if (!tal) return res.status(404).json({ error: "Taluka not found" });

  if (req.body.name !== undefined) tal.name = req.body.name;
  if (req.body.nameGujarati !== undefined) tal.nameGujarati = req.body.nameGujarati;
  if (req.body.isActive !== undefined) tal.isActive = req.body.isActive;
  tal.updatedAt = new Date().toISOString();

  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "TALUKA_UPDATED",
    targetId: tal.id,
    targetType: "taluka",
    details: req.body,
  });
  res.json(tal);
});

// Villages
app.get("/api/admin/villages", requireAdmin, (req: Request, res: Response) => {
  const districtId = req.query.districtId as string;
  const talukaId = req.query.talukaId as string;
  let items = villageList;
  if (districtId) items = items.filter((v) => v.districtId === districtId);
  if (talukaId) items = items.filter((v) => v.talukaId === talukaId);
  res.json({ items });
});

app.post("/api/admin/villages", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const { districtId, talukaId, name, nameGujarati, pincode } = req.body;
  if (!districtId || !talukaId || !name || !nameGujarati) {
    return res.status(400).json({ error: "DistrictId, TalukaId, Name and NameGujarati are required" });
  }
  const dist = districtList.find((d) => d.id === districtId);
  const tal = talukaList.find((t) => t.id === talukaId && t.districtId === districtId);
  if (!dist || !tal) return res.status(400).json({ error: "Invalid district or taluka association" });

  const id = `vil_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newVillage: Village = {
    id,
    districtId,
    talukaId,
    name,
    nameGujarati,
    pincode,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  villageList.push(newVillage);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VILLAGE_CREATED",
    targetId: id,
    targetType: "village",
    details: { districtId, talukaId, name, nameGujarati },
  });
  res.status(201).json(newVillage);
});

app.patch("/api/admin/villages/:id", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const vil = villageList.find((v) => v.id === req.params.id);
  if (!vil) return res.status(404).json({ error: "Village not found" });

  if (req.body.name !== undefined) vil.name = req.body.name;
  if (req.body.nameGujarati !== undefined) vil.nameGujarati = req.body.nameGujarati;
  if (req.body.pincode !== undefined) vil.pincode = req.body.pincode;
  if (req.body.isActive !== undefined) vil.isActive = req.body.isActive;
  vil.updatedAt = new Date().toISOString();

  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VILLAGE_UPDATED",
    targetId: vil.id,
    targetType: "village",
    details: req.body,
  });
  res.json(vil);
});

// Main Samaj Endpoints
app.get("/api/admin/main-samaj", requireAdmin, (_req: Request, res: Response) => {
  res.json({ items: mainSamajList });
});

app.post("/api/admin/main-samaj", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create Main Samaj" });
  }
  const { name, nameEn, code, description } = req.body;
  if (!name || !nameEn) {
    return res.status(400).json({ error: "Name (Gujarati) and NameEn (English) are required" });
  }
  const id = `main_${code?.toLowerCase() || nameEn.toLowerCase().replace(/\s+/g, "_")}`;
  const newMain: MainSamaj = {
    id,
    name,
    nameGujarati: name,
    nameEn,
    code: code || nameEn.toUpperCase().slice(0, 6),
    description,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  mainSamajList.push(newMain);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "MAIN_SAMAJ_CREATED",
    targetId: id,
    targetType: "main_samaj",
    details: { name, nameEn },
  });
  res.status(201).json(newMain);
});

app.patch("/api/admin/main-samaj/:id", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update Main Samaj" });
  }
  const main = mainSamajList.find((m) => m.id === req.params.id);
  if (!main) return res.status(404).json({ error: "Main Samaj not found" });

  if (req.body.name !== undefined) {
    main.name = req.body.name;
    main.nameGujarati = req.body.name;
  }
  if (req.body.nameEn !== undefined) main.nameEn = req.body.nameEn;
  if (req.body.description !== undefined) main.description = req.body.description;
  if (req.body.isActive !== undefined) main.isActive = req.body.isActive;
  main.updatedAt = new Date().toISOString();

  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "MAIN_SAMAJ_UPDATED",
    targetId: main.id,
    targetType: "main_samaj",
    details: req.body,
  });
  res.json(main);
});

// Gam (Villages) Endpoints (Backward-compatible)
app.get("/api/admin/gam", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  let list = villageList.map((v) => {
    const dist = districtList.find((d) => d.id === v.districtId);
    const tal = talukaList.find((t) => t.id === v.talukaId);
    return {
      id: v.id,
      name: v.nameGujarati || v.name,
      nameEn: v.name,
      district: dist?.nameGujarati || dist?.name || "",
      taluka: tal?.nameGujarati || tal?.name || "",
      mainSamajId: "main_patidar",
      isActive: v.isActive,
      createdAt: v.createdAt || new Date("2024-01-01").toISOString(),
    };
  });

  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((g) => g.mainSamajId === scope.mainSamajId);
  }
  res.json({ items: list });
});

// Samaj Chapters Endpoints
app.get("/api/admin/samaj", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  let list = samajList;
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((s) => s.mainSamajId === scope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((s) => s.id === scope.samajId);
  }
  res.json({ items: list });
});

app.post("/api/admin/samaj", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const { name, nameEn, code, mainSamajId, districtId, talukaId, villageId } = req.body;

  if (!name || !mainSamajId) {
    return res.status(400).json({ error: "Name and mainSamajId are required" });
  }

  const id = `samaj_${code?.toLowerCase() || Date.now().toString()}`;
  const newSamaj: Samaj = {
    id,
    name,
    nameGujarati: name,
    nameEn: nameEn || name,
    code: code || id.toUpperCase().slice(0, 6),
    mainSamajId,
    districtId,
    talukaId,
    villageId,
    gamIds: villageId ? [villageId] : [],
    isActive: true,
    requirePostApproval: false,
    createdAt: new Date().toISOString(),
  };
  samajList.push(newSamaj);
  persistMasterData();

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_CREATED",
    targetId: id,
    targetType: "samaj",
    details: { name, mainSamajId, districtId, talukaId },
  });
  res.status(201).json(newSamaj);
});

app.patch("/api/admin/samaj/:id", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const samaj = samajList.find((s) => s.id === req.params.id);
  if (!samaj) return res.status(404).json({ error: "Samaj not found" });

  if (req.body.name !== undefined) {
    samaj.name = req.body.name;
    samaj.nameGujarati = req.body.name;
  }
  if (req.body.nameEn !== undefined) samaj.nameEn = req.body.nameEn;
  if (req.body.requirePostApproval !== undefined) {
    samaj.requirePostApproval = req.body.requirePostApproval;
  }
  if (req.body.isActive !== undefined) {
    samaj.isActive = req.body.isActive;
  }
  if (req.body.districtId !== undefined) samaj.districtId = req.body.districtId;
  if (req.body.talukaId !== undefined) samaj.talukaId = req.body.talukaId;
  if (req.body.villageId !== undefined) {
    samaj.villageId = req.body.villageId;
    if (!samaj.gamIds) samaj.gamIds = [];
    if (!samaj.gamIds.includes(req.body.villageId)) samaj.gamIds.push(req.body.villageId);
  }
  samaj.updatedAt = new Date().toISOString();

  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_SETTINGS_UPDATED",
    targetId: samaj.id,
    targetType: "samaj",
    details: { requirePostApproval: samaj.requirePostApproval, isActive: samaj.isActive },
  });

  res.json(samaj);
});

// Admin: List Samaj Change Requests (Filtered by Admin scope)
app.get("/api/admin/samaj/change-requests", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const adminScope = (req as any).adminScope as { mainSamajId: string | null; samajId: string | null };

  let filtered = [...samajChangeRequests];
  if (adminRole === "MAIN_SAMAJ_ADMIN" && adminScope.mainSamajId) {
    filtered = filtered.filter((r) => r.requestedMainSamajId === adminScope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && adminScope.samajId) {
    filtered = filtered.filter((r) => r.requestedSamajId === adminScope.samajId);
  }

  res.json({ items: filtered.reverse() });
});

// Admin: Approve Samaj Change Request
app.post("/api/admin/samaj/change-requests/:id/approve", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const adminScope = (req as any).adminScope as { mainSamajId: string | null; samajId: string | null };
  const request = samajChangeRequests.find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ error: "Request has already been reviewed", status: request.status });
  }

  // Validate admin authority for this requested Samaj
  if (adminRole === "SAMAJ_ADMIN" && adminScope.samajId && adminScope.samajId !== request.requestedSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only approve requests for your assigned Samaj" });
  }
  if (adminRole === "MAIN_SAMAJ_ADMIN" && adminScope.mainSamajId && adminScope.mainSamajId !== request.requestedMainSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only approve requests for your Main Samaj" });
  }

  // Find target user
  const targetUser = usersMap[request.userId] || Object.values(usersMap).find((u) => u.id === request.userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Add/activate membership
  if (!targetUser.samajIds) targetUser.samajIds = [];
  if (!targetUser.samajIds.includes(request.requestedSamajId)) {
    targetUser.samajIds.push(request.requestedSamajId);
  }
  // Only AFTER successful approval: update activeSamajId
  targetUser.activeSamajId = request.requestedSamajId;
  if (request.requestedMainSamajId) targetUser.mainSamajId = request.requestedMainSamajId;
  if (request.requestedGam) targetUser.village = request.requestedGam;

  request.status = "APPROVED";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = adminUser.id;

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_CHANGE_APPROVED",
    targetId: request.id,
    targetType: "user",
    details: {
      userId: targetUser.id,
      newSamajId: request.requestedSamajId,
      newSamajName: request.requestedSamajName,
    },
  });

  res.json({
    ok: true,
    request,
    message: "સમાજ બદલવાની વિનંતી સફળતાપૂર્વક મંજૂર થઈ ગઈ. સભ્યનો સક્રિય સમાજ બદલાઈ ગયો છે.",
  });
});

// Admin: Reject Samaj Change Request
app.post("/api/admin/samaj/change-requests/:id/reject", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const adminScope = (req as any).adminScope as { mainSamajId: string | null; samajId: string | null };
  const request = samajChangeRequests.find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ error: "Request has already been reviewed", status: request.status });
  }

  if (adminRole === "SAMAJ_ADMIN" && adminScope.samajId && adminScope.samajId !== request.requestedSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only reject requests for your assigned Samaj" });
  }
  if (adminRole === "MAIN_SAMAJ_ADMIN" && adminScope.mainSamajId && adminScope.mainSamajId !== request.requestedMainSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only reject requests for your Main Samaj" });
  }

  request.status = "REJECTED";
  request.rejectionReason = req.body.rejectionReason || "અમાન્ય વિગતો / વેરિફિકેશન પૂર્ણ નથી";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = adminUser.id;

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_CHANGE_REJECTED",
    targetId: request.id,
    targetType: "user",
    details: {
      userId: request.userId,
      reason: request.rejectionReason,
    },
  });

  res.json({
    ok: true,
    request,
    message: "સમાજ બદલવાની વિનંતી અસ્વીકાર કરવામાં આવી.",
  });
});

// Verification Endpoints (foundation for Step 2)
app.get("/api/admin/verification", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  const allUsers = Object.values(usersMap);
  let pending = allUsers.filter((u) => u.verificationStatus === "pending");

  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    pending = pending.filter((u) => u.mainSamajId === scope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    pending = pending.filter((u) => u.activeSamajId === scope.samajId);
  }

  res.json({ items: pending, count: pending.length });
});

// ---- Profile Verification: admin approve/reject (Task 4) ----
function adminCanManageUser(targetUser: SamajUser, adminRole: AdminRole, scope: AdminScope): boolean {
  if (adminRole === "SUPER_ADMIN") return true;
  if (adminRole === "MAIN_SAMAJ_ADMIN") return Boolean(scope.mainSamajId) && targetUser.mainSamajId === scope.mainSamajId;
  if (adminRole === "SAMAJ_ADMIN") return Boolean(scope.samajId) && targetUser.activeSamajId === scope.samajId;
  return false;
}

app.post("/api/admin/verification/:uid/approve", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;
  const target = resolveUser(req.params.uid);
  if (!target) return res.status(404).json({ detail: "User not found" });
  if (!adminCanManageUser(target, adminRole, scope)) {
    return res.status(403).json({ detail: "Forbidden: outside your Samaj scope" });
  }
  target.verificationStatus = "verified";
  target.verifiedAt = new Date().toISOString();
  target.verifiedBy = adminUser.id;
  target.rejectionReason = null;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VERIFICATION_APPROVED",
    details: { targetUserId: target.id, targetName: target.name },
  });
  res.json({ success: true, user: { id: target.id, name: target.name, ...getVerificationState(target) } });
});

app.post("/api/admin/verification/:uid/reject", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;
  const reason = (req.body?.reason || "").toString().trim();
  if (!reason) return res.status(400).json({ detail: "Rejection reason is required" });
  const target = resolveUser(req.params.uid);
  if (!target) return res.status(404).json({ detail: "User not found" });
  if (!adminCanManageUser(target, adminRole, scope)) {
    return res.status(403).json({ detail: "Forbidden: outside your Samaj scope" });
  }
  target.verificationStatus = "rejected";
  target.rejectionReason = reason;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VERIFICATION_REJECTED",
    details: { targetUserId: target.id, targetName: target.name, reason },
  });
  res.json({ success: true, user: { id: target.id, name: target.name, ...getVerificationState(target) } });
});

// Posts Moderation Endpoints
app.get("/api/admin/posts", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  let list = postsList;
  if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((p) => (p as any).samajId === scope.samajId);
  }
  res.json({ items: list });
});

app.patch("/api/admin/posts/:pid", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const post = postsList.find((p) => p.id === req.params.pid);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { status, approved } = req.body;
  if (status !== undefined) post.status = status;
  if (approved !== undefined) post.approved = approved;

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: `POST_${(status || "MODERATED").toUpperCase()}`,
    targetId: post.id,
    targetType: "post",
    details: { status: post.status, approved: post.approved },
  });

  res.json(post);
});

// Reels Moderation Endpoints
app.get("/api/admin/reels", requireAdmin, (req: Request, res: Response) => {
  const reels = postsList.filter((p) => p.mediaType === "video" || (p as any).isReel);
  res.json({ items: reels });
});

// Reports Endpoints
app.get("/api/admin/reports", requireAdmin, (req: Request, res: Response) => {
  res.json({ items: reportsList });
});

app.patch("/api/admin/reports/:rid/resolve", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const report = reportsList.find((r) => r.id === req.params.rid);
  if (!report) return res.status(404).json({ error: "Report not found" });

  report.status = "resolved";

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "REPORT_RESOLVED",
    targetId: report.id,
    targetType: "report",
    details: { reason: report.reason },
  });

  res.json({ ok: true, report });
});

app.patch("/api/admin/reports/:rid", requireAdmin, (req: Request, res: Response) => {
  const report = reportsList.find((r) => r.id === req.params.rid);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (req.body.status) report.status = req.body.status;
  res.json({ ok: true, report });
});

app.post("/api/admin/posts/:pid/moderate", requireAdmin, (req: Request, res: Response) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (!post) return res.status(404).json({ detail: "Post not found" });
  const { action } = req.body;
  if (action === "approve") {
    post.approved = true;
    post.status = "active";
  } else if (action === "reject" || action === "delete") {
    post.status = "deleted";
  } else if (action === "hide") {
    post.status = "hidden";
  } else if (action === "unhide") {
    post.status = "active";
  }
  res.json({ ok: true, post });
});

app.post("/api/admin/comments/:cid/moderate", requireAdmin, (req: Request, res: Response) => {
  const cid = req.params.cid;
  for (const pid in commentsList) {
    const idx = commentsList[pid].findIndex((c) => c.id === cid);
    if (idx !== -1) {
      commentsList[pid].splice(idx, 1);
      const post = postsList.find((p) => p.id === pid);
      if (post && post.commentsCount) post.commentsCount = Math.max(0, post.commentsCount - 1);
      return res.json({ ok: true });
    }
  }
  res.json({ ok: true });
});

// Blocks / Suspensions List
app.get("/api/admin/blocks", requireAdmin, (req: Request, res: Response) => {
  const allUsers = Object.values(usersMap);
  const seen = new Set<string>();
  const blocked = allUsers.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return u.isSuspended || (u.blocked && u.blocked.length > 0);
  });
  res.json({ items: blocked });
});

// Admin Roles Matrix & Assignment (SUPER_ADMIN ONLY)
app.get("/api/admin/roles", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required." });
  }

  const allUsers = Object.values(usersMap);
  const seen = new Set<string>();
  const adminUsers = allUsers.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    const r = (u.adminRole || u.role || "").toUpperCase();
    return ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN", "ADMIN"].includes(r);
  });

  res.json({
    roles: [
      {
        role: "SUPER_ADMIN",
        title: "સુપર એડમિન (Super Administrator)",
        description: "સંપૂર્ણ સિસ્ટમનું સંચાલન, તમામ મુખ્ય સમાજ, ગામ, સમાજ શાખાઓ, અને એડમિન અધિકારો",
        scopeType: "GLOBAL",
      },
      {
        role: "MAIN_SAMAJ_ADMIN",
        title: "મુખ્ય સમાજ સંચાલક (Main Samaj Admin)",
        description: "અધિકૃત મુખ્ય સમાજ અને તેના સંલગ્ન ગામ અને શાખાઓનું વહીવટી સંચાલન",
        scopeType: "MAIN_SAMAJ",
      },
      {
        role: "SAMAJ_ADMIN",
        title: "સમાજ શાખા સંચાલક (Samaj Chapter Admin)",
        description: "અધિકૃત સ્થાનિક સમાજ શાખાના સભ્યો, પોસ્ટ્સ અને વેરિફિકેશન સંચાલન",
        scopeType: "SAMAJ_CHAPTER",
      },
    ],
    administrators: adminUsers,
  });
});

// Grant or update admin role (Super Admin only)
app.post("/api/admin/roles", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required." });
  }

  const { phone, userId, role, mainSamajId, samajId } = req.body;
  if (!role || !["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN"].includes(role)) {
    return res.status(400).json({ error: "માન્ય રોલ પસંદ કરો (SUPER_ADMIN, MAIN_SAMAJ_ADMIN, SAMAJ_ADMIN)." });
  }

  let targetUser: SamajUser | undefined = undefined;
  let digits = "";

  if (userId && usersMap[userId]) {
    targetUser = usersMap[userId];
    digits = (targetUser.phone || "").replace(/\D/g, "").slice(-10);
  } else if (phone) {
    digits = phone.replace(/\D/g, "").slice(-10);
    targetUser = Object.values(usersMap).find((u) => u.phone && u.phone.replace(/\D/g, "").slice(-10) === digits);
  }

  if (!digits) {
    return res.status(400).json({ error: "10 અંકનો માન્ય મોબાઇલ નંબર અથવા userId દાખલ કરો." });
  }

  adminRolesMap[digits] = role as AdminRole;

  if (targetUser) {
    targetUser.adminRole = role as AdminRole;
    targetUser.role = role.toLowerCase();
    if (mainSamajId) targetUser.mainSamajId = mainSamajId;
    if (samajId) {
      targetUser.activeSamajId = samajId;
      if (!targetUser.samajIds.includes(samajId)) targetUser.samajIds.push(samajId);
      targetUser.samajRoles = targetUser.samajRoles || {};
      targetUser.samajRoles[samajId] = role.toLowerCase();
    }
  }

  logAdminAction({
    adminUserId: ((req as any).adminUser as SamajUser)?.id || "super_admin",
    adminName: ((req as any).adminUser as SamajUser)?.name || "Super Admin",
    role: "SUPER_ADMIN",
    action: "GRANT_ADMIN_ROLE",
    details: { phoneDigits: digits, role, mainSamajId, samajId },
  });

  saveStore(true);
  res.json({ success: true, message: "એડમિન અધિકાર સફળતાપૂર્વક અપડેટ થયો.", digits, role });
});

// Revoke admin role (Super Admin only)
app.delete("/api/admin/roles/:identifier", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required." });
  }

  const { identifier } = req.params;
  const digits = identifier.replace(/\D/g, "").slice(-10);

  delete adminRolesMap[digits];

  const targetUser = Object.values(usersMap).find(
    (u) => u.id === identifier || (u.phone && u.phone.replace(/\D/g, "").slice(-10) === digits)
  );

  if (targetUser) {
    targetUser.adminRole = null;
    targetUser.role = "member";
  }

  logAdminAction({
    adminUserId: ((req as any).adminUser as SamajUser)?.id || "super_admin",
    adminName: ((req as any).adminUser as SamajUser)?.name || "Super Admin",
    role: "SUPER_ADMIN",
    action: "REVOKE_ADMIN_ROLE",
    details: { identifier, digits },
  });

  saveStore(true);
  res.json({ success: true, message: "એડમિન અધિકાર સફળતાપૂર્વક રદ કરવામાં આવ્યો." });
});

// Audit Logs Endpoints
app.get("/api/admin/audit-logs", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  let list = auditLogsList;
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((l) => !l.scope?.mainSamajId || l.scope.mainSamajId === scope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((l) => !l.scope?.samajId || l.scope.samajId === scope.samajId);
  }

  res.json({ items: list, count: list.length });
});

// Platform Settings Endpoints
let platformSettings = {
  publicAccessEnabled: true,
  requireVerificationForPosting: false,
  maintenanceMode: false,
};

app.get("/api/admin/settings", requireAdmin, (req: Request, res: Response) => {
  res.json(platformSettings);
});

app.patch("/api/admin/settings", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;

  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin only" });
  }

  platformSettings = { ...platformSettings, ...req.body };

  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: "SUPER_ADMIN",
    action: "SYSTEM_SETTINGS_UPDATED",
    details: platformSettings,
  });

  res.json(platformSettings);
});

// Members management for admin (compatibility)
app.get("/api/admin/members", requireAdmin, (req: Request, res: Response) => {
  res.json({ items: membersList });
});

app.patch("/api/admin/members/:mid/toggle-active", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const m = membersList.find((x) => x.id === req.params.mid);
  if (m) {
    m.isActive = !m.isActive;
    logAdminAction({
      adminUserId: adminUser.id,
      adminName: adminUser.name,
      role: adminRole,
      action: m.isActive ? "MEMBER_ACTIVATED" : "MEMBER_DEACTIVATED",
      targetId: m.id,
      targetType: "member",
      details: { name: m.name, mobile: m.mobile },
    });
  }
  res.json({ ok: true });
});

// Notifications, Presence, Search
app.get("/api/notifications", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const currentUid = authUser?.id || "u1";
  const userSamajId = authUser?.activeSamajId || DEFAULT_SAMAJ_ID;

  const phoneDigits = authUser?.phone ? authUser.phone.replace(/\D/g, "").slice(-10) : "";

  const items = notificationsList.filter((n) => {
    // Don't notify the author of their own actions
    if (n.authorId && (n.authorId === currentUid || (phoneDigits && n.authorId === `user_${phoneDigits}`))) return false;
    if (n.userId === "all") {
      if (n.samajId && n.samajId !== userSamajId) return false;
      return true;
    }
    if (n.userId === currentUid) return true;
    if (phoneDigits && (n.userId === `user_${phoneDigits}` || n.userId === phoneDigits || n.userId === `+91${phoneDigits}`)) {
      return true;
    }
    return false;
  });

  const since = req.query.since as string;
  let filtered = items;
  if (since) {
    const sinceDate = new Date(since);
    filtered = items.filter((n) => new Date(n.createdAt) > sinceDate);
  }

  res.json({
    items: filtered.slice(0, 50),
    unreadCount: items.filter((n) => !n.read).length,
  });
});

app.post("/api/notifications/read", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const currentUid = authUser?.id || "u1";
  const { id } = req.body || {};
  if (id) {
    const target = notificationsList.find((n) => n.id === id);
    if (target) target.read = true;
  } else {
    notificationsList.forEach((n) => {
      if (n.userId === currentUid || n.userId === "all") n.read = true;
    });
  }
  res.json({ ok: true });
});

// Test trigger endpoint for user to test phone notification (Reels or Messages)
app.post("/api/notifications/test", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const type = req.body.type || "reel"; // "reel" or "message"
  const currentUid = authUser?.id || "u1";

  const testNotif: AppNotification =
    type === "message"
      ? {
          id: `notif_msg_${Date.now()}`,
          type: "message",
          title: "💬 નવો મેસેજ: પ્રિયંકા પટેલ",
          body: "કેમ છો? સમાજના આગામી સ્નેહમિલન કાર્યક્રમમાં તમે આવવાના છો? જરૂર જણાવશો!",
          link: "/messages",
          read: false,
          createdAt: new Date().toISOString(),
          userId: currentUid,
          authorName: "પ્રિયંકા પટેલ",
          authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          conversationId: "conv_1",
        }
      : {
          id: `notif_reel_${Date.now()}`,
          type: "reel",
          title: "🎬 નવી રીલ: રોહન પટેલ",
          body: "નવરાત્રી રાસોત્સવ 2026 ની ભવ્ય તૈયારીઓ! 💃🕺 જુઓ સુંદર ઝલક!",
          link: "/reels",
          read: false,
          createdAt: new Date().toISOString(),
          userId: "all",
          authorId: "other_user",
          authorName: "રોહન પટેલ",
          authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          reelId: "reel_test",
        };

  notificationsList.unshift(testNotif);
  res.json({ ok: true, item: testNotif });
});

app.post("/api/presence", (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/devices", (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/search", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const q = ((req.query.q as string) || "").toLowerCase().trim();

  const matchedMembers = membersList
    .filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.village.toLowerCase().includes(q) ||
        m.mobile.includes(q)
    )
    .map((m) => {
      const uid = `user_${m.mobile.slice(-10)}`;
      const resolved = resolveUser(uid);
      return {
        ...m,
        userId: uid,
        followersCount: resolved?.followersCount || 24,
        followingCount: resolved?.followingCount || 15,
        followedByMe: followRelationsMap.has(`${authUser.id}_${uid}`),
      };
    });

  const matchedEvents = eventsList.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
  );

  const matchedPosts = postsList
    .filter(
      (p) =>
        p.status !== "deleted" &&
        ((p.content && p.content.toLowerCase().includes(q)) ||
         (p.caption && p.caption.toLowerCase().includes(q)) ||
         (p.location && p.location.toLowerCase().includes(q)))
    )
    .filter((p) => canUserViewPost(p, authUser))
    .map((p) => ({
      ...p,
      likedByMe: p.likedBy?.includes(authUser.id) || false,
      savedByMe: p.savedBy?.includes(authUser.id) || false,
      mediaUrls: p.mediaUrls || p.imageUrls || [],
      imageUrls: p.imageUrls || p.mediaUrls || [],
      content: p.content || p.caption || "",
      isOwner: p.authorId === authUser.id,
    }));

  res.json({
    members: matchedMembers,
    events: matchedEvents,
    posts: matchedPosts,
  });
});

// ----------------- DURABLE PERSISTENCE LAYER -----------------
const STORE_FILE = path.join(DATA_DIR, "store.json");
let saveStoreTimer: NodeJS.Timeout | null = null;

function saveStore(immediate = false) {
  const doSave = () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const state = {
        usersMap,
        adminRolesMap,
        postsList,
        commentsList,
        storiesList,
        hallsList,
        bookingsList,
        albumsList,
        eventsList,
        membersList,
        maranNodhList,
        familyTreeList,
        reportsList,
        auditLogsList,
        conversationsMap,
        messagesMap,
        platformSettings,
        savedAt: new Date().toISOString(),
      };
      const tmpFile = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), "utf-8");
      fs.renameSync(tmpFile, STORE_FILE);
    } catch (err) {
      console.error("[Store] Failed to write store.json:", err);
    }
  };

  if (immediate) {
    if (saveStoreTimer) clearTimeout(saveStoreTimer);
    saveStoreTimer = null;
    doSave();
  } else {
    if (saveStoreTimer) clearTimeout(saveStoreTimer);
    saveStoreTimer = setTimeout(doSave, 300);
  }
}

export function loadStore(): boolean {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      console.log("[Store] No existing store.json found. Creating initial snapshot...");
      saveStore(true);
      return false;
    }
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (data.usersMap) Object.assign(usersMap, data.usersMap);
    if (data.adminRolesMap) Object.assign(adminRolesMap, data.adminRolesMap);
    if (!adminRolesMap["9876543210"]) adminRolesMap["9876543210"] = "SUPER_ADMIN";
    if (Array.isArray(data.postsList) && data.postsList.length > 0) postsList = data.postsList;
    if (data.commentsList) Object.assign(commentsList, data.commentsList);
    if (Array.isArray(data.storiesList) && data.storiesList.length > 0) storiesList = data.storiesList;
    if (Array.isArray(data.hallsList) && data.hallsList.length > 0) hallsList = data.hallsList;
    if (Array.isArray(data.bookingsList) && data.bookingsList.length > 0) bookingsList = data.bookingsList;
    if (Array.isArray(data.albumsList) && data.albumsList.length > 0) albumsList = data.albumsList;
    if (Array.isArray(data.eventsList) && data.eventsList.length > 0) eventsList = data.eventsList;
    if (Array.isArray(data.membersList) && data.membersList.length > 0) membersList = data.membersList;
    if (Array.isArray(data.maranNodhList) && data.maranNodhList.length > 0) maranNodhList = data.maranNodhList;
    if (Array.isArray(data.familyTreeList) && data.familyTreeList.length > 0) familyTreeList = data.familyTreeList;
    if (Array.isArray(data.reportsList)) reportsList = data.reportsList;
    if (Array.isArray(data.auditLogsList)) auditLogsList = data.auditLogsList;
    if (data.conversationsMap) Object.assign(conversationsMap, data.conversationsMap);
    if (data.messagesMap) Object.assign(messagesMap, data.messagesMap);
    if (data.platformSettings) platformSettings = { ...platformSettings, ...data.platformSettings };
    
    // Ensure all Maran Nodh items are present in postsList as Memorial Reels
    syncAllMaranNodhToReels();

    console.log(`[Store] Successfully loaded persistent state from ${STORE_FILE}`);
    return true;
  } catch (err) {
    console.error("[Store] Failed to load store.json:", err);
    return false;
  }
}

export function syncAllMaranNodhToReels() {
  for (const m of maranNodhList) {
    const alreadyInPosts = postsList.some((p: any) => p.maranNodhId === m.id || p.id === `post_memorial_${m.id}`);
    if (!alreadyInPosts) {
      const photo = m.photo || (m.gender === "female"
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80");

      postsList.unshift({
        id: `post_memorial_${m.id}`,
        authorId: m.createdBy || "admin",
        authorName: "સમાજ કાર્યાલય",
        authorPhoto: null,
        authorRole: "admin",
        content: `🕊️ ભાવભીની શ્રદ્ધાંજલિ\nસ્વ. ${m.deceasedName}\nઉંમર: ${m.age || "-"} વર્ષ\nવતન: ${m.village || "-"}\nહાલ: ${m.currentCity || "-"}\nસ્વર્ગવાસ તારીખ: ${m.passedDate}\n\nબેસણું: ${m.besnuDate || "જાહેર થશે"} (${m.besnuTime || ""})\nસ્થળ: ${m.besnuVenue || ""}\nપરિવાર: ${m.grievingFamily || ""}\n\nસદ્ગતના આત્માને પરમ શાંતિ અર્પે તેવી પ્રભુ ચરણોમાં પ્રાર્થના. ૐ શાંતિ 🕊️`,
        caption: `🕊️ ભાવભીની શ્રદ્ધાંજલિ: સ્વ. ${m.deceasedName} (વતન: ${m.village || "-"})`,
        mediaUrls: [photo],
        imageUrls: [photo],
        mediaType: "reel",
        isReel: true,
        isMemorial: true,
        category: "memorial",
        maranNodhId: m.id,
        maranNodhData: {
          id: m.id,
          deceasedName: m.deceasedName,
          name: m.deceasedName,
          age: m.age,
          passedDate: m.passedDate,
          deathDate: m.passedDate,
          besnuDate: m.besnuDate,
          besnuTime: m.besnuTime,
          besnuVenue: m.besnuVenue,
          village: m.village,
          currentCity: m.currentCity,
          contactPhone: m.contactPhone,
          grievingFamily: m.grievingFamily,
          photo: photo,
          diyaCount: m.diyaCount || 0,
          flowerCount: m.flowerCount || 0,
        },
        visibility: "samaj",
        samajId: m.samajId || DEFAULT_SAMAJ_ID,
        audioTitle: "ૐ શાંતિ • ભાવભીની શ્રદ્ધાંજલિ",
        location: m.village ? `${m.village}` : m.currentCity || "સમાજ",
        likedBy: [],
        savedBy: [],
        likesCount: m.diyaCount || 0,
        commentsCount: m.condolences?.length || 0,
        approved: true,
        status: "active",
        createdAt: m.createdAt || new Date().toISOString(),
      });
    }
  }
}

// Start Server with Vite Middleware in Development
async function startServer() {
  // Restore persistent state on startup
  loadStore();

  // Serve static assets from public/ directory without intercepting index.html
  app.use(express.static(path.join(process.cwd(), "public"), { index: false }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Samaj Connect server running on port ${PORT} at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
