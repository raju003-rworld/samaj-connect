import axios from "axios";
import { auth } from "@/lib/firebase";
import { Capacitor } from "@capacitor/core";

// In full-stack web architecture (Express + Vite), the backend runs co-located on the same server ("/api").
// When packaged as a native Android app via Capacitor, window.location.origin is "https://localhost",
// so we route to the configured backend URL (VITE_BACKEND_URL / REACT_APP_BACKEND_URL) or default production backend.
const configuredBackend =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
  (typeof window !== "undefined" && window.localStorage?.getItem("sc_backend_url"));

export const getBaseApiUrl = () => {
  if (configuredBackend) {
    return `${configuredBackend.replace(/\/$/, "")}/api`;
  }
  // In native Android WebView without explicit backend URL, allow connecting to current host or emulator default
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    return "https://ais-dev-fzquurunfptlbmocdlevhp-702698170139.asia-east1.run.app/api";
  }
  return "/api";
};

export const API = getBaseApiUrl();

export const api = axios.create({ baseURL: API });

// Automatically update baseURL if environment changes
api.interceptors.request.use(async (config) => {
  config.baseURL = getBaseApiUrl();
  await auth.authStateReady();
  const u = auth.currentUser;
  if (u) {
    config.headers.Authorization = `Bearer ${await u.getIdToken(config._forceRefresh === true)}`;
  }
  return config;
});


// On 401 (e.g. expired token), refresh the ID token once and retry.
api.interceptors.response.use(undefined, async (error) => {
  const cfg = error.config;
  if (error.response?.status === 401 && cfg && !cfg._retried && auth.currentUser) {
    cfg._retried = true;
    cfg._forceRefresh = true;
    return api(cfg);
  }
  return Promise.reject(error);
});
