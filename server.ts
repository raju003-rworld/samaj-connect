import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// In-memory data storage (simulating Firestore database for Samaj Connect)
export type AdminRole = "SUPER_ADMIN" | "MAIN_SAMAJ_ADMIN" | "SAMAJ_ADMIN";

export interface AdminScope {
  mainSamajId?: string | null;
  samajId?: string | null;
}

export interface MainSamaj {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Gam {
  id: string;
  name: string;
  nameEn: string;
  district: string;
  taluka?: string;
  mainSamajId: string;
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

interface SamajUser {
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
  verificationStatus?: "pending" | "verified" | "rejected";
  mainSamajId?: string;
  gam?: string;
}

const DEFAULT_SAMAJ_ID = "default";

const mainSamajList: MainSamaj[] = [
  {
    id: "main_patidar",
    name: "મુખ્ય સમાજ (શ્રી પાટીદાર સમાજ કેન્દ્રીય સંસ્થા)",
    nameEn: "Main Samaj (Shree Patidar Samaj Central Apex)",
    code: "PATIDAR_APEX",
    description: "સમસ્ત પાટીદાર સમાજ કેન્દ્રીય સંસ્થા અને સંચાલન મંડળ",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
];

const gamList: Gam[] = [
  {
    id: "gam_unjha",
    name: "ઊંઝા",
    nameEn: "Unjha",
    district: "મહેસાણા",
    taluka: "ઊંઝા",
    mainSamajId: "main_patidar",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "gam_visnagar",
    name: "વિસનગર",
    nameEn: "Visnagar",
    district: "મહેસાણા",
    taluka: "વિસનગર",
    mainSamajId: "main_patidar",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "gam_kadi",
    name: "કડી",
    nameEn: "Kadi",
    district: "મહેસાણા",
    taluka: "કડી",
    mainSamajId: "main_patidar",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "gam_mehsana",
    name: "મહેસાણા",
    nameEn: "Mehsana",
    district: "મહેસાણા",
    taluka: "મહેસાણા",
    mainSamajId: "main_patidar",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
];

const reportsList: ReportItem[] = [];
const auditLogsList: AdminAuditLog[] = [];

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

const samajList = [
  {
    id: DEFAULT_SAMAJ_ID,
    name: "મુખ્ય સમાજ (શ્રી પાટીદાર સમાજ)",
    nameEn: "Main Samaj (Shree Patidar Samaj)",
    code: "MAIN",
    isActive: true,
    requirePostApproval: false,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "samaj_ahmedabad",
    name: "અમદાવાદ સમાજ શાખા",
    nameEn: "Ahmedabad Samaj Chapter",
    code: "AHM01",
    isActive: true,
    requirePostApproval: false,
    createdAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "samaj_surat",
    name: "સુરત સમાજ પરિવાર",
    nameEn: "Surat Samaj Parivar",
    code: "SUR01",
    isActive: true,
    requirePostApproval: false,
    createdAt: new Date("2024-03-01").toISOString(),
  }
];

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

let postsList = [
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
    visibility: "samaj",
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

// Flag for controlling development/demo OTP flow (false by default to enable real Firebase Phone Auth)
const DEV_AUTH_ENABLED = process.env.DEV_AUTH_ENABLED === "true";

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

// Server-side admin allowlist: verified phone (last 10 digits) -> AdminRole. Source of truth.
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
const ADMIN_ALLOWLIST = parseAdminAllowlist(process.env.ADMIN_ALLOWLIST || "+919925514713:SUPER_ADMIN");

function allowlistRole(phone: string | undefined | null): AdminRole | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").slice(-10);
  return ADMIN_ALLOWLIST[digits] || null;
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
  disappearingDuration?: "off" | "1m" | "5m" | "1h" | "1d";
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
  disappearingDuration?: "off" | "1m" | "5m" | "1h" | "1d";
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
    case "1m": return 60 * 1000;
    case "5m": return 5 * 60 * 1000;
    case "1h": return 60 * 60 * 1000;
    case "1d": return 24 * 60 * 60 * 1000;
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

function buildUser(uid: string, phone: string, name: string, member?: any): SamajUser {
  return {
    id: uid,
    phone,
    name,
    role: "member",
    adminRole: null,
    profilePhoto: member?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    village: member?.village || "અમદાવાદ",
    district: member?.district || "અમદાવાદ",
    bio: member ? `${member.education || "સભ્ય"} · ${member.village}` : "સમાજ સભ્ય",
    samajIds: [member?.samajId || DEFAULT_SAMAJ_ID],
    samajRoles: { [member?.samajId || DEFAULT_SAMAJ_ID]: "member" },
    activeSamajId: member?.samajId || DEFAULT_SAMAJ_ID,
    followersCount: member ? 24 : 0,
    followingCount: member ? 15 : 0,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "verified",
    mainSamajId: "main_patidar",
    gam: member?.village || "અમદાવાદ",
  };
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
  const member = membersList.find((m) => m.mobile.replace(/\D/g, "").slice(-10) === phoneDigits);
  usersMap[uid] = buildUser(uid, member ? `+91${member.mobile}` : `+91${phoneDigits}`, member ? member.name : `સભ્ય (${phoneDigits.slice(-4)})`, member);
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  if (DEV_AUTH_ENABLED && token.startsWith("mock-token-")) {
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
    const member = membersList.find((m) => m.mobile.replace(/\D/g, "").slice(-10) === phoneDigits);
    u = buildUser(uid, rawPhone || `+91${phoneDigits}`, name || (member ? member.name : `સભ્ય`), member);
    usersMap[uid] = u;
  } else if (name && (!u.name || u.name.startsWith("સભ્ય") || u.name.startsWith("Member"))) {
    u.name = name;
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
  const { phone, name } = req.body;
  const targetPhone = phone || currentUser.phone;
  const phoneDigits = targetPhone.replace(/\D/g, "").slice(-10);
  const uid = `user_${phoneDigits || "demo"}`;

  if (!usersMap[uid]) {
    usersMap[uid] = {
      id: uid,
      phone: targetPhone,
      name: name || `સભ્ય (${targetPhone.slice(-4)})`,
      role: (uid === "user_9876543210" || uid === "user_demo_admin") ? "super_admin" : "member",
      adminRole: (uid === "user_9876543210" || uid === "user_demo_admin") ? "SUPER_ADMIN" : null,
      profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      village: "અમદાવાદ",
      district: "અમદાવાદ",
      bio: "સમાજ સભ્ય",
      samajIds: [DEFAULT_SAMAJ_ID],
      samajRoles: { [DEFAULT_SAMAJ_ID]: "member" },
      activeSamajId: DEFAULT_SAMAJ_ID,
      followersCount: 0,
      followingCount: 0,
      isSuspended: false,
      blocked: [],
      followers: [],
      following: [],
      verificationStatus: "verified",
      mainSamajId: "main_patidar",
      gam: "અમદાવાદ",
    };
  } else if (name) {
    usersMap[uid].name = name;
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
  res.json(user);
});

app.patch("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Explicitly ignore/strip any administrative attributes
  const allowed = ["name", "profilePhoto", "village", "district", "bio"];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      (user as any)[k] = req.body[k];
    }
  }
  res.json(user);
});

// Samaj Endpoints
app.get("/api/samaj", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  res.json({
    items: samajList.filter((s) => s.isActive),
    mine: authUser?.samajIds || [DEFAULT_SAMAJ_ID],
    active: authUser?.activeSamajId || DEFAULT_SAMAJ_ID,
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

// ----------------- CHAT & MESSAGING SYSTEM (POINT 1) -----------------

// User Search for New Chat & Mentions
app.get("/api/users/search", (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  const authUser = getAuthUser(req);
  const items = Object.values(usersMap).filter((u) => {
    if (u.id === authUser.id) return false;
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
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

// Helper to check conversation membership
function requireConvMember(cid: string, user: SamajUser): Conversation {
  const conv = conversationsMap[cid];
  if (!conv || !conv.memberIds.includes(user.id)) {
    throw new Error("NOT_A_MEMBER");
  }
  return conv;
}

// Conversations List
app.get("/api/conversations", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  let list = Object.values(conversationsMap).filter((c) => c.memberIds.includes(user.id));

  if (q) {
    list = list.filter((c) => {
      if (c.type === "group") return (c.name || "").toLowerCase().includes(q);
      const other = Object.entries(c.members)
        .filter(([k]) => k !== user.id)
        .map(([, m]) => m.name)
        .join(" ");
      return other.toLowerCase().includes(q);
    });
  }

  list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  res.json({ items: list });
});

// Open / Create Direct Conversation
app.post("/api/conversations/direct", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { userId } = req.body;
  if (!userId || userId === user.id) {
    return res.status(400).json({ detail: "Invalid userId" });
  }
  const other = usersMap[userId];
  if (!other) {
    return res.status(404).json({ detail: "User not found" });
  }

  // Security & Block Check
  if ((user.blocked || []).includes(userId) || (other.blocked || []).includes(user.id)) {
    return res.status(403).json({ detail: "Blocked: Cannot open conversation" });
  }

  const key = `d_${[user.id, userId].sort().join("_")}`;
  if (!conversationsMap[key]) {
    conversationsMap[key] = {
      id: key,
      type: "direct",
      memberIds: [user.id, userId],
      members: {
        [user.id]: { id: user.id, name: user.name, photo: user.profilePhoto },
        [userId]: { id: userId, name: other.name, photo: other.profilePhoto },
      },
      samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      unread: { [user.id]: 0, [userId]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null,
    };
    messagesMap[key] = [];
  }
  res.json(conversationsMap[key]);
});

// Create Group Conversation
app.post("/api/conversations/group", (req: Request, res: Response) => {
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
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Chat Theme Setting
app.patch("/api/conversations/:cid/theme", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { theme } = req.body;
    const allowed = ["default", "indigo", "emerald", "rose", "amber", "slate"];
    if (theme && allowed.includes(theme)) {
      conv.theme = theme;
    }
    res.json({ ok: true, theme: conv.theme });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Disappearing Messages Setting
app.patch("/api/conversations/:cid/disappearing", (req: Request, res: Response) => {
  const user = getAuthUser(req);
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
        text: `⏱️ ${user.name} એ અદ્રશ્ય થતા સંદેશા બદલ્યા: ${durationLabels[duration] || duration}`,
        status: "read",
        deliveredTo: conv.memberIds,
        readBy: conv.memberIds,
        deletedFor: [],
        deleted: false,
        createdAt: new Date().toISOString(),
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(sysMsg);
      conv.updatedAt = sysMsg.createdAt;
    }
    res.json({ ok: true, disappearingDuration: conv.disappearingDuration });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// List Messages
app.get("/api/conversations/:cid/messages", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const list = messagesMap[conv.id] || [];
    // Filter out messages deleted for this user or expired disappearing messages
    const visible = list.filter((m) => {
      if (m.deletedFor.includes(user.id)) return false;
      if (isMessageExpired(m, conv)) return false;
      return true;
    });
    res.json({ items: visible });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Send Message
app.post("/api/conversations/:cid/messages", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { type = "text", text = "", mediaUrl = "", fileName = "", replyTo = null } = req.body;

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
      disappearingDuration: conv.disappearingDuration || "off",
      createdAt: now,
    };

    if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
    messagesMap[conv.id].push(newMsg);

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

    // Increment unread for other members
    conv.memberIds.forEach((id) => {
      if (id !== user.id) {
        conv.unread[id] = (conv.unread[id] || 0) + 1;
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
      if (!m.readBy.includes(user.id)) {
        m.readBy.push(user.id);
      }
      if (!m.deliveredTo.includes(user.id)) {
        m.deliveredTo.push(user.id);
      }
      m.status = "read";

      // Disappearing countdown begins AFTER the receiver has READ the message
      if (!m.readAt && m.senderId !== user.id && m.disappearingDuration && m.disappearingDuration !== "off") {
        m.readAt = now;
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

// Start Call (Voice or Video)
app.post("/api/conversations/:cid/call/start", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { callType = "voice" } = req.body;

    // Check block status for 1-to-1 call
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
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

    const otherId = conv.memberIds.find((id) => id !== user.id);
    conv.activeCall = {
      callId: `call_${Date.now()}`,
      callType: callType === "video" ? "video" : "voice",
      callerId: user.id,
      callerName: user.name,
      receiverId: otherId,
      status: "calling",
      startedAt: new Date().toISOString(),
      signals: [],
    };

    res.json({ ok: true, call: conv.activeCall });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Get Current Call Status
app.get("/api/conversations/:cid/call", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      if (conv.activeCall.receiverId === user.id && conv.activeCall.status === "calling") {
        conv.activeCall.status = "ringing";
      }
    }
    res.json({ call: conv.activeCall || null });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Ringing status update
app.post("/api/conversations/:cid/call/ring", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall && conv.activeCall.receiverId === user.id) {
      conv.activeCall.status = "ringing";
    }
    res.json({ ok: true, call: conv.activeCall || null });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Answer Call
app.post("/api/conversations/:cid/call/answer", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call found" });
    }
    conv.activeCall.status = "active";
    conv.activeCall.answeredAt = new Date().toISOString();
    res.json({ ok: true, call: conv.activeCall });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Reject Call
app.post("/api/conversations/:cid/call/reject", (req: Request, res: Response) => {
  const user = getAuthUser(req);
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
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// End Call
app.post("/api/conversations/:cid/call/end", (req: Request, res: Response) => {
  const user = getAuthUser(req);
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
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Exchange WebRTC Signals
app.post("/api/conversations/:cid/call/signal", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call" });
    }
    const { to, signal } = req.body;
    if (!conv.activeCall.signals) conv.activeCall.signals = [];
    conv.activeCall.signals.push({
      from: user.id,
      to,
      signal,
      createdAt: new Date().toISOString(),
    });
    // Keep last 30 signals
    if (conv.activeCall.signals.length > 30) {
      conv.activeCall.signals = conv.activeCall.signals.slice(-30);
    }
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

app.get("/api/conversations/:cid/call/signals", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall || !conv.activeCall.signals) {
      return res.json({ signals: [] });
    }
    const mySignals = conv.activeCall.signals.filter((s) => s.to === user.id);
    res.json({ signals: mySignals });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});

// Members Endpoints
app.get("/api/members", (req: Request, res: Response) => {
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
app.get("/api/events", (req: Request, res: Response) => {
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

// Posts / Social Endpoints
app.get("/api/posts", (req: Request, res: Response) => {
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
    list = list.filter((p) => p.mediaType === "reel" || (p.mediaUrls && p.mediaUrls.some((u: string) => /\.(mp4|mov|webm)(\?.*)?$/i.test(u))));
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

app.post("/api/posts", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
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

// Main Samaj Endpoints
app.get("/api/admin/main-samaj", requireAdmin, (req: Request, res: Response) => {
  res.json({ items: mainSamajList });
});

// Gam (Villages) Endpoints
app.get("/api/admin/gam", requireAdmin, (req: Request, res: Response) => {
  const adminRole = (req as any).adminRole as AdminRole;
  const scope = (req as any).adminScope as AdminScope;

  let list = gamList;
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
  if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((s) => s.id === scope.samajId);
  }
  res.json({ items: list });
});

app.patch("/api/admin/samaj/:id", requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser as SamajUser;
  const adminRole = (req as any).adminRole as AdminRole;
  const samaj = samajList.find((s) => s.id === req.params.id);
  if (!samaj) return res.status(404).json({ error: "Samaj not found" });

  if (req.body.requirePostApproval !== undefined) {
    samaj.requirePostApproval = req.body.requirePostApproval;
  }
  if (req.body.isActive !== undefined) {
    samaj.isActive = req.body.isActive;
  }

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
  res.json({
    items: [
      {
        id: "notif_1",
        title: "સ્વાગત છે!",
        body: "સમાજ કનેક્ટ ડિજિટલ પરિવારમાં આપનું હાર્દિક સ્વાગત છે.",
        read: true,
        createdAt: new Date().toISOString(),
      }
    ],
  });
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

// Start Server with Vite Middleware in Development
async function startServer() {
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
