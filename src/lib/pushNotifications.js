// Web Push, Sound, Vibration & Phone Home Screen Notifications for Samaj Connect

let swReg = null;

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
      // Gentle double chime (E5 -> G5)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
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
    console.debug("AudioContext error or blocked before user gesture:", e);
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
    console.log("Service Worker registered successfully:", reg.scope);
    return reg;
  } catch (err) {
    console.warn("Service Worker registration failed:", err);
    return null;
  }
}

// Check notification permission state
export function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Request permission from user
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
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
  // 1. Play sound
  playNotificationSound(type);

  // 2. Vibrate phone
  vibratePhone(type === "reel" ? [200, 100, 200, 100, 250] : [150, 80, 150]);

  // 3. System Notification
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const notifOptions = {
    body: body || "નવી અપડેટ આવી છે!",
    icon: icon || "/icon.svg",
    badge: "/icon.svg",
    tag: tag || `sc_${Date.now()}`,
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
    console.warn("swReg showNotification failed, trying new Notification:", e);
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
    console.warn("new Notification failed:", e);
    return false;
  }
}
