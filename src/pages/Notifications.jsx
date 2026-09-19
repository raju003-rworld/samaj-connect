import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Radio,
  Calendar,
  Megaphone,
  CheckCheck,
  Film,
  Smartphone,
  Sparkles,
  Volume2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { listenNotifications } from "@/lib/firebase";
import { timeAgo } from "@/components/social/PostCard";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/pushNotifications";

const ICON = {
  like: Heart,
  comment: MessageCircle,
  reply: MessageCircle,
  follow: UserPlus,
  message: MessageCircle,
  group_added: MessageCircle,
  live_started: Radio,
  live_scheduled: Radio,
  new_event: Calendar,
  announcement: Megaphone,
  reel: Film,
};

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((it) => {
    if (!it?.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

export default function Notifications() {
  const { user, t, triggerTestNotification } = useApp();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [permState, setPermState] = useState(getNotificationPermission);

  const fetchItems = async () => {
    try {
      const { data } = await api.get("/api/notifications");
      if (data?.items) {
        setItems(dedupeById(data.items));
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchItems();
    if (user?.id) {
      const unsub = listenNotifications(user.id, (x) => {
        if (x && x.length) setItems(dedupeById(x).slice(0, 100));
      });
      return () => unsub?.();
    }
  }, [user?.id]);

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermState(res);
  };

  const open = async (n) => {
    if (!n.read) api.post("/api/notifications/read", { id: n.id }).catch(() => {});
    if (n.link) {
      nav(n.link);
      return;
    }
    const d = n.data || {};
    if (d.conversationId || n.conversationId) nav(`/messages/${d.conversationId || n.conversationId}`);
    else if (d.reelId || n.reelId || n.type === "reel") nav("/reels");
    else if (d.liveId) nav(`/live/${d.liveId}`);
    else if (d.postId) nav(`/social?post=${d.postId}`);
    else if (d.userId) nav(`/users/${d.userId}`);
    else if (d.eventId) nav("/events");
  };

  const readAll = async () => {
    await api.post("/api/notifications/read", {});
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl flex items-center gap-2">
          <span>{t("notifications")}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
            {items.filter((x) => !x.read).length} નવી
          </span>
        </h2>
        <button
          data-testid="notif-read-all"
          onClick={readAll}
          className="text-xs font-semibold text-purple-800 flex items-center gap-1 hover:text-purple-950 transition cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" /> {t("mark_all_read")}
        </button>
      </div>

      {/* Phone Notification Settings & Quick Test Card */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-purple-500/30 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 grid place-items-center text-amber-300 shrink-0 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm sm:text-base flex items-center gap-2">
                <span>ફોન હોમ સ્ક્રીન નોટિફિકેશન</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    permState === "granted"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {permState === "granted" ? "✓ સક્રિય (Active)" : "મંજૂરી બાકી"}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                નવી રીલ કે મેસેજ આવે ત્યારે ફોનની સ્ક્રીન પર તુરંત એલર્ટ, સાઉન્ડ અને વાઇબ્રેશન આવશે.
              </p>
            </div>
          </div>
        </div>

        {permState !== "granted" && (
          <button
            type="button"
            onClick={handleEnablePermission}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer active:scale-98"
          >
            <Bell className="w-4 h-4" />
            <span>ફોન નોટિફિકેશન મંજૂર કરો (Enable Alerts)</span>
          </button>
        )}

        {/* Instant Test Buttons */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ફોન પર ટેસ્ટ કરો:</span>
          </span>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button
              type="button"
              data-testid="test-reel-notif"
              onClick={() => triggerTestNotification?.("reel")}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-amber-200"
            >
              <Film className="w-3.5 h-3.5" />
              <span>🎬 રીલ નોટિફિકેશન</span>
            </button>
            <button
              type="button"
              data-testid="test-msg-notif"
              onClick={() => triggerTestNotification?.("message")}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-purple-200"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>💬 મેસેજ નોટિફિકેશન</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {!items.length && (
        <div className="text-center text-sm text-slate-500 py-12 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          {t("no_notifications")}
        </div>
      )}

      <div className="space-y-2">
        {dedupeById(items).map((n) => {
          const Icon = ICON[n.type] || Bell;
          const isReel = n.type === "reel";
          const isMessage = n.type === "message";

          return (
            <button
              key={n.id}
              data-testid={`notif-${n.id}`}
              onClick={() => open(n)}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                n.read
                  ? "bg-white border-slate-100 shadow-xs hover:border-slate-200"
                  : isReel
                  ? "bg-rose-50/70 border-rose-200/80 shadow-xs hover:bg-rose-50"
                  : isMessage
                  ? "bg-purple-50/80 border-purple-200/80 shadow-xs hover:bg-purple-50"
                  : "bg-purple-50/50 border-purple-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl grid place-items-center shrink-0 border overflow-hidden ${
                  isReel
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : isMessage
                    ? "bg-purple-100 text-purple-900 border-purple-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {n.authorPhoto ? (
                  <img src={n.authorPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {n.title}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                {n.body && (
                  <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {n.body}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
