import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, Radio, Calendar, Megaphone, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { listenNotifications } from "@/lib/firebase";
import { timeAgo } from "@/components/social/PostCard";

const ICON = { like: Heart, comment: MessageCircle, reply: MessageCircle, follow: UserPlus, message: MessageCircle, group_added: MessageCircle, live_started: Radio, live_scheduled: Radio, new_event: Calendar, announcement: Megaphone };

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((it) => {
    if (!it?.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

export default function Notifications() {
  const { user, t } = useApp();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  useEffect(() => user?.id && listenNotifications(user.id, (x) => setItems(dedupeById(x).slice(0, 100))), [user?.id]);

  const open = async (n) => {
    if (!n.read) api.post("/notifications/read", { ids: [n.id] }).catch(() => {});
    const d = n.data || {};
    if (d.conversationId) nav(`/messages/${d.conversationId}`);
    else if (d.liveId) nav(`/live/${d.liveId}`);
    else if (d.postId) nav(`/social?post=${d.postId}`);
    else if (d.userId) nav(`/users/${d.userId}`);
    else if (d.eventId) nav("/events");
  };
  const readAll = () => api.post("/notifications/read", {});

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("notifications")}</h2>
        <button data-testid="notif-read-all" onClick={readAll} className="text-xs font-semibold text-purple-800 flex items-center gap-1"><CheckCheck className="w-4 h-4" /> {t("mark_all_read")}</button>
      </div>
      {!items.length && <div className="text-center text-sm text-slate-500 py-12 bg-white rounded-2xl border border-slate-100"><Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />{t("no_notifications")}</div>}
      {dedupeById(items).map((n) => { const Icon = ICON[n.type] || Bell; return (
        <button key={n.id} data-testid={`notif-${n.id}`} onClick={() => open(n)} className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border ${n.read ? "bg-white border-slate-100" : "bg-purple-50 border-purple-100"}`}>
          <div className="w-9 h-9 rounded-full bg-white border border-slate-200 grid place-items-center text-purple-800 shrink-0"><Icon className="w-4 h-4" /></div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-900">{n.title}</div>{n.body && <div className="text-xs text-slate-600 truncate">{n.body}</div>}</div>
          <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
        </button>
      ); })}
    </div>
  );
}
