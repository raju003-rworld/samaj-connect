import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Web Push, Sound, Vibration & Phone Home Screen Notifications for Samaj Connect

let swReg = null;
let channelCreated = false;

// Setup native notification channels on Android
export async function setupNativeChannels() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform() || channelCreated) return;
  try {
    await LocalNotifications.createChannel({
      id: "messages",
      name: "ચેટ સંદેશા (Chat Messages)",
      description: "સમાજ કનેક્ટ ચેટ અને સંદેશા નોટિફિકેશન",
      importance: 5, // High priority heads-up banner on phone
      visibility: 1,
      vibration: true,
      sound: undefined,
    });
    channelCreated = true;

    // Listen to notification tap event on native
    LocalNotifications.removeAllListeners().catch(() => {});
    LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      const link = action.notification?.extra?.url || action.notification?.extra?.link;
      if (link && typeof window !== "undefined") {
        window.location.href = link;
      }
    });
  } catch (e) {
    console.debug("setupNativeChannels notice:", e);
  }
}

// Synthesize pleasant notification chime via Web Audio API
export function playNotificationSound(type = "default") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    gain.connect(ctx.destination);
    osc.connect(gain);

    if (type === "message") {
      // Gentle sweet double chime (E5 -> G5)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === "reel") {
      // Energetic triple chime (C5 -> E5 -> G5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.46);
    } else {
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch (e) {
    console.debug("AudioContext notice:", e);
  }
}

// Vibrate device if supported
export function vibratePhone(pattern = [150, 80, 150]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore if not permitted
  }
}

// Register service worker for background notifications
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    swReg = reg;
    return reg;
  } catch (err) {
    console.warn("Service Worker registration notice:", err);
    return null;
  }
}

// Check notification permission state
export async function getNotificationPermission() {
  if (typeof window === "undefined") return "unsupported";
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      return perm.display === "granted" ? "granted" : perm.display || "prompt";
    } catch {
      return "prompt";
    }
  }
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Request permission from user
export async function requestNotificationPermission() {
  if (typeof window === "undefined") return "unsupported";

  if (Capacitor.isNativePlatform()) {
    try {
      await setupNativeChannels();
      const res = await LocalNotifications.requestPermissions();
      return res.display === "granted" ? "granted" : "denied";
    } catch (e) {
      console.warn("Native LocalNotifications permission error:", e);
      return "denied";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted" && !swReg) {
      await registerServiceWorker();
    }
    return perm;
  } catch (e) {
    console.warn("Error requesting notification permission:", e);
    return "denied";
  }
}

// Trigger a native system notification on device/phone
export async function showPhoneNotification({ title, body, icon, tag, link, type = "default" }) {
  // 1. Play chime sound
  playNotificationSound(type);

  // 2. Vibrate phone
  vibratePhone(type === "reel" ? [200, 100, 200, 100, 250] : [150, 80, 150]);

  // 3. Native Android notification banner in status bar via LocalNotifications
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      await setupNativeChannels();
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || "સમાજ કનેક્ટ",
            body: body || "નવો સંદેશ મળ્યો છે",
            id: Math.floor(Math.random() * 900000) + 100000,
            channelId: "messages",
            extra: {
              url: link || "/messages",
              link: link || "/messages",
            },
            smallIcon: "ic_launcher",
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn("Capacitor LocalNotifications schedule error:", e);
    }
  }

  // 4. Web / Browser System Notification
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const notifOptions = {
    body: body || "નવો સંદેશ મળ્યો છે!",
    icon: icon || "/icon.svg",
    badge: "/icon.svg",
    tag: tag || `sc_msg_${Date.now()}`,
    vibrate: [200, 100, 200],
    renotify: true,
    data: { url: link || "/" },
  };

  try {
    if (swReg && "showNotification" in swReg) {
      await swReg.showNotification(title || "સમાજ કનેક્ટ", notifOptions);
      return true;
    }
  } catch (e) {
    console.warn("swReg showNotification notice:", e);
  }

  try {
    const n = new Notification(title || "સમાજ કનેક્ટ", notifOptions);
    n.onclick = function (e) {
      e.preventDefault();
      window.focus();
      if (link) {
        window.location.href = link;
      }
      n.close();
    };
    return true;
  } catch (e) {
    console.warn("new Notification notice:", e);
    return false;
  }
}

