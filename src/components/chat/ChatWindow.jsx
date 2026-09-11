import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Reply,
  Trash2,
  Check,
  CheckCheck,
  BellOff,
  Bell,
  MoreVertical,
  FileText,
  ArrowLeft,
  UserPlus,
  Phone,
  Video,
  Pencil,
  X,
  Clock,
  Palette,
  ShieldAlert,
  PhoneIncoming,
  PhoneMissed,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { listenConversation, listenPresence } from "@/lib/firebase";
import { MediaUploader } from "@/components/MediaUploader";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { ThemePickerModal, CHAT_THEMES } from "@/components/chat/ThemePickerModal";
import { DisappearingModal } from "@/components/chat/DisappearingModal";
import { DeleteMessageModal } from "@/components/chat/DeleteMessageModal";

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const Ticks = ({ m, members }) => {
  const others = members.filter((i) => i !== m.senderId);
  const read = others.length && others.every((i) => (m.readBy || []).includes(i));
  const delivered =
    others.length && others.every((i) => (m.deliveredTo || []).includes(i) || (m.readBy || []).includes(i));
  if (read) return <CheckCheck className="w-3.5 h-3.5 text-sky-400" data-testid="tick-read" />;
  if (delivered) return <CheckCheck className="w-3.5 h-3.5 text-slate-300" data-testid="tick-delivered" />;
  return <Check className="w-3.5 h-3.5 text-slate-300" data-testid="tick-sent" />;
};

const DISAPPEARING_LABELS = {
  off: "બંધ (Off)",
  "1m": "1 મિનિટ (1 Minute)",
  "5m": "5 મિનિટ (5 Minutes)",
  "1h": "1 કલાક (1 Hour)",
  "1d": "1 દિવસ (1 Day)",
  "24h": "24 કલાક (24 Hours)",
  "7d": "7 દિવસ (7 Days)",
};

const getCachedConvSettings = (cId) => {
  try {
    return {
      disappearingDuration: localStorage.getItem(`samaj_conv_disappearing_${cId}`) || null,
      theme: localStorage.getItem(`samaj_conv_theme_${cId}`) || null,
    };
  } catch {
    return { disappearingDuration: null, theme: null };
  }
};

const setCachedConvSettings = (cId, updates) => {
  try {
    if (updates.disappearingDuration !== undefined) {
      localStorage.setItem(`samaj_conv_disappearing_${cId}`, updates.disappearingDuration || "off");
    }
    if (updates.theme !== undefined) {
      localStorage.setItem(`samaj_conv_theme_${cId}`, updates.theme || "default");
    }
  } catch {}
};

