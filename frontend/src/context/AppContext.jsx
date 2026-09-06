import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, fbSignOut, listenNotifications, setupPush } from "@/lib/firebase";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { t as translate } from "@/lib/i18n";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem("sc_lang") || "gu");
  const [booting, setBooting] = useState(true);
  const [unread, setUnread] = useState(0);
  const [samajList, setSamajList] = useState([]);

  const t = useCallback((key) => translate(lang, key), [lang]);
  useEffect(() => { localStorage.setItem("sc_lang", lang); }, [lang]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fu) => {
      if (!fu) { setUser(null); setBooting(false); return; }
      try { await refreshUser(); } catch { await fbSignOut(); setUser(null); }
      setBooting(false);
    });
  }, [refreshUser]);

  useEffect(() => {
    if (!user?.id) return;
    api.get("/samaj").then(({ data }) => setSamajList(data.items)).catch(() => {});
    api.post("/presence", { online: true }).catch(() => {});
    const unsub = listenNotifications(user.id, (items) => setUnread(items.filter((n) => !n.read).length));
    setupPush((token) => api.post("/devices", { token }), (payload) => {
      const n = payload?.notification || {};
      if (n.title) toast(n.title, { description: n.body });
    });
    const bye = () => api.post("/presence", { online: false }).catch(() => {});
    window.addEventListener("beforeunload", bye);
    return () => { unsub(); window.removeEventListener("beforeunload", bye); };
  }, [user?.id]);

  const logout = async () => { await api.post("/presence", { online: false }).catch(() => {}); await fbSignOut(); setUser(null); };
  const updateUser = (u) => setUser(u);
  const toggleLang = () => setLang((l) => (l === "gu" ? "en" : "gu"));
  const isAdmin = ["super_admin", "samaj_admin", "admin"].includes(user?.role);
  const isMod = isAdmin || user?.role === "moderator";
  const activeSamaj = samajList.find((s) => s.id === user?.activeSamajId);

  return (
    <AppContext.Provider value={{ user, lang, booting, t, logout, updateUser, refreshUser, toggleLang, unread, isAdmin, isMod, samajList, activeSamaj }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
