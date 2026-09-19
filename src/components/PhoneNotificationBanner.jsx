import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Film, MessageCircle, X, ExternalLink, Sparkles } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
} from "@/lib/pushNotifications";

export default function PhoneNotificationBanner({ activeNotification, onDismiss }) {
  const navigate = useNavigate();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [dismissedPrompt, setDismissedPrompt] = useState(() => {
    return localStorage.getItem("sc_notif_prompt_dismissed") === "true";
  });

  useEffect(() => {
    registerServiceWorker().catch(() => {});
    setPermission(getNotificationPermission());
  }, []);

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleDismissPrompt = () => {
    setDismissedPrompt(true);
    localStorage.setItem("sc_notif_prompt_dismissed", "true");
  };

  return (
    <div className="fixed top-2 inset-x-0 z-50 pointer-events-none px-3 flex flex-col items-center max-w-md mx-auto space-y-2">
      {/* 1. Live Incoming Reel or Message Notification Banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 text-white rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 cursor-pointer group hover:bg-slate-900 transition-all ring-1 ring-white/10"
            onClick={() => {
              if (activeNotification.link) {
                navigate(activeNotification.link);
              }
              onDismiss?.();
            }}
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-purple-800 border-2 border-purple-400 grid place-items-center text-white font-bold shadow-md">
                {activeNotification.authorPhoto ? (
                  <img
                    src={activeNotification.authorPhoto}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : activeNotification.type === "reel" ? (
                  <Film className="w-5 h-5 text-amber-300" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-purple-200" />
                )}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full grid place-items-center text-[10px] text-white shadow-xs ${
                  activeNotification.type === "reel" ? "bg-rose-500" : "bg-emerald-500"
                }`}
              >
                {activeNotification.type === "reel" ? (
                  <Film className="w-3 h-3" />
                ) : (
                  <MessageCircle className="w-3 h-3" />
                )}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-amber-300 tracking-wide flex items-center gap-1 truncate">
                  {activeNotification.title || (activeNotification.type === "reel" ? "🎬 નવી રીલ" : "💬 નવો મેસેજ")}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">હમણાં જ</span>
              </div>
              <p className="text-xs text-slate-200 truncate mt-0.5 leading-snug">
                {activeNotification.body || "નવી અપડેટ જોવા માટે ક્લિક કરો"}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. One-tap "Enable Phone Notifications" Banner if not enabled yet */}
      {permission === "default" && !dismissedPrompt && !activeNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="pointer-events-auto w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl shadow-xl p-3 border border-purple-400/30 flex items-center justify-between gap-2.5 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 grid place-items-center text-amber-300 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>ફોન નોટિફિકેશન ચાલુ કરો</span>
                <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
              </div>
              <div className="text-[11px] text-purple-200 truncate">
                રીલ્સ અને મેસેજ આવે ત્યારે સ્ક્રીન પર નોટિફિકેશન મેળવો
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleEnablePermission}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              મંજૂર કરો
            </button>
            <button
              type="button"
              onClick={handleDismissPrompt}
              className="p-1 rounded-lg text-purple-300 hover:text-white transition cursor-pointer"
              title="બંધ કરો"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
