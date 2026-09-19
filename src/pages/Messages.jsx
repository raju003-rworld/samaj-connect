import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, Plus, Users, BellOff, Phone, Video, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const { user, t, activeSamaj } = useApp();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [group, setGroup] = useState(false);
  const [sel, setSel] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const myPhoneClean = useApp()?.user?.phone ? String(useApp().user.phone).replace(/\D/g, "").slice(-10) : "";

  useEffect(() => {
    if (open) {
      api
        .get("/users/search", { params: { q } })
        .then(({ data }) => setUsers(dedupeById(data.items || [])))
        .catch(() => {});
    }
  }, [q, open]);

  // Clean raw digits typed in search
  const cleanDigits = q.replace(/\D/g, "");
  const is10DigitPhone = cleanDigits.length >= 10;
  const typedPhone10 = cleanDigits.slice(-10);
  const isMyNumber = Boolean(myPhoneClean && typedPhone10 === myPhoneClean);

  // Filter out the logged-in user from contact directory list
  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      if (!u) return false;
      if (user?.id && u.id === user.id) return false;
      const uPhone = u.phone ? String(u.phone).replace(/\D/g, "").slice(-10) : "";
      if (myPhoneClean && uPhone && uPhone === myPhoneClean) return false;
      return true;
    });
  }, [users, user?.id, myPhoneClean]);

  // Check if typed phone matches an existing member
  const matchedUserByPhone = useMemo(() => {
    if (!is10DigitPhone || isMyNumber) return null;
    return filteredUsers.find((u) => {
      const uPhone = u.phone ? String(u.phone).replace(/\D/g, "").slice(-10) : "";
      return uPhone === typedPhone10;
    });
  }, [filteredUsers, is10DigitPhone, isMyNumber, typedPhone10]);

  // Open direct chat by member ID
  const directWithUser = async (u) => {
    try {
      setLoading(true);
      const { data } = await api.post("/conversations/direct", { userId: u.id });
      onOpened(data.id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "ચેટ શરૂ થઈ શકી નથી");
    } finally {
      setLoading(false);
    }
  };

  // Open direct chat by phone number (any phone number!)
  const directWithPhone = async (phoneNumber) => {
    if (isMyNumber) {
      return toast.error("તમે તમારા પોતાના નંબર સાથે ચેટ શરૂ ન કરી શકો");
    }
    try {
      setLoading(true);
      const { data } = await api.post("/conversations/direct", { phone: phoneNumber });
      onOpened(data.id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "ચેટ શરૂ થઈ શકી નથી");
    } finally {
      setLoading(false);
    }
  };

  // Create Group
  const createGroup = async () => {
    if (!name.trim() || !sel.length) {
      return toast.error("ગ્રુપ નામ અને ઓછામાં ઓછો એક સભ્ય પસંદ કરો");
    }
    try {
      setLoading(true);
      const { data } = await api.post("/conversations/group", { name, memberIds: sel });
      onOpened(data.id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "ગ્રુપ બનાવી શકાયું નથી");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] rounded-3xl p-5 overflow-hidden" data-testid="new-chat-dialog">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {group ? "નવું ગ્રુપ બનાવો (New Group)" : "નવી ચેટ શરૂ કરો (New Chat)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            કોઈપણ મોબાઈલ નંબર દાખલ કરો અથવા સભ્ય પસંદ કરો
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch between Direct Chat and Group */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold mb-3">
          <button
            data-testid="newchat-tab-direct"
            onClick={() => setGroup(false)}
            className={`py-2 rounded-xl transition-all ${
              !group ? "bg-white text-purple-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            વ્યક્તિગત ચેટ (Direct)
          </button>
          <button
            data-testid="newchat-tab-group"
            onClick={() => setGroup(true)}
            className={`py-2 rounded-xl transition-all ${
              group ? "bg-white text-purple-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ગ્રુપ ચેટ (Group)
          </button>
        </div>

        {/* Group Name input if in Group mode */}
        {group && (
          <div className="mb-3">
            <input
              data-testid="group-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ગ્રુપનું નામ લખો..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:border-purple-600 bg-slate-50/50"
            />
          </div>
        )}

        {/* Search & Number Input */}
        <div className="relative mb-3">
          <input
            data-testid="newchat-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="મોબાઈલ નંબર (૧૦ અંક) અથવા સભ્યનું નામ..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:border-purple-600 bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-purple-700 absolute left-3 top-3" />
        </div>

        {/* Direct Phone Number Action Box */}
        {!group && is10DigitPhone && (
          <div className="mb-3">
            {isMyNumber ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>આ તમારો પોતાનો નંબર છે. તમે તમારા પોતાના નંબર સાથે ચેટ શરૂ ન કરી શકો.</span>
              </div>
            ) : matchedUserByPhone ? (
              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-purple-950 truncate">
                    {matchedUserByPhone.name || `+91 ${typedPhone10}`}
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium">
                    📞 +91 {typedPhone10} • સભ્ય મળ્યા
                  </div>
                </div>
                <button
                  disabled={loading}
                  onClick={() => directWithUser(matchedUserByPhone)}
                  className="shrink-0 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition"
                >
                  ચેટ કરો
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">
                    +91 {typedPhone10}
                  </div>
                  <div className="text-[11px] text-purple-800 font-medium">
                    આ નંબર સાથે નવી સીધી ચેટ શરૂ કરો
                  </div>
                </div>
                <button
                  data-testid="start-chat-phone-btn"
                  disabled={loading}
                  onClick={() => directWithPhone(typedPhone10)}
                  className="shrink-0 bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition"
                >
                  ચેટ શરૂ કરો
                </button>
              </div>
            )}
          </div>
        )}

        {/* Member Directory List */}
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
          {group ? "સભ્યો પસંદ કરો (Select Members)" : "સંપર્ક યાદી (Contacts)"}
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
          {filteredUsers.map((u) => {
            const isSelected = sel.includes(u.id);
            const displayName = u.name?.replace(/\(Admin\)|\(Ahmedabad Samaj Admin\)/gi, "").trim() || (u.phone ? `+91 ${u.phone}` : "સભ્ય");
            const phoneDisplay = u.phone ? `+91 ${u.phone.replace(/\D/g, "").slice(-10)}` : "";

            return (
              <button
                key={u.id}
                data-testid={`newchat-user-${u.id}`}
                onClick={() => {
                  if (group) {
                    setSel((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]));
                  } else {
                    directWithUser(u);
                  }
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all ${
                  isSelected
                    ? "bg-purple-50 border border-purple-300"
                    : "hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-900 grid place-items-center font-bold overflow-hidden shrink-0 border border-purple-200">
                  {u.profilePhoto ? (
                    <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (displayName[0] || "?").toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {phoneDisplay || u.village || "સમાજ સભ્ય"}
                  </div>
                </div>

                {group && (
                  <div
                    className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 ${
                      isSelected
                        ? "bg-purple-800 border-purple-800 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                )}
              </button>
            );
          })}

          {!filteredUsers.length && (
            <div className="text-xs text-slate-500 text-center py-6">
              કોઈ સભ્ય મળ્યા નથી. ઉપર ૧૦ અંકનો મોબાઈલ નંબર દાખલ કરીને સીધી ચેટ શરૂ કરી શકો છો.
            </div>
          )}
        </div>

        {/* Group Create Button */}
        {group && (
          <button
            data-testid="group-create-btn"
            disabled={loading || !name.trim() || !sel.length}
            onClick={createGroup}
            className="w-full mt-3 py-2.5 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 disabled:opacity-50 text-white text-sm font-bold shadow-md transition active:scale-95"
          >
            ગ્રુપ બનાવો ({sel.length} સભ્યો)
          </button>
        )}
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

  // Find other participant in direct chat
  const getOtherUser = (c) => {
    if (c.type === "group") return null;
    const members = c.members || {};
    const entries = Object.entries(members).filter(([k]) => k !== user?.id && k !== user?.phone);
    if (entries.length > 0) {
      return entries[0][1];
    }
    return null;
  };

  // Get clean single name or phone number
  const getChatTitle = (c) => {
    if (c.type === "group") {
      return c.name || "ગ્રુપ ચેટ";
    }
    const other = getOtherUser(c);
    if (other) {
      if (other.name && other.name.trim() && !other.name.startsWith("user_")) {
        const cleanName = other.name.replace(/\(Admin\)|\(Ahmedabad Samaj Admin\)/gi, "").trim();
        if (cleanName) return cleanName;
      }
      if (other.phone) {
        return `+91 ${other.phone.replace(/\D/g, "").slice(-10)}`;
      }
    }
    // Fallback if other user object is minimal
    if (c.phone) {
      return `+91 ${c.phone.replace(/\D/g, "").slice(-10)}`;
    }
    if (c.id?.startsWith("d_")) {
      const parts = c.id.replace(/^d_/, "").split("_");
      const otherPart = parts.find((p) => p !== user?.id && p !== user?.phone);
      if (otherPart) {
        if (/^\d{10}$/.test(otherPart)) return `+91 ${otherPart}`;
        return otherPart.replace(/^user_/, "");
      }
    }
    return "સભ્ય";
  };

  const getChatSubtitle = (c) => {
    if (c.type === "group") {
      const count = c.memberIds?.length || Object.keys(c.members || {}).length || 2;
      return `${count} સભ્યો`;
    }
    const other = getOtherUser(c);
    if (other?.phone) {
      return `📞 +91 ${other.phone.replace(/\D/g, "").slice(-10)}`;
    }
    if (other?.village) {
      return `🏛️ ${other.village}`;
    }
    return "";
  };

  const getChatPhoto = (c) => {
    if (c.type === "group") return c.photo;
    const other = getOtherUser(c);
    return other?.photo || other?.profilePhoto;
  };

  // Sort conversations so newest or active chat is ALWAYS at the top
  const sortedConvs = useMemo(() => {
    return [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [convs]);

  // Filter list by search query and tabs
  const filteredList = useMemo(() => {
    return sortedConvs.filter((c) => {
      const title = getChatTitle(c).toLowerCase();
      const subtitle = getChatSubtitle(c).toLowerCase();
      const matchesSearch = !q || title.includes(q.toLowerCase()) || subtitle.includes(q.toLowerCase());
      if (!matchesSearch) return false;

      if (tab === "unread") {
        const un = c.unread?.[user?.id] || 0;
        return un > 0;
      }
      if (tab === "samaj") {
        const other = getOtherUser(c);
        return c.type === "group" || other?.samajId === activeSamaj?.id;
      }
      return true;
    });
  }, [sortedConvs, q, tab, user?.id, activeSamaj?.id]);

  const incomingCallConv = convs.find(
    (c) =>
      c.activeCall &&
      c.activeCall.receiverId === user?.id &&
      (c.activeCall.status === "calling" || c.activeCall.status === "ringing") &&
      cid !== c.id
  );

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <div
        className={`h-full w-full max-w-full min-w-0 ${
          cid
            ? "flex flex-col md:grid md:grid-cols-[330px_1fr] lg:grid-cols-[360px_1fr] md:gap-4"
            : "grid md:grid-cols-[330px_1fr] lg:grid-cols-[360px_1fr] gap-4"
        }`}
      >
        {/* LEFT SIDEBAR: CONVERSATION LIST */}
        <aside className={`${cid ? "hidden md:flex" : "flex"} flex-col space-y-3 w-full max-w-full min-w-0`}>
          {/* Incoming Call Alert Banner */}
          {incomingCallConv && (
            <div
              data-testid="incoming-call-alert"
              className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 rounded-3xl shadow-lg flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-white/20 grid place-items-center shrink-0">
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
                  <div className="text-[10px] text-emerald-100 font-medium truncate">
                    ઇનકમિંગ {incomingCallConv.activeCall.callType === "video" ? "વિડિઓ" : "વૉઇસ"} કૉલ...
                  </div>
                </div>
              </div>
              <button
                onClick={() => nav(`/messages/${incomingCallConv.id}`)}
                className="bg-white text-emerald-900 font-bold text-xs px-3.5 py-1.5 rounded-full shadow hover:bg-emerald-50 shrink-0"
              >
                જોડાવો
              </button>
            </div>
          )}

          {/* Top Header: Title & Prominent "+ નવી ચેટ" button */}
          <div className="flex items-center justify-between gap-2 px-1 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-extrabold text-slate-900 text-xl tracking-tight truncate">
                સંદેશા (Messages)
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">સમાજ સભ્યો સાથે સીધી વાતચીત</p>
            </div>
            <button
              data-testid="new-chat-btn"
              onClick={() => setOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-md shadow-purple-900/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>નવી ચેટ</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-2xs w-full min-w-0">
            <Search className="w-4 h-4 text-purple-700 shrink-0" />
            <input
              data-testid="conv-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="સભ્ય અથવા નંબર શોધો..."
              className="flex-1 outline-none text-xs sm:text-sm bg-transparent placeholder:text-slate-400 text-slate-800 min-w-0"
            />
          </div>

          {/* Filter Tabs: તમામ | સમાજ | અવાંચેલ */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-2xl text-xs font-semibold w-full min-w-0">
            <button
              data-testid="chat-tab-all"
              onClick={() => setTab("all")}
              className={`py-1.5 rounded-xl text-center transition-all truncate ${
                tab === "all"
                  ? "bg-white text-purple-950 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              તમામ
            </button>
            <button
              data-testid="chat-tab-samaj"
              onClick={() => setTab("samaj")}
              className={`py-1.5 rounded-xl text-center transition-all truncate ${
                tab === "samaj"
                  ? "bg-white text-purple-950 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              સમાજ
            </button>
            <button
              data-testid="chat-tab-unread"
              onClick={() => setTab("unread")}
              className={`py-1.5 rounded-xl text-center transition-all truncate ${
                tab === "unread"
                  ? "bg-white text-purple-950 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              અવાંચેલ
            </button>
          </div>

          {/* Conversation List */}
          <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-xs w-full min-w-0">
            {filteredList.map((c) => {
              const un = c.unread?.[user?.id] || 0;
              const isSelected = cid === c.id;
              const other = getOtherUser(c);
              const isOnline = c.type !== "group" && other?.online;
              const hasDisappearing = c.disappearingDuration && c.disappearingDuration !== "off";
              const title = getChatTitle(c);
              const subtitle = getChatSubtitle(c);

              return (
                <button
                  key={c.id}
                  data-testid={`conv-${c.id}`}
                  onClick={() => nav(`/messages/${c.id}`)}
                  className={`w-full max-w-full min-w-0 flex items-center gap-3 p-3 text-left transition-all overflow-hidden ${
                    isSelected
                      ? "bg-purple-50/90 border-l-4 border-l-purple-800"
                      : "hover:bg-slate-50/80 active:bg-slate-100"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-900 grid place-items-center font-extrabold text-sm overflow-hidden border border-purple-200/80 shadow-2xs">
                      {getChatPhoto(c) ? (
                        <img src={getChatPhoto(c)} alt="" className="w-full h-full object-cover" />
                      ) : c.type === "group" ? (
                        <Users className="w-5 h-5 text-purple-800" />
                      ) : (
                        (title[0] || "?").toUpperCase()
                      )}
                    </div>
                    {isOnline && (
                      <span
                        data-testid={`online-dot-${c.id}`}
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                        title="ઓનલાઇન"
                      />
                    )}
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-sm truncate min-w-0 ${
                          un > 0 || isSelected ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                        }`}
                      >
                        {title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                        {c.lastMessage?.createdAt
                          ? new Date(c.lastMessage.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    {/* Subtitle: Phone number or village or member count */}
                    {subtitle && (
                      <div className="text-[10px] text-purple-800 font-medium truncate mb-0.5">
                        {subtitle}
                      </div>
                    )}

                    {/* Last Message Preview & Unread Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs text-slate-500 truncate flex-1 min-w-0 leading-tight">
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

                      <div className="flex items-center gap-1 shrink-0 ml-1">
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
                            className="bg-purple-800 text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center shadow-xs"
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

            {/* Empty State */}
            {!filteredList.length && (
              <div className="text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-800 grid place-items-center mx-auto shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-sm">કોઈ ચેટ નથી</h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
                    કોઈપણ સભ્ય અથવા મોબાઈલ નંબર સાથે ચેટ શરૂ કરો.
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
              ? "flex-1 min-w-0 h-full flex flex-col overflow-hidden"
              : "hidden md:flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-100 min-h-[65vh] p-8 text-center space-y-3"
          }
        >
          {cid ? (
            <ChatWindow cid={cid} onBack={() => nav("/messages")} />
          ) : (
            <div className="space-y-3 max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-800 grid place-items-center mx-auto shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base">સમાજ મેસેન્જર</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ડાબી બાજુની યાદીમાંથી કોઈપણ સભ્ય પસંદ કરો અથવા ઉપર "+ નવી ચેટ" બટન દબાવીને કોઈપણ નંબર સાથે ચેટ શરૂ કરો.
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
          onOpened={(newConvId) => {
            setOpen(false);
            nav(`/messages/${newConvId}`);
            loadConversations();
          }}
        />
      </div>
    </div>
  );
}
