import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { t as translate } from "@/lib/i18n";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sc_user") || "null"); } catch { return null; }
  });
  const [lang, setLang] = useState(() => localStorage.getItem("sc_lang") || "gu");
  const [booting, setBooting] = useState(true);

  const t = useCallback((key) => translate(lang, key), [lang]);

  useEffect(() => { localStorage.setItem("sc_lang", lang); }, [lang]);

  useEffect(() => {
    const token = localStorage.getItem("sc_token");
    if (!token) { setBooting(false); return; }
    api.get("/auth/me")
      .then(({ data }) => { setUser(data); localStorage.setItem("sc_user", JSON.stringify(data)); })
      .catch(() => { setUser(null); localStorage.removeItem("sc_token"); localStorage.removeItem("sc_user"); })
      .finally(() => setBooting(false));
  }, []);

  const login = (token, u) => {
    localStorage.setItem("sc_token", token);
    localStorage.setItem("sc_user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("sc_token");
    localStorage.removeItem("sc_user");
    setUser(null);
  };
  const updateUser = (u) => { localStorage.setItem("sc_user", JSON.stringify(u)); setUser(u); };
  const toggleLang = () => setLang((l) => (l === "gu" ? "en" : "gu"));

  return (
    <AppContext.Provider value={{ user, lang, booting, t, login, logout, updateUser, toggleLang }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
