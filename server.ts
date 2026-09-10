import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory data storage (simulating Firestore database for Samaj Connect)
interface SamajUser {
  id: string;
  phone: string;
  name: string;
  role: string;
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
}

const DEFAULT_SAMAJ_ID = "default";

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

const usersMap: Record<string, SamajUser> = {
  [currentUser.id]: currentUser,
};

function getAuthUser(req: Request): SamajUser {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.startsWith("mock-token-")) {
      const phoneDigits = token.replace("mock-token-", "");
      const phone = phoneDigits ? `+${phoneDigits}` : currentUser.phone;
      const uid = `user_${phoneDigits.slice(-10) || "demo"}`;
      if (!usersMap[uid]) {
        usersMap[uid] = {
          ...currentUser,
          id: uid,
          phone: phone,
          name: currentUser.name && currentUser.name !== "રાજેશભાઈ પટેલ (Admin)" ? currentUser.name : `સભ્ય (${phone.slice(-4)})`,
        };
      }
      return usersMap[uid];
    }
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        const phone = payload.phone_number || payload.phone || currentUser.phone;
        const uid = payload.user_id || payload.sub || currentUser.id;
        if (!usersMap[uid]) {
          usersMap[uid] = {
            ...currentUser,
            id: uid,
            phone: phone,
            name: payload.name || `Member ${phone.slice(-4)}`,
          };
        }
        return usersMap[uid];
      }
    } catch (err) {
      // ignore invalid JWT in development
    }
  }
  return currentUser;
}

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
  const { phone, name } = req.body;
  const targetPhone = phone || currentUser.phone;
  const phoneDigits = targetPhone.replace(/\D/g, "");
  const uid = `user_${phoneDigits.slice(-10) || "demo"}`;

  if (!usersMap[uid]) {
    usersMap[uid] = {
      ...currentUser,
      id: uid,
      phone: targetPhone,
      name: name || `સભ્ય (${targetPhone.slice(-4)})`,
    };
  } else if (name) {
    usersMap[uid].name = name;
  }

  res.json({
    customToken: `mock-token-${phoneDigits}`,
  });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthUser(req);
  res.json(user);
});

app.patch("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthUser(req);
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
  res.json({
    items: samajList.filter((s) => s.isActive),
    mine: currentUser.samajIds,
    active: currentUser.activeSamajId,
  });
});

app.post("/api/samaj", (req: Request, res: Response) => {
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
  currentUser.samajIds.push(newSid);
  res.json(newSamaj);
});

app.post("/api/samaj/:sid/join", (req: Request, res: Response) => {
  const sid = req.params.sid;
  if (!currentUser.samajIds.includes(sid)) {
    currentUser.samajIds.push(sid);
  }
  currentUser.activeSamajId = sid;
  res.json(currentUser);
});

app.post("/api/samaj/:sid/activate", (req: Request, res: Response) => {
  const sid = req.params.sid;
  currentUser.activeSamajId = sid;
  res.json(currentUser);
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
  const formatted = postsList.map((p) => ({
    ...p,
    likedByMe: p.likedBy?.includes(currentUser.id) || false,
    savedByMe: p.savedBy?.includes(currentUser.id) || false,
    mediaUrls: p.mediaUrls || p.imageUrls || [],
    imageUrls: p.imageUrls || p.mediaUrls || [],
    content: p.content || p.caption || "",
  }));
  res.json({ items: formatted });
});

app.post("/api/posts", (req: Request, res: Response) => {
  const body = req.body;
  const urls = body.mediaUrls?.length ? body.mediaUrls : body.imageUrls || [];
  const newPost = {
    id: `post_${Date.now()}`,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorPhoto: currentUser.profilePhoto,
    content: body.content || body.caption || "",
    caption: body.caption || body.content || "",
    mediaUrls: urls,
    imageUrls: urls,
    mediaType: body.mediaType || "image",
    visibility: body.visibility || "samaj",
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
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
  });
});

app.post("/api/posts/:pid/like", (req: Request, res: Response) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  const isLiked = post.likedBy.includes(currentUser.id);
  if (isLiked) {
    post.likedBy = post.likedBy.filter((id) => id !== currentUser.id);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedBy.push(currentUser.id);
    post.likesCount += 1;
  }
  res.json({ liked: !isLiked, likesCount: post.likesCount });
});

app.post("/api/posts/:pid/save", (req: Request, res: Response) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  const isSaved = post.savedBy?.includes(currentUser.id);
  if (isSaved) {
    post.savedBy = post.savedBy.filter((id) => id !== currentUser.id);
  } else {
    post.savedBy = post.savedBy || [];
    post.savedBy.push(currentUser.id);
  }
  res.json({ saved: !isSaved });
});

app.get("/api/posts/:pid/comments", (req: Request, res: Response) => {
  const pid = req.params.pid;
  res.json({ items: commentsList[pid] || [] });
});

app.post("/api/posts/:pid/comments", (req: Request, res: Response) => {
  const pid = req.params.pid;
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ detail: "Content required" });
    return;
  }
  const newComment = {
    id: `comm_${Date.now()}`,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorPhoto: currentUser.profilePhoto,
    content,
    createdAt: new Date().toISOString(),
  };
  commentsList[pid] = commentsList[pid] || [];
  commentsList[pid].push(newComment);

  const post = postsList.find((p) => p.id === pid);
  if (post) {
    post.commentsCount += 1;
  }
  res.json(newComment);
});

// Stories
app.get("/api/stories", (req: Request, res: Response) => {
  res.json({ items: [] });
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

// Admin Endpoints
app.get("/api/admin/stats", (req: Request, res: Response) => {
  res.json({
    members: membersList.length,
    users: 128,
    posts: postsList.length,
    events: eventsList.length,
    comments: 32,
    live: liveSessions.length,
    openReports: 0,
    pendingPosts: 0,
    pendingAlbums: 0,
    pendingBookings: 0,
    albums: albumsList.length,
  });
});

app.get("/api/admin/members", (req: Request, res: Response) => {
  res.json({ items: membersList });
});

app.patch("/api/admin/members/:mid/toggle-active", (req: Request, res: Response) => {
  const m = membersList.find((x) => x.id === req.params.mid);
  if (m) {
    m.isActive = !m.isActive;
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
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  const matchedMembers = membersList.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.village.toLowerCase().includes(q) ||
      m.mobile.includes(q)
  );
  const matchedEvents = eventsList.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
  );
  const matchedPosts = postsList.filter((p) =>
    p.content.toLowerCase().includes(q)
  );
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
