import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signInWithCustomToken, signOut, onAuthStateChanged as fbOnAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, query, where, orderBy, limit, onSnapshot as fbOnSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const VALID_FIREBASE_API_KEY = "AIzaSyAbtSfHuagL-N8p0Uw3-C5kXOCusb_59jA";
const rawApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const apiKey = (!rawApiKey || rawApiKey === "AIzaSyAbtSfHuagl-N8p0wU3-C5kX0CUseb_59jA")
  ? VALID_FIREBASE_API_KEY
  : rawApiKey;

const cfg = {
  apiKey: apiKey,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "samaj-connect-6ad91.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "samaj-connect-6ad91",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "samaj-connect-6ad91.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "191282848723",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:191282848723:web:18d8dc0f706a0c85af4526",
};

const hasRealFirebase = Boolean(cfg.apiKey);
// Cloud Firestore should only be initialized if explicitly enabled by environment variable,
// otherwise the app uses its robust, built-in server-side persistence and REST APIs.
const hasRealFirestore = Boolean(
  hasRealFirebase &&
  (process.env.REACT_APP_ENABLE_FIRESTORE === "true" || process.env.VITE_ENABLE_FIRESTORE === "true")
);

export const fbApp = getApps()[0] || initializeApp(cfg);
const realAuth = hasRealFirebase ? getAuth(fbApp) : null;
export const fdb = hasRealFirestore ? getFirestore(fbApp) : null;
export const storage = hasRealFirebase ? getStorage(fbApp) : null;

// Mock Auth system when running in local/demo mode without Firebase credentials
const DEMO_USER_KEY = "sc_demo_authenticated";
const authListeners = new Set();

const createMockUser = (phone = "+919876543210") => ({
  uid: `user_${phone.replace(/\D/g, "").slice(-10) || "demo"}`,
  phoneNumber: phone,
  displayName: phone === "+919876543210" ? "રાજેશભાઈ પટેલ (Admin)" : `સભ્ય (${phone.slice(-4)})`,
  getIdToken: async () => `mock-token-${phone.replace(/\D/g, "")}`,
});

let mockCurrentUser = typeof window !== "undefined" && localStorage.getItem(DEMO_USER_KEY)
  ? createMockUser(localStorage.getItem(DEMO_USER_KEY) || "+919876543210")
  : null;

function notifyAuthListeners() {
  const u = (hasRealFirebase && realAuth.currentUser) ? realAuth.currentUser : mockCurrentUser;
  authListeners.forEach((cb) => {
    try {
      cb(u);
    } catch (err) {
      console.error(err);
    }
  });
}

export const onAuthStateChanged = (targetAuth, nextOrObserver, optError, optCompleted) => {
  const callback = typeof nextOrObserver === "function" ? nextOrObserver : nextOrObserver?.next?.bind(nextOrObserver);
  if (!callback) return () => {};

  authListeners.add(callback);

  let fbUnsub = () => {};
  if (hasRealFirebase) {
    fbUnsub = fbOnAuthStateChanged(
      realAuth,
      (u) => {
        callback(u || mockCurrentUser);
      },
      optError,
      optCompleted
    );
  } else {
    setTimeout(() => callback(mockCurrentUser), 0);
  }

  return () => {
    authListeners.delete(callback);
    fbUnsub();
  };
};

export const auth = {
  get currentUser() {
    return (hasRealFirebase && realAuth.currentUser) ? realAuth.currentUser : mockCurrentUser;
  },
  authStateReady: async () => {
    if (hasRealFirebase) {
      return realAuth.authStateReady();
    }
    return Promise.resolve();
  },
  onAuthStateChanged: (nextOrObserver, optError, optCompleted) => {
    return onAuthStateChanged(auth, nextOrObserver, optError, optCompleted);
  },
  _delegate: {
    get currentUser() {
      return (hasRealFirebase && realAuth.currentUser) ? realAuth.currentUser : mockCurrentUser;
    },
    onAuthStateChanged: (nextOrObserver, optError, optCompleted) => {
      return onAuthStateChanged(auth, nextOrObserver, optError, optCompleted);
    },
  },
};

