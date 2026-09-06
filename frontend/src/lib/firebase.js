import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signInWithCustomToken, signOut } from "firebase/auth";
import { getFirestore, collection, doc, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const cfg = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const fbApp = getApps()[0] || initializeApp(cfg);
export const auth = getAuth(fbApp);
export const fdb = getFirestore(fbApp);
export const storage = getStorage(fbApp);

let recaptcha = null;
export const startPhoneSignIn = async (phone, containerId = "recaptcha-container") => {
  if (!recaptcha) recaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return signInWithPhoneNumber(auth, phone, recaptcha);
};
export const signInCustom = (token) => signInWithCustomToken(auth, token);
export const fbSignOut = () => signOut(auth);
export const getIdToken = async () => (auth.currentUser ? auth.currentUser.getIdToken() : null);

// Downscale large images client-side (max 1600px, JPEG 0.85) for faster upload/loading
const compressImage = (file) => new Promise((resolve) => {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 400 * 1024) return resolve(file);
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    if (scale === 1) { URL.revokeObjectURL(url); return resolve(file); }
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((b) => { URL.revokeObjectURL(url); resolve(b ? new File([b], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file); }, "image/jpeg", 0.85);
  };
  img.onerror = () => resolve(file);
  img.src = url;
});

// Upload to Storage under uploads/{uid}/{kind}/ — returns download URL
export const uploadFile = async (rawFile, kind = "media", onProgress) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const file = await compressImage(rawFile);
  return new Promise((resolve, reject) => {
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const r = ref(storage, `uploads/${uid}/${kind}/${Date.now()}_${safe}`);
    const task = uploadBytesResumable(r, file, { contentType: file.type });
    task.on("state_changed",
      (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)));
  });
};

// Realtime helpers (reads are guarded by Firestore rules; writes go via backend API)
const withId = (s) => ({ id: s.id, ...s.data() });
export const listenMessages = (cid, cb) =>
  onSnapshot(query(collection(fdb, "conversations", cid, "messages"), orderBy("createdAt", "asc"), limit(200)),
    (snap) => cb(snap.docs.map(withId)), (e) => console.warn("messages listener", e.message));
export const listenConversation = (cid, cb) =>
  onSnapshot(doc(fdb, "conversations", cid), (s) => s.exists() && cb(withId(s)), (e) => console.warn(e.message));
export const listenConversations = (uid, cb) =>
  onSnapshot(query(collection(fdb, "conversations"), where("memberIds", "array-contains", uid)),
    (snap) => cb(snap.docs.map(withId).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))), (e) => console.warn(e.message));
export const listenNotifications = (uid, cb) =>
  onSnapshot(query(collection(fdb, "notifications"), where("userId", "==", uid)),
    (snap) => cb(snap.docs.map(withId).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))), (e) => console.warn(e.message));
export const listenLive = (lid, cb) =>
  onSnapshot(doc(fdb, "liveSessions", lid), (s) => s.exists() && cb(withId(s)), (e) => console.warn(e.message));
export const listenLiveChat = (lid, cb) =>
  onSnapshot(query(collection(fdb, "liveSessions", lid, "chat"), orderBy("createdAt", "asc"), limit(200)),
    (snap) => cb(snap.docs.map(withId).filter((m) => !m.hidden)), (e) => console.warn(e.message));
export const listenPresence = (uid, cb) =>
  onSnapshot(doc(fdb, "presence", uid), (s) => cb(s.exists() ? s.data() : null), () => {});

// ---- FCM push (requires REACT_APP_FIREBASE_VAPID_KEY; silently skipped otherwise) ----
export const setupPush = async (registerToken, onForeground) => {
  const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
  if (!vapidKey || typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) return null;
  try {
    const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return null;
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission !== "granted") return null;
    const qs = new URLSearchParams(cfg).toString();
    const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`);
    const messaging = getMessaging(fbApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
    if (token) await registerToken(token);
    onMessage(messaging, (payload) => onForeground?.(payload));
    return token;
  } catch (e) { console.warn("push setup skipped:", e.message); return null; }
};
