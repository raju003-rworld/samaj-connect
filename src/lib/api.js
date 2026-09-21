import axios from "axios";
import { auth } from "@/lib/firebase";
import { Capacitor } from "@capacitor/core";

// Primary production cloud deployment (publicly accessible across all networks/devices without AI Studio auth)
export const SHARED_PROD_URL = "https://ais-pre-fzquurunfptlbmocdlevhp-702698170139.asia-east1.run.app";
export const DEV_CONTAINER_URL = "https://ais-dev-fzquurunfptlbmocdlevhp-702698170139.asia-east1.run.app";

// In full-stack web architecture (Express + Vite), the backend runs co-located on the same server ("/api").
// When packaged as a native Android app via Capacitor, window.location.origin is "https://localhost",
// so we route to the configured backend URL or the shared public production backend.
export const getBaseApiUrl = () => {
  // 1. Explicit user/app override in localStorage (takes precedence anytime)
  if (typeof window !== "undefined") {
    const custom = window.localStorage?.getItem("sc_backend_url");
    if (custom && custom.trim()) {
      return `${custom.trim().replace(/\/$/, "")}/api`;
    }
  }

  // 2. Build-time environment variable
  const envUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL);
  if (envUrl && envUrl.trim()) {
    return `${envUrl.trim().replace(/\/$/, "")}/api`;
  }

  // 3. Native Android WebView: Use shared production Cloud Run URL
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    return `${SHARED_PROD_URL}/api`;
  }

  // 4. Default web browser relative path
  return "/api";
};

export const API = getBaseApiUrl();

export const api = axios.create({ 
  baseURL: API,
  timeout: 15000, // 15s timeout to prevent infinite hangs on mobile cellular connections
  headers: {
    "X-Client-Platform": typeof window !== "undefined" && Capacitor.isNativePlatform() ? "android-capacitor" : "web",
  },
});

// Automatically update baseURL dynamically before each request and attach auth tokens
api.interceptors.request.use(async (config) => {
  config.baseURL = getBaseApiUrl();

  try {
    await auth.authStateReady();
    const u = auth.currentUser;
    if (u) {
      const token = await u.getIdToken(config._forceRefresh === true);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (typeof window !== "undefined") {
      // Fallback: If logged in with demo mode or stored user on Android APK
      const demoPhone = window.localStorage?.getItem("sc_demo_authenticated");
      if (demoPhone) {
        config.headers["X-Demo-User"] = demoPhone;
      }
    }
  } catch (err) {
    console.warn("Auth header interceptor note:", err?.message || err);
  }

  return config;
});

// Response interceptor: handles 401 token refresh AND automatic Android endpoint failover
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config;
    if (!cfg) return Promise.reject(error);

    // 1. On 401 token expiration, refresh Firebase ID token once and retry
    if (error.response?.status === 401 && !cfg._tokenRetried && auth.currentUser) {
      cfg._tokenRetried = true;
      cfg._forceRefresh = true;
      return api(cfg);
    }

    // 2. On network failure in Android Native APK, attempt failover between SHARED and DEV backend
    if (
      typeof window !== "undefined" &&
      Capacitor.isNativePlatform() &&
      !cfg._failoverRetried &&
      (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED" || !error.response || error.response.status >= 500 || error.response.status === 404)
    ) {
      cfg._failoverRetried = true;
      const currentBase = cfg.baseURL || getBaseApiUrl();
      const fallbackUrl = currentBase.includes(SHARED_PROD_URL)
        ? `${DEV_CONTAINER_URL}/api`
        : `${SHARED_PROD_URL}/api`;

      console.warn(`Android APK network retry: switching from ${currentBase} to ${fallbackUrl}`);
      cfg.baseURL = fallbackUrl;
      return api(cfg);
    }

    return Promise.reject(error);
  }
);

// Helper to test connectivity from Android APK or Web
export const testBackendConnection = async (targetUrl) => {
  const base = targetUrl ? `${targetUrl.replace(/\/$/, "")}/api` : getBaseApiUrl();
  const startTime = Date.now();
  try {
    const res = await axios.get(`${base}/health`, { timeout: 7000 });
    const latency = Date.now() - startTime;
    return { ok: true, status: res.status, latency, url: base };
  } catch (err) {
    return { ok: false, error: err?.message || "Connection failed", url: base };
  }
};

// Helper to set or reset custom backend URL
export const setCustomBackendUrl = (url) => {
  if (typeof window === "undefined") return;
  if (!url || !url.trim()) {
    window.localStorage.removeItem("sc_backend_url");
  } else {
    window.localStorage.setItem("sc_backend_url", url.trim());
  }
};