let recaptcha = null;
export const clearRecaptcha = () => {
  if (recaptcha) {
    try {
      recaptcha.clear();
    } catch {}
    recaptcha = null;
  }
};

export const startPhoneSignIn = async (phone, containerId = "recaptcha-container", preferredSize = "invisible") => {
  if (!hasRealFirebase) {
    throw new Error("Firebase Auth is not configured");
  }

  const containerEl = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (containerEl) {
    containerEl.innerHTML = "";
  }

  clearRecaptcha();

  try {
    recaptcha = new RecaptchaVerifier(realAuth, containerEl || containerId, {
      size: preferredSize,
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        // Response expired
      },
    });

    await recaptcha.render();
    return await signInWithPhoneNumber(realAuth, phone, recaptcha);
  } catch (err) {
    // If invisible reCAPTCHA fails in Android WebView due to app credential attestation,
    // automatically fallback to interactive visible reCAPTCHA ('normal' size) so user can complete it.
    if (preferredSize === "invisible" && (err?.code === "auth/invalid-app-credential" || err?.code === "auth/captcha-check-failed")) {
      console.warn("Invisible reCAPTCHA failed, retrying with interactive normal reCAPTCHA in WebView...");
      clearRecaptcha();
      if (containerEl) {
        containerEl.innerHTML = "";
      }
      recaptcha = new RecaptchaVerifier(realAuth, containerEl || containerId, {
        size: "normal",
        callback: () => {},
        "expired-callback": () => {},
      });
      await recaptcha.render();
      return await signInWithPhoneNumber(realAuth, phone, recaptcha);
    }
    throw err;
  }
};

export const signInCustom = async (token, phone = "+919876543210") => {
  if (!hasRealFirebase && token && typeof token === "string" && token.startsWith("mock-token-")) {
    const extractedDigits = token.replace("mock-token-", "");
    const userPhone = phone || (extractedDigits ? `+${extractedDigits}` : "+919876543210");
    mockCurrentUser = createMockUser(userPhone);
    localStorage.setItem(DEMO_USER_KEY, userPhone);
    notifyAuthListeners();
    return { user: mockCurrentUser };
  }
  if (!hasRealFirebase) {
    mockCurrentUser = createMockUser(phone);
    localStorage.setItem(DEMO_USER_KEY, phone);
    notifyAuthListeners();
    return { user: mockCurrentUser };
  }
  try {
    return await signInWithCustomToken(realAuth, token);
  } catch (err) {
    console.warn("Real signInWithCustomToken failed, using local token session:", err);
    mockCurrentUser = createMockUser(phone);
    localStorage.setItem(DEMO_USER_KEY, phone);
    notifyAuthListeners();
    return { user: mockCurrentUser };
  }
};

export const fbSignOut = async () => {
  mockCurrentUser = null;
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem("sc_cached_user");
  notifyAuthListeners();
  if (hasRealFirebase) {
    try {
      await signOut(realAuth);
    } catch {}
  }
  return Promise.resolve();
};

export const getIdToken = async () => (auth.currentUser ? auth.currentUser.getIdToken() : null);

// Downscale large images client-side (max 1600px, JPEG 0.85) for faster upload/loading
const compressImage = (file) => new Promise((resolve) => {
  if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/gif" || file.size < 400 * 1024) {
    return resolve(file);
  }
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    if (scale === 1) { URL.revokeObjectURL(url); return resolve(file); }
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((b) => { URL.revokeObjectURL(url); resolve(b ? new File([b], (file.name || "image.jpg").replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file); }, "image/jpeg", 0.85);
  };
  img.onerror = () => resolve(file);
  img.src = url;
});

