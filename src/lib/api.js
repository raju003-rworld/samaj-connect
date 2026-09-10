import axios from "axios";
import { auth } from "@/lib/firebase";

const BACKEND_URL = (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) || "";
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export const api = axios.create({ baseURL: API });

// Single shared auth interceptor: wait for Firebase Auth to restore the session, then attach the ID token.
api.interceptors.request.use(async (config) => {
  await auth.authStateReady();
  const u = auth.currentUser;
  if (u) {
    config.headers.Authorization = `Bearer ${await u.getIdToken(config._forceRefresh === true)}`;
  } else {
    const adminToken = typeof window !== "undefined" ? (sessionStorage.getItem("admin_token") || localStorage.getItem("admin_token")) : null;
    if (adminToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
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