const getDisappearingDurationMs = (dur) => {
  switch (dur) {
    case "1m":
      return 60 * 1000;
    case "5m":
      return 5 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "1d":
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

const dedupeMsgs = (items) => {
  const seen = new Set();
  return (items || []).filter((m) => {
    if (!m?.id || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

const Bubble = ({
  m,
  mine,
  members,
  currentThemeConfig,
  onReply,
  onEdit,
  onDelete,
  onCallBack,
  editingId,
  editText,
  setEditText,
  onSaveEdit,
  onCancelEdit,
}) => {
  const isEditing = editingId === m.id;

  // Handle Call Log Bubble
  if (m.type === "call") {
    const isVideo = m.callInfo?.callType === "video";
    const isMissed = m.callInfo?.status === "rejected" || m.callInfo?.status === "missed";
    return (
      <div className="flex justify-center my-2" data-testid={`msg-call-${m.id}`}>
        <div className="flex items-center gap-3 bg-white/90 border border-slate-200/80 shadow-sm rounded-2xl px-4 py-2 text-xs text-slate-700 backdrop-blur-sm">
          <div
            className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 ${
              isMissed ? "bg-rose-100 text-rose-600" : "bg-purple-100 text-purple-800"
            }`}
          >
            {isVideo ? <Video className="w-4 h-4" /> : isMissed ? <PhoneMissed className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900">{m.text}</div>
            <div className="text-[10px] text-slate-400">{fmtTime(m.createdAt)}</div>
          </div>
          {onCallBack && (
            <button
              data-testid={`callback-btn-${m.id}`}
              onClick={() => onCallBack(isVideo ? "video" : "voice")}
              className="text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition-colors"
            >
              કૉલ બેક
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} group my-1`} data-testid={`msg-${m.id}`}>
      <div
        className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-colors ${
          mine
            ? `${currentThemeConfig.bubbleMine} rounded-br-sm`
            : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
        }`}
      >
        {!mine && (
          <div className={`text-[10px] font-semibold mb-0.5 ${currentThemeConfig.accentText}`}>
            {m.senderName}
          </div>
        )}

        {m.replyTo && (
          <div
            className={`text-[11px] border-l-2 pl-2 mb-1 opacity-80 ${
              mine ? "border-white/50" : "border-purple-600"
            }`}
          >
            <span className="font-semibold">{m.replyTo.senderName || "સભ્ય"}:</span> {m.replyTo.text || m.replyTo.type}
          </div>
        )}

        {m.deleted ? (
          <i className="opacity-70 text-xs flex items-center gap-1.5 py-0.5" data-testid={`msg-deleted-${m.id}`}>
            🚫 આ મેસેજ ડિલીટ કરવામાં આવ્યો છે
          </i>
        ) : isEditing ? (
          /* Inline Edit Mode */
          <div className="space-y-1.5 py-1">
            <input
              type="text"
              data-testid="edit-msg-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSaveEdit(m.id)}
              className="w-full px-2.5 py-1 text-sm rounded-lg bg-white/20 text-inherit border border-white/40 outline-none focus:ring-1 focus:ring-white"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              <button
                data-testid="edit-msg-cancel-btn"
                onClick={onCancelEdit}
                className="p-1 rounded bg-white/20 hover:bg-white/30 text-xs"
                title="રદ કરો"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                data-testid="edit-msg-save-btn"
                onClick={() => onSaveEdit(m.id)}
                className="p-1 rounded bg-white text-purple-950 hover:bg-white/90 text-xs font-bold"
                title="સાચવો"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {m.type === "image" && (
              <img src={m.mediaUrl} alt="" className="rounded-xl max-h-72 object-contain mb-1.5 border border-black/5" />
            )}
            {m.type === "video" && (
              <video src={m.mediaUrl} controls className="rounded-xl max-h-72 mb-1.5 border border-black/5" />
            )}
            {m.type === "voice" && <audio src={m.mediaUrl} controls className="mb-1.5 max-w-full" />}
            {m.type === "document" && (
              <a
                href={m.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 underline mb-1 p-2 rounded-xl bg-black/5 hover:bg-black/10"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">{m.fileName || "Document"}</span>
              </a>
            )}
            {m.text && <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>}
          </>
        )}

        {/* Bubble Footer & Actions */}
        <div
          className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] ${
            mine ? "text-white/75" : "text-slate-400"
          }`}
        >
          {m.edited && (
            <span className="italic opacity-80" data-testid={`msg-edited-${m.id}`}>
              (સુધારેલ)
            </span>
          )}
          {m.disappearingDuration && m.disappearingDuration !== "off" && (
            <span
              className="opacity-70 flex items-center gap-0.5"
              title={`અદ્રશ્ય સંદેશ: ${m.disappearingDuration}`}
              data-testid={`msg-disappearing-${m.id}`}
            >
              <Clock className="w-2.5 h-2.5 inline" />
            </span>
          )}
          <span>{fmtTime(m.createdAt)}</span>
          {mine && <Ticks m={m} members={members} />}

          {!m.deleted && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <button
                onClick={() => onReply(m)}
                className="hover:scale-110 p-0.5"
                title="જવાબ આપો (Reply)"
                data-testid={`msg-reply-${m.id}`}
              >
                <Reply className="w-3 h-3" />
              </button>
              {mine && (
                <button
                  onClick={() => onEdit(m)}
                  className="hover:scale-110 p-0.5"
                  title="સુધારો (Edit)"
                  data-testid={`msg-edit-${m.id}`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => onDelete(m)}
                className="hover:scale-110 p-0.5 text-rose-400 hover:text-rose-600"
                title="ડિલીટ કરો"
                data-testid={`msg-delete-${m.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function ChatWindow({ cid, onBack }) {
  const { user, t } = useApp();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [presence, setPresence] = useState(null);
  const [menu, setMenu] = useState(false);

  // Point 1 Features States
  const [activeCall, setActiveCall] = useState(null);
  const [themeModal, setThemeModal] = useState(false);
  const [disappearingModal, setDisappearingModal] = useState(false);
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);

  const bottom = useRef(null);
  const typingT = useRef(null);

  const otherId = conv?.type === "direct" ? conv.memberIds.find((i) => i !== user.id) : null;
  const otherUser = otherId ? conv?.members?.[otherId] : null;

  // Sync blocked state
  useEffect(() => {
    if (otherId && user?.blocked) {
      setIsBlockedByMe(user.blocked.includes(otherId));
    }
  }, [otherId, user?.blocked]);

  // Main Loader & Poller for Conversation and Messages
  const refreshConvAndMsgs = () => {
    api
      .get(`/conversations/${cid}`)
      .then(({ data }) => {
        if (data) {
          const cached = getCachedConvSettings(cid);
          const merged = {
            ...data,
            disappearingDuration: data.disappearingDuration || cached.disappearingDuration || "off",
            theme: data.theme || cached.theme || "default",
          };
          setConv(merged);
          if (data.activeCall) {
            setActiveCall(data.activeCall);
          } else {
            setActiveCall(null);
          }
        }
      })
      .catch(() => {});

    api
      .get(`/conversations/${cid}/messages`)
      .then(({ data }) => {
        if (data?.items) {
          const cached = getCachedConvSettings(cid);
          const activeDur = conv?.disappearingDuration || cached.disappearingDuration;
          const now = Date.now();
          const visible = data.items
            .filter((m) => {
              const msgDur = m.disappearingDuration || activeDur;
              if (!msgDur || msgDur === "off") return true;
              if (!m.readAt) return true;
              const durMs = getDisappearingDurationMs(msgDur);
              if (!durMs) return true;
              return now - new Date(m.readAt).getTime() < durMs;
            })
            .map((m) => {
              if (activeDur && activeDur !== "off" && !m.disappearingDuration) {
                return { ...m, disappearingDuration: activeDur };
              }
              return m;
            });
          setMsgs(dedupeMsgs(visible));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshConvAndMsgs();
    const u1 = listenConversation(cid, (c) => {
      if (c) {
        setConv((prev) => {
          const cached = getCachedConvSettings(cid);
          return {
            ...prev,
            ...c,
            disappearingDuration:
              c.disappearingDuration ||
              prev?.disappearingDuration ||
              cached.disappearingDuration ||
              "off",
            theme: c.theme || prev?.theme || cached.theme || "default",
          };
        });
        setActiveCall(c.activeCall || null);
      }
    });

    api.post(`/conversations/${cid}/delivered`).catch(() => {});
    api.post(`/conversations/${cid}/read`).catch(() => {});

    // Polling backup to guarantee real-time calling and message updates in development
    const interval = setInterval(refreshConvAndMsgs, 2500);

    return () => {
      if (typeof u1 === "function") u1();
      clearInterval(interval);
    };
  }, [cid, user.id]);

  // Real-time ticking for Disappearing Messages cleanup
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      setMsgs((prev) => {
        let changed = false;
        const next = prev.filter((m) => {
          if (m.senderId === "system") return true;
          const msgDur = m.disappearingDuration || conv?.disappearingDuration;
          if (!msgDur || msgDur === "off") return true;
          const msgDurMs = getDisappearingDurationMs(msgDur);
          if (!msgDurMs) return true;

          // Message disappearing timer strictly counts down from server-side readAt
          if (!m.readAt) return true;
          const isExpired = now - new Date(m.readAt).getTime() >= msgDurMs;
          if (isExpired) {
            changed = true;
            return false;
          }
          return true;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [conv?.disappearingDuration]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
    if (msgs.length) {
      api.post(`/conversations/${cid}/read`).catch(() => {});
    }
  }, [msgs.length, cid]);

  // Presence listener
  useEffect(() => {
    if (otherId) return listenPresence(otherId, setPresence);
  }, [otherId]);

  // Send Message
  const send = async (extra = {}) => {
    if (isBlockedByMe) {
      return toast.error("આ યુઝર બ્લોક કરેલ છે. મેસેજ મોકલવા પહેલા અનબ્લોક કરો.");
    }
    if (!text.trim() && !extra.mediaUrl) return;
    const currentDur = conv?.disappearingDuration || "off";
    const body = {
      type: "text",
      text,
      replyTo: replyTo ? { id: replyTo.id, senderName: replyTo.senderName, text: replyTo.text, type: replyTo.type } : null,
      disappearingDuration: currentDur !== "off" ? currentDur : undefined,
      ...extra,
    };
    setText("");
    setReplyTo(null);
    try {
      const { data: newMsg } = await api.post(`/conversations/${cid}/messages`, body);
      const enrichedMsg = {
        ...newMsg,
        disappearingDuration: newMsg.disappearingDuration || (currentDur !== "off" ? currentDur : undefined),
      };
      setMsgs((prev) => dedupeMsgs([...prev, enrichedMsg]));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "મોકલવામાં નિષ્ફળ");
    }
  };

  const onType = (v) => {
    setText(v);
    api.post(`/conversations/${cid}/typing`, { typing: true }).catch(() => {});
    clearTimeout(typingT.current);
    typingT.current = setTimeout(
      () => api.post(`/conversations/${cid}/typing`, { typing: false }).catch(() => {}),
      2000
    );
  };

  const upload = (urls, files) => {
    const f = files[0];
    const type = f.type.startsWith("image/")
      ? "image"
      : f.type.startsWith("video/")
      ? "video"
      : f.type.startsWith("audio/")
      ? "voice"
      : "document";
    send({ type, mediaUrl: urls[0], fileName: f.name });
  };

  // Edit Message
  const handleStartEdit = (m) => {
    setEditingId(m.id);
    setEditText(m.text || "");
  };

  const handleSaveEdit = async (mid) => {
    if (!editText.trim()) {
      return toast.error("સંદેશ ખાલી ન હોઈ શકે");
    }
    try {
      const { data } = await api.patch(`/conversations/${cid}/messages/${mid}`, { text: editText });
      setMsgs((prev) =>
        prev.map((m) => (m.id === mid ? { ...m, text: editText, edited: true, editedAt: new Date().toISOString() } : m))
      );
      setEditingId(null);
      setEditText("");
      toast.success("મેસેજ સુધારી લેવાયો");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "સુધારવામાં ભૂલ થઈ");
    }
  };

  // Delete Message
  const handleDeleteConfirm = async (m, forEveryone) => {
    try {
      await api.delete(`/conversations/${cid}/messages/${m.id}`, { params: { forEveryone } });
      if (forEveryone) {
        setMsgs((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, deleted: true, text: "", mediaUrl: "" } : item))
        );
        toast.success("બધા માટે ડિલીટ કરવામાં આવ્યો");
      } else {
        setMsgs((prev) => prev.filter((item) => item.id !== m.id));
        toast.success("તમારા માટે ડિલીટ કરવામાં આવ્યો");
      }
    } catch {
      toast.error("ડિલીટ કરવામાં ભૂલ થઈ");
    }
  };

  // Start Call
  const handleStartCall = async (callType) => {
    if (isBlockedByMe) {
      return toast.error("આ યુઝર બ્લોક છે. કૉલ કરવા માટે પહેલા અનબ્લોક કરો.");
    }
    try {
      const { data } = await api.post(`/conversations/${cid}/call/start`, { callType });
      setActiveCall(data.call);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "કૉલ શરૂ થઈ શક્યો નહીં");
    }
  };

  // Block / Unblock
  const handleToggleBlock = async () => {
    if (!otherId) return;
    try {
      if (isBlockedByMe) {
        await api.post(`/users/${otherId}/unblock`);
        setIsBlockedByMe(false);
        toast.success("યુઝર અનબ્લોક થયો");
      } else {
        await api.post(`/users/${otherId}/block`);
        setIsBlockedByMe(true);
        toast.success("યુઝર બ્લોક કરવામાં આવ્યો");
      }
      setMenu(false);
    } catch {
      toast.error("પ્રક્રિયા નિષ્ફળ ગઈ");
    }
  };

  // Disappearing Messages change
  const handleChangeDisappearing = async (duration) => {
    // 1. Immediately cache and update state
    setCachedConvSettings(cid, { disappearingDuration: duration });
    setConv((prev) => (prev ? { ...prev, disappearingDuration: duration } : prev));

    // 2. Add an informational system message in chat
    const label = DISAPPEARING_LABELS[duration] || duration;
    const sysMsg = {
      id: `sys_disappearing_${Date.now()}`,
      conversationId: cid,
      senderId: "system",
      senderName: "સિસ્ટમ",
      type: "text",
      text: `⏱️ અદ્રશ્ય થતા સંદેશા સેટિંગ બદલાયું: ${label}`,
      createdAt: new Date().toISOString(),
      readBy: [user.id],
      deliveredTo: [],
      deletedFor: [],
      deleted: false,
    };
    setMsgs((prev) => dedupeMsgs([...prev, sysMsg]));

    // 3. Attempt API patch and fallback gracefully
    try {
      await api.patch(`/conversations/${cid}/disappearing`, { duration });
    } catch {
      try {
        await fetch(`/api/conversations/${cid}/disappearing`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration }),
        });
      } catch {}
    }

    toast.success("અદ્રશ્ય થતા સંદેશા સેટિંગ બદલાયું");
  };

  // Theme change
  const handleChangeTheme = async (newTheme) => {
    // 1. Immediately cache and update state
    setCachedConvSettings(cid, { theme: newTheme });
    setConv((prev) => (prev ? { ...prev, theme: newTheme } : prev));

    // 2. Attempt API patch and fallback gracefully
    try {
      await api.patch(`/conversations/${cid}/theme`, { theme: newTheme });
    } catch {
      try {
        await fetch(`/api/conversations/${cid}/theme`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch {}
    }

    toast.success("ચેટ થીમ બદલાઈ ગઈ");
  };

  const mute = async () => {
    await api.post(`/conversations/${cid}/mute`);
    setMenu(false);
  };

  const addMember = async () => {
    const q = window.prompt("સભ્યનું નામ / મોબાઇલ:");
    if (!q) return;
    const { data } = await api.get("/users/search", { params: { q } });
    if (!data.items.length) return toast.error("યુઝર મળ્યો નહીં");
    await api.post(`/conversations/${cid}/members`, { memberIds: [data.items[0].id] });
    toast.success(`${data.items[0].name} ઉમેરાયા`);
    setMenu(false);
  };

  if (!conv) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-9rem)] bg-white rounded-3xl p-8 border border-slate-100">
        <div className="w-10 h-10 border-4 border-purple-800 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">વાતચીત લોડ થઈ રહી છે...</p>
      </div>
    );
  }

  const currentTheme = conv.theme || "default";
  const themeConfig = CHAT_THEMES[currentTheme] || CHAT_THEMES.default;

  const title = conv.type === "group" ? conv.name : conv.members?.[otherId]?.name;
  const typingNames = Object.entries(conv.typing || {})
    .filter(([k, v]) => v && k !== user.id)
    .map(([k]) => conv.members?.[k]?.name)
    .filter(Boolean);
  const muted = (conv.muted || []).includes(user.id);
  const sub = typingNames.length
    ? `${typingNames.join(", ")} ${t("typing")}`
    : conv.type === "group"
    ? `${conv.memberIds.length} ${t("members_count")}`
    : presence?.online
    ? t("online")
    : presence?.lastSeen
    ? `${t("last_seen")} ${fmtTime(presence.lastSeen)}`
    : "";

  const isDirect = conv.type === "direct";

  return (
    <div
      className={`flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-8rem)] ${themeConfig.bgClass} rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm relative transition-colors duration-300`}
      data-testid="chat-window"
    >
      {/* Top Bar Header */}
      <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center gap-2.5 sm:gap-3 border-b border-slate-200/80 shadow-xs z-10">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-full hover:bg-slate-100" data-testid="chat-back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-900 grid place-items-center font-bold overflow-hidden shrink-0 border border-purple-200">
          {(conv.type === "group" ? conv.photo : conv.members?.[otherId]?.photo) ? (
            <img
              src={conv.type === "group" ? conv.photo : conv.members?.[otherId]?.photo}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            (title?.[0] || "?").toUpperCase()
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900 truncate" data-testid="chat-title">
              {title}
            </span>
            {conv.disappearingDuration && conv.disappearingDuration !== "off" && (
              <span
                data-testid="chat-disappearing-badge"
                className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0"
                title={`અદ્રશ્ય સંદેશા: ${conv.disappearingDuration}`}
              >
                <Clock className="w-3 h-3" />
                <span>{conv.disappearingDuration}</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 truncate" data-testid="chat-subtitle">
            {sub}
          </div>
        </div>

        {/* Action Buttons: Voice Call, Video Call, Menu */}
        <div className="flex items-center gap-1">
          {isDirect && !isBlockedByMe && (
            <>
              <button
                data-testid="voice-call-btn"
                onClick={() => handleStartCall("voice")}
                className="p-2 rounded-full text-slate-600 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                title="વૉઇસ કૉલ"
              >
                <Phone className="w-4.5 h-4.5" />
              </button>

              <button
                data-testid="video-call-btn"
                onClick={() => handleStartCall("video")}
                className="p-2 rounded-full text-slate-600 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                title="વિડિઓ કૉલ"
              >
                <Video className="w-4.5 h-4.5" />
              </button>
            </>
          )}

          <div className="relative">
            <button
              onClick={() => setMenu(!menu)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              data-testid="chat-menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menu && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 w-52 z-30 text-sm animate-in fade-in zoom-in-95 duration-150">
                {/* Chat Theme Option */}
                <button
                  data-testid="menu-chat-theme"
                  onClick={() => {
                    setThemeModal(true);
                    setMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                >
                  <Palette className="w-4 h-4 text-purple-700" />
                  <span>ચેટ થીમ (Themes)</span>
                </button>

                {/* Disappearing Messages Option */}
                <button
                  data-testid="menu-disappearing"
                  onClick={() => {
                    setDisappearingModal(true);
                    setMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                >
                  <Clock className="w-4 h-4 text-purple-700" />
                  <span>અદ્રશ્ય સંદેશા</span>
                </button>

                {/* Block / Unblock Option for Direct Chat */}
                {isDirect && (
                  <button
                    data-testid="menu-block-user"
                    onClick={handleToggleBlock}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 ${
                      isBlockedByMe ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{isBlockedByMe ? "અનબ્લોક કરો (Unblock)" : "બ્લોક કરો (Block User)"}</span>
                  </button>
                )}

                {/* Mute */}
                <button
                  data-testid="chat-mute"
                  onClick={mute}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                >
                  {muted ? (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>{t("unmute")}</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      <span>{t("mute")}</span>
                    </>
                  )}
                </button>

                {/* Add Member for Group */}
                {conv.type === "group" && (conv.admins || []).includes(user.id) && (
                  <button
                    data-testid="chat-add-member"
                    onClick={addMember}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>સભ્ય ઉમેરો</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {dedupeMsgs(msgs).map((m) => (
          <Bubble
            key={m.id}
            m={m}
            mine={m.senderId === user.id}
            members={conv.memberIds}
            currentThemeConfig={themeConfig}
            onReply={setReplyTo}
            onEdit={handleStartEdit}
            onDelete={setDeleteModalMsg}
            onCallBack={handleStartCall}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
        <div ref={bottom} />
      </div>

      {/* Reply Banner */}
      {replyTo && (
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 text-xs text-slate-700 flex items-center gap-2 border-t border-slate-200">
          <span className="font-bold text-purple-900">↩ {replyTo.senderName}:</span>
          <span className="truncate flex-1 text-slate-600">{replyTo.text || replyTo.type}</span>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Input Area or Blocked Banner */}
      {isBlockedByMe ? (
        <div
          data-testid="chat-blocked-banner"
          className="bg-rose-50 border-t border-rose-200 p-3.5 flex items-center justify-between gap-3 text-rose-800 text-xs"
        >
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>તમે આ યુઝરને બ્લોક કરેલ છે. તમે કે તેઓ સંદેશા મોકલી શકતા નથી.</span>
          </div>
          <button
            data-testid="unblock-user-btn"
            onClick={handleToggleBlock}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 text-xs shrink-0"
          >
            અનબ્લોક કરો
          </button>
        </div>
      ) : conv.isBlockedByOther ? (
        <div
          data-testid="chat-blocked-by-other-banner"
          className="bg-slate-100 border-t border-slate-200 p-3.5 flex items-center justify-center gap-2 text-slate-600 text-xs font-medium"
        >
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
          <span>આ સભ્ય દ્વારા સંદેશાઓ મર્યાદિત કરવામાં આવ્યા છે. તમે મેસેજ મોકલી શકતા નથી.</span>
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 flex items-center gap-2 border-t border-slate-200/80">
          <MediaUploader
            multiple={false}
            kind="chat"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onDone={upload}
            testId="chat-attach"
            label="📎"
            className="!px-2.5"
          />

          <input
            data-testid="chat-input"
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={t("type_message")}
            className="flex-1 bg-slate-100/90 border border-slate-200/80 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
          />

          <button
            data-testid="chat-send"
            onClick={() => send()}
            className={`p-2.5 sm:p-3 rounded-full shadow-sm transition-all active:scale-95 ${themeConfig.btnMine}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals & Overlays */}
      {activeCall && (
        <CallOverlay
          cid={cid}
          call={activeCall}
          currentUser={user}
          otherUser={otherUser}
          onEndCall={() => {
            setActiveCall(null);
            refreshConvAndMsgs();
          }}
        />
      )}

      <ThemePickerModal
        open={themeModal}
        onOpenChange={setThemeModal}
        currentTheme={currentTheme}
        onSelectTheme={handleChangeTheme}
      />

      <DisappearingModal
        open={disappearingModal}
        onOpenChange={setDisappearingModal}
        currentDuration={conv.disappearingDuration || "off"}
        onSelectDuration={handleChangeDisappearing}
      />

      <DeleteMessageModal
        open={!!deleteModalMsg}
        onOpenChange={(open) => !open && setDeleteModalMsg(null)}
        message={deleteModalMsg}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