// Upload to Storage under uploads/{uid}/{kind}/ — returns download URL or base64 fallback
export const uploadFile = async (rawFile, kind = "media", onProgress) => {
  if (!rawFile) throw new Error("કોઈ ફાઈલ પસંદ કરેલ નથી (No file selected)");
  if (rawFile.size > 100 * 1024 * 1024) {
    throw new Error("ફાઈલ સાઈઝ 100MB કરતાં વધુ હોઈ શકશે નહીં (File size exceeds 100MB limit)");
  }

  const uid = auth.currentUser?.uid || "user";
  const file = await compressImage(rawFile);
  const readBase64 = () =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        onProgress?.(100);
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error("ફાઈલ વાંચવામાં ભૂલ આવી (Error reading file)"));
      reader.readAsDataURL(file);
    });

  if (!hasRealFirebase || !storage) {
    return readBase64();
  }

  return new Promise((resolve, reject) => {
    try {
      const safe = (file.name || `file_${Date.now()}`).replace(/[^\w.\-]/g, "_");
      const contentType = file.type || (kind === "reels" ? "video/mp4" : "application/octet-stream");
      const r = ref(storage, `uploads/${uid}/${kind}/${Date.now()}_${safe}`);
      const task = uploadBytesResumable(r, file, { contentType });
      task.on(
        "state_changed",
        (s) => {
          if (s.totalBytes > 0) {
            const pct = Math.min(99, Math.round((s.bytesTransferred / s.totalBytes) * 100));
            onProgress?.(pct);
          }
        },
        (err) => {
          console.warn("Storage upload failed, fallback to local base64:", err?.message || err);
          readBase64().then(resolve).catch(reject);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            onProgress?.(100);
            resolve(downloadUrl);
          } catch {
            readBase64().then(resolve).catch(reject);
          }
        }
      );
    } catch (err) {
      console.warn("Storage upload exception, fallback to local:", err?.message || err);
      readBase64().then(resolve).catch(reject);
    }
  });
};

// Realtime helpers (reads are guarded by Firestore rules; writes go via backend API)
const withId = (s) => ({ id: s.id, ...s.data() });
export const listenMessages = (cid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      query(collection(fdb, "conversations", cid, "messages"), orderBy("createdAt", "asc"), limit(200)),
      (snap) => cb(snap.docs.map(withId)),
      (e) => console.warn("messages listener", e.message)
    );
  } catch {
    return () => {};
  }
};

export const listenConversation = (cid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      doc(fdb, "conversations", cid),
      (s) => s.exists() && cb(withId(s)),
      (e) => console.warn(e.message)
    );
  } catch {
    return () => {};
  }
};

export const listenConversations = (uid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      query(collection(fdb, "conversations"), where("memberIds", "array-contains", uid)),
      (snap) => cb(snap.docs.map(withId).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))),
      (e) => console.warn(e.message)
    );
  } catch {
    return () => {};
  }
};

export const listenNotifications = (uid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      query(collection(fdb, "notifications"), where("userId", "==", uid)),
      (snap) => cb(snap.docs.map(withId).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
      (e) => console.warn(e.message)
    );
  } catch {
    return () => {};
  }
};

export const listenLive = (lid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      doc(fdb, "liveSessions", lid),
      (s) => s.exists() && cb(withId(s)),
      (e) => console.warn(e.message)
    );
  } catch {
    return () => {};
  }
};

export const listenLiveChat = (lid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      query(collection(fdb, "liveSessions", lid, "chat"), orderBy("createdAt", "asc"), limit(200)),
      (snap) => cb(snap.docs.map(withId).filter((m) => !m.hidden)),
      (e) => console.warn(e.message)
    );
  } catch {
    return () => {};
  }
};

export const listenPresence = (uid, cb) => {
  if (!hasRealFirestore || !fdb) return () => {};
  try {
    return fbOnSnapshot(
      doc(fdb, "presence", uid),
      (s) => cb(s.exists() ? s.data() : null),
      () => {}
    );
  } catch {
    return () => {};
  }
};

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

