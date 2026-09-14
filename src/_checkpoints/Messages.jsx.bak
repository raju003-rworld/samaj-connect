import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, Plus, Users, BellOff, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { listenConversations } from "@/lib/firebase";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((it) => {
    if (!it?.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

function NewChatDialog({ open, onOpenChange, onOpened }) {
  const { t } = useApp();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [group, setGroup] = useState(false);
  const [sel, setSel] = useState([]);
  const [name, setName] = useState("");
  useEffect(() => { if (open) api.get("/users/search", { params: { q } }).then(({ data }) => setUsers(dedupeById(data.items))); }, [q, open]);

  const direct = async (u) => { const { data } = await api.post("/conversations/direct", { userId: u.id }); onOpened(data.id); };
  const createGroup = async () => {
    if (!name.trim() || !sel.length) return toast.error("ગ્રુપ નામ અને સભ્યો પસંદ કરો");
    const { data } = await api.post("/conversations/group", { name, memberIds: sel }); onOpened(data.id);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-testid="new-chat-dialog">
        <DialogHeader><DialogTitle>{group ? t("new_group") : t("new_chat")}</DialogTitle><DialogDescription className="sr-only">Pick users</DialogDescription></DialogHeader>
        <div className="flex gap-2 text-xs font-semibold">
          <button data-testid="newchat-tab-direct" onClick={() => setGroup(false)} className={`px-3 py-1.5 rounded-full ${!group ? "bg-purple-900 text-white" : "bg-slate-100"}`}>{t("new_chat")}</button>
          <button data-testid="newchat-tab-group" onClick={() => setGroup(true)} className={`px-3 py-1.5 rounded-full ${group ? "bg-purple-900 text-white" : "bg-slate-100"}`}>{t("new_group")}</button>
        </div>
        {group && <input data-testid="group-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ગ્રુપ નામ" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />}
        <input data-testid="newchat-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {users.map((u) => (
            <button key={u.id} data-testid={`newchat-user-${u.id}`} onClick={() => group ? setSel((s) => s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]) : direct(u)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl text-left ${sel.includes(u.id) ? "bg-purple-50 border border-purple-200" : "hover:bg-slate-50"}`}>
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">{u.profilePhoto ? <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] || "?").toUpperCase()}</div>
              <div className="text-sm font-medium text-slate-800">{u.name}</div>
            </button>
          ))}
          {!users.length && <div className="text-xs text-slate-500 text-center py-4">{t("no_data")}</div>}
        </div>
        {group && <button data-testid="group-create-btn" onClick={createGroup} className="w-full py-2.5 rounded-2xl bg-purple-900 text-white text-sm font-semibold">{t("new_group")} ({sel.length})</button>}
      </DialogContent>
    </Dialog>
  );
}

export default function Messages() {
  const { user, t } = useApp();
  const nav = useNavigate();
  const { cid } = useParams();
  const [params] = useSearchParams();
  const [convs, setConvs] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(!!params.get("new"));

  const loadConversations = () => {
    api
      .get("/conversations")
      .then(({ data }) => {
        if (data?.items) {
          setConvs(dedupeById(data.items));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 3000);
    const unsub = user?.id
      ? listenConversations(user.id, (c) => {
          if (c && c.length) setConvs(dedupeById(c));
        })
      : () => {};

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [user?.id]);

  const title = (c) => c.type === "group" ? c.name : Object.entries(c.members || {}).filter(([k]) => k !== user.id).map(([, m]) => m.name).join(", ");
  const photo = (c) => c.type === "group" ? c.photo : Object.entries(c.members || {}).find(([k]) => k !== user.id)?.[1]?.photo;
  const list = dedupeById(convs).filter((c) => !q || title(c).toLowerCase().includes(q.toLowerCase()));
  const incomingCallConv = convs.find(
    (c) =>
      c.activeCall &&
      c.activeCall.receiverId === user?.id &&
      (c.activeCall.status === "calling" || c.activeCall.status === "ringing") &&
      cid !== c.id
  );

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-4">
      <aside className={`${cid ? "hidden md:block" : ""} space-y-3`}>
        {incomingCallConv && (
          <div
            data-testid="incoming-call-alert"
            className="bg-emerald-700 text-white p-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-pulse"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
                {incomingCallConv.activeCall.callType === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">{incomingCallConv.activeCall.callerName || "સભ્ય"}</div>
                <div className="text-[10px] text-emerald-100">
                  ઇનકમિંગ {incomingCallConv.activeCall.callType === "video" ? "વિડિઓ" : "વૉઇસ"} કૉલ...
                </div>
              </div>
            </div>
            <button
              onClick={() => nav(`/messages/${incomingCallConv.id}`)}
              className="bg-white text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-xl shadow hover:bg-emerald-50 shrink-0"
            >
              જોડાવો (Open)
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("messages")}</h2>
          <button data-testid="new-chat-btn" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 bg-purple-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full"><Plus className="w-4 h-4" /> {t("new_chat")}</button>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" /><input data-testid="conv-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="flex-1 outline-none text-sm bg-transparent" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {dedupeById(list).map((c) => { const un = c.unread?.[user.id] || 0; return (
            <button key={c.id} data-testid={`conv-${c.id}`} onClick={() => nav(`/messages/${c.id}`)} className={`w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 ${cid === c.id ? "bg-purple-50" : ""}`}>
              <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden shrink-0">{photo(c) ? <img src={photo(c)} alt="" className="w-full h-full object-cover" /> : c.type === "group" ? <Users className="w-5 h-5" /> : (title(c)?.[0] || "?").toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1"><span className="text-sm font-semibold text-slate-900 truncate flex-1">{title(c)}</span>{(c.muted || []).includes(user.id) && <BellOff className="w-3 h-3 text-slate-400" />}<span className="text-[10px] text-slate-400">{c.lastMessage?.createdAt ? new Date(c.lastMessage.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</span></div>
                <div className="flex items-center gap-2"><span className="text-xs text-slate-500 truncate flex-1">{c.lastMessage ? `${c.type === "group" && c.lastMessage.senderId !== user.id ? c.lastMessage.senderName + ": " : ""}${c.lastMessage.text}` : "—"}</span>{un > 0 && <span data-testid={`conv-unread-${c.id}`} className="bg-purple-800 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center">{un}</span>}</div>
              </div>
            </button>
          ); })}
          {!list.length && <div className="text-center text-sm text-slate-500 py-10">{t("no_data")}</div>}
        </div>
      </aside>
      <section className={cid ? "" : "hidden md:grid place-items-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-100 min-h-[60vh]"}>
        {cid ? <ChatWindow cid={cid} onBack={() => nav("/messages")} /> : <span>{t("new_chat")} →</span>}
      </section>
      <NewChatDialog open={open} onOpenChange={setOpen} onOpened={(id) => { setOpen(false); nav(`/messages/${id}`); }} />
    </div>
  );
}
