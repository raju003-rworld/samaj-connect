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
  const { user, t, activeSamaj } = useApp();
  const nav = useNavigate();
  const { cid } = useParams();
  const [params] = useSearchParams();
  const [convs, setConvs] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all"); // "all" | "samaj" | "unread"
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

  const title = (c) =>
    c.type === "group"
      ? c.name
      : Object.entries(c.members || {})
          .filter(([k]) => k !== user?.id)
          .map(([, m]) => m.name)
          .join(", ") || "સભ્ય";

  const otherUser = (c) =>
    c.type === "group"
      ? null
      : Object.entries(c.members || {}).find(([k]) => k !== user?.id)?.[1];

  const photo = (c) =>
    c.type === "group"
      ? c.photo
      : otherUser(c)?.photo || otherUser(c)?.profilePhoto;

  const samajName = (c) =>
    c.type === "group"
      ? "ગ્રુપ ચેટ"
      : otherUser(c)?.samajName || otherUser(c)?.village || activeSamaj?.name || "સમાજ સભ્ય";

  // Filter list by search query and tabs
  const filteredList = dedupeById(convs).filter((c) => {
    const tName = title(c).toLowerCase();
    const matchesSearch = !q || tName.includes(q.toLowerCase());
    if (!matchesSearch) return false;

    if (tab === "unread") {
      const un = c.unread?.[user?.id] || 0;
      return un > 0;
    }
    if (tab === "samaj") {
      return c.type === "group" || otherUser(c)?.samajId === activeSamaj?.id;
    }
    return true;
  });

  const incomingCallConv = convs.find(
    (c) =>
      c.activeCall &&
      c.activeCall.receiverId === user?.id &&
      (c.activeCall.status === "calling" || c.activeCall.status === "ringing") &&
      cid !== c.id
  );

  return (
    <div className="grid md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] gap-4">
      {/* LEFT SIDEBAR: CONVERSATION LIST */}
      <aside className={`${cid ? "hidden md:flex" : "flex"} flex-col space-y-3`}>
        {/* Incoming Call Alert Banner */}
        {incomingCallConv && (
          <div
            data-testid="incoming-call-alert"
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 rounded-3xl shadow-lg flex items-center justify-between gap-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 grid place-items-center">
                {incomingCallConv.activeCall.callType === "video" ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <Phone className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {incomingCallConv.activeCall.callerName || "સભ્ય"}
                </div>
                <div className="text-[10px] text-emerald-100 font-medium">
                  ઇનકમિંગ {incomingCallConv.activeCall.callType === "video" ? "વિડિઓ" : "વૉઇસ"} કૉલ...
                </div>
              </div>
            </div>
            <button
              onClick={() => nav(`/messages/${incomingCallConv.id}`)}
              className="bg-white text-emerald-900 font-bold text-xs px-3.5 py-1.5 rounded-full shadow hover:bg-emerald-50 shrink-0"
            >
              જોડાવો (Open)
            </button>
          </div>
        )}

        {/* Header with Title and New Chat Button */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">
              સંદેશા (Messages)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">સમાજ સભ્યો સાથે વાતચીત</p>
          </div>
          <button
            data-testid="new-chat-btn"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-md shadow-purple-900/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>નવી ચેટ</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-2xs">
          <Search className="w-4 h-4 text-purple-700 shrink-0" />
          <input
            data-testid="conv-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="સભ્ય અથવા ગ્રુપ શોધો..."
            className="flex-1 outline-none text-xs sm:text-sm bg-transparent placeholder:text-slate-400 text-slate-800"
          />
        </div>

        {/* Filter Tabs: તમામ (All) | સમાજ (Samaj) | અવાંચેલ (Unread) */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl text-xs font-semibold">
          <button
            data-testid="chat-tab-all"
            onClick={() => setTab("all")}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              tab === "all"
                ? "bg-white text-purple-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            તમામ (All)
          </button>
          <button
            data-testid="chat-tab-samaj"
            onClick={() => setTab("samaj")}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              tab === "samaj"
                ? "bg-white text-purple-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            સમાજ (Samaj)
          </button>
          <button
            data-testid="chat-tab-unread"
            onClick={() => setTab("unread")}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              tab === "unread"
                ? "bg-white text-purple-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            અવાંચેલ (Unread)
          </button>
        </div>

        {/* Conversation List */}
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredList.map((c) => {
            const un = c.unread?.[user?.id] || 0;
            const isSelected = cid === c.id;
            const isOnline = c.type !== "group" && otherUser(c)?.online;
            const hasDisappearing = c.disappearingDuration && c.disappearingDuration !== "off";

            return (
              <button
                key={c.id}
                data-testid={`conv-${c.id}`}
                onClick={() => nav(`/messages/${c.id}`)}
                className={`w-full flex items-center gap-3 p-3.5 text-left transition-all ${
                  isSelected
                    ? "bg-purple-50/90 border-l-4 border-l-purple-800"
                    : "hover:bg-slate-50/80 active:bg-slate-100"
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-900 grid place-items-center font-extrabold text-sm overflow-hidden border border-purple-200/80 shadow-2xs">
                    {photo(c) ? (
                      <img src={photo(c)} alt="" className="w-full h-full object-cover" />
                    ) : c.type === "group" ? (
                      <Users className="w-5 h-5 text-purple-800" />
                    ) : (
                      (title(c)?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  {/* Online dot indicator */}
                  {isOnline && (
                    <span
                      data-testid={`online-dot-${c.id}`}
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                      title="ઓનલાઇન"
                    />
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-sm truncate ${
                        un > 0 || isSelected ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                      }`}
                    >
                      {title(c)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {c.lastMessage?.createdAt
                        ? new Date(c.lastMessage.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  {/* Samaj/Village Badge */}
                  <div className="text-[10px] text-purple-800 font-medium truncate mb-1">
                    🏛️ {samajName(c)}
                  </div>

                  {/* Last Message Preview & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 truncate flex-1 leading-tight">
                      {c.lastMessage ? (
                        <span>
                          {c.type === "group" && c.lastMessage.senderId !== user?.id && (
                            <span className="font-semibold text-slate-700">
                              {c.lastMessage.senderName}:{" "}
                            </span>
                          )}
                          {c.lastMessage.type === "image" ? "📷 ફોટો" : c.lastMessage.type === "video" ? "🎥 વિડિયો" : c.lastMessage.text || "—"}
                        </span>
                      ) : (
                        "વાતચીત શરૂ કરો..."
                      )}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasDisappearing && (
                        <span className="text-[10px] text-purple-700" title="અદ્રશ્ય સંદેશા સક્રિય">
                          ⏱️
                        </span>
                      )}
                      {(c.muted || []).includes(user?.id) && (
                        <BellOff className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {un > 0 && (
                        <span
                          data-testid={`conv-unread-${c.id}`}
                          className="bg-purple-800 text-white text-[10px] font-extrabold min-w-[20px] h-[20px] px-1.5 rounded-full grid place-items-center shadow-xs"
                        >
                          {un > 99 ? "99+" : un}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Friendly Gujarati Empty State */}
          {!filteredList.length && (
            <div className="text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-800 grid place-items-center mx-auto shadow-xs">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">હજી કોઈ ચેટ નથી</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  સમાજના સભ્યો સાથે વાતચીત શરૂ કરો.
                </p>
              </div>
              <button
                data-testid="empty-start-chat-btn"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-900 text-white text-xs font-semibold shadow hover:bg-purple-950 transition"
              >
                <Plus className="w-3.5 h-3.5" /> નવી ચેટ શરૂ કરો
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: ACTIVE CHAT WINDOW */}
      <section
        className={
          cid
            ? "flex-1 min-w-0"
            : "hidden md:flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-100 min-h-[65vh] p-8 text-center space-y-3"
        }
      >
        {cid ? (
          <ChatWindow cid={cid} onBack={() => nav("/messages")} />
        ) : (
          <div className="space-y-3 max-w-sm">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-800 grid place-items-center mx-auto shadow-xs">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">સમાજ મેસેન્જર</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ડાબી બાજુની યાદીમાંથી કોઈપણ સભ્ય અથવા ગ્રુપ પસંદ કરીને સુરક્ષિત વાતચીત કરો.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-800 to-indigo-700 text-white text-xs font-bold shadow-md hover:from-purple-900 hover:to-indigo-800 transition"
            >
              <Plus className="w-4 h-4" /> નવી ચેટ પસંદ કરો
            </button>
          </div>
        )}
      </section>

      {/* New Chat Modal */}
      <NewChatDialog
        open={open}
        onOpenChange={setOpen}
        onOpened={(id) => {
          setOpen(false);
          nav(`/messages/${id}`);
        }}
      />
    </div>
  );
}
