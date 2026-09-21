import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Smile,
  Paperclip,
  Mic,
  MapPin,
  Search,
  User,
  Image as ImageIcon,
  Plus,
  ChevronRight,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { playNotificationSound, vibratePhone, showPhoneNotification } from "@/lib/pushNotifications";

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const getMessageDateKey = (iso) => {
  if (!iso) return "આજે";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "આજે";
  if (isYesterday) return "ગઈકાલે";
  try {
    return d.toLocaleDateString("gu-IN", { day: "numeric", month: "long" });
  } catch {
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
};

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
  "10s": "10 સેકન્ડ (10 Seconds)",
  "30s": "30 સેકન્ડ (30 Seconds)",
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
    case "10s":
      return 10 * 1000;
    case "30s":
      return 30 * 1000;
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
            {m.type === "image" && m.mediaUrl && (
              <img src={m.mediaUrl} alt="" className="rounded-xl max-h-72 object-contain mb-1.5 border border-black/5" />
            )}
            {m.type === "video" && m.mediaUrl && (
              <video
                src={m.mediaUrl}
                controls
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="rounded-xl max-h-72 mb-1.5 border border-black/5"
              />
            )}
            {m.type === "voice" && m.mediaUrl && (
              <audio
                src={m.mediaUrl}
                controls
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="mb-1.5 max-w-full"
              />
            )}
            {m.type === "location" && (
              <a
                href={m.mediaUrl || `https://www.google.com/maps?q=${encodeURIComponent(m.text || "")}`}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2.5 mb-1.5 p-2.5 rounded-xl border ${
                  mine ? "bg-white/15 border-white/20 text-white" : "bg-purple-50/80 border-purple-200/70 text-purple-950"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white grid place-items-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs">📍 સ્થાન (Location)</div>
                  <div className="text-[11px] truncate opacity-90">{m.text || "મેપ પર જુઓ"}</div>
                </div>
              </a>
            )}
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
  const nav = useNavigate();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [presence, setPresence] = useState(null);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);

  // Point 1 Features States
  const [activeCall, setActiveCall] = useState(null);
  const [themeModal, setThemeModal] = useState(false);
  const [disappearingModal, setDisappearingModal] = useState(false);
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const autoCallHandledRef = useRef(false);
  const activeCallRef = useRef(null);
  activeCallRef.current = activeCall;

  const bottom = useRef(null);
  const typingT = useRef(null);
  const knownMsgIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

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
          } else if (activeCallRef.current && (activeCallRef.current.status === "ended" || activeCallRef.current.status === "rejected")) {
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

          // Check if any brand new incoming message arrived from other participant
          const newIncoming = visible.filter(
            (m) => m.senderId !== user?.id && !knownMsgIdsRef.current.has(m.id)
          );

          if (!isFirstLoadRef.current && newIncoming.length > 0) {
            // Play sweet message chime & phone vibration
            playNotificationSound("message");
            vibratePhone([120, 60, 120]);

            // If user has minimized or switched tab, fire system notification
            if (typeof document !== "undefined" && document.hidden) {
              const latestMsg = newIncoming[newIncoming.length - 1];
              showPhoneNotification({
                title: `💬 નવો મેસેજ: ${latestMsg.senderName || otherUser?.name || "સભ્ય"}`,
                body: latestMsg.text || "નવો સંદેશ મળ્યો છે",
                link: `/messages/${cid}`,
                type: "message",
              });
            }
          }

          visible.forEach((m) => knownMsgIdsRef.current.add(m.id));
          isFirstLoadRef.current = false;
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

    // Polling backup to guarantee real-time message and call updates
    const interval = setInterval(refreshConvAndMsgs, 1600);

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
    if (!text.trim() && !extra.mediaUrl && !extra.text) return;
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
    setEmojiOpen(false);
    setAttachMenuOpen(false);
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
    setAttachMenuOpen(false);
  };

  const shareLocation = () => {
    setAttachMenuOpen(false);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          send({
            type: "location",
            mediaUrl: mapsUrl,
            text: `📍 સ્થાન: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
          toast.success("સ્થાન શેર થયું");
        },
        () => {
          const loc = window.prompt("તમારું ગામ / શહેર દાખલ કરો:");
          if (loc) {
            send({
              type: "location",
              mediaUrl: `https://www.google.com/maps?q=${encodeURIComponent(loc)}`,
              text: `📍 સ્થાન: ${loc}`,
            });
            toast.success("સ્થાન શેર થયું");
          }
        }
      );
    } else {
      const loc = window.prompt("તમારું ગામ / શહેર દાખલ કરો:");
      if (loc) {
        send({
          type: "location",
          mediaUrl: `https://www.google.com/maps?q=${encodeURIComponent(loc)}`,
          text: `📍 સ્થાન: ${loc}`,
        });
        toast.success("સ્થાન શેર થયું");
      }
    }
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
      await api.patch(`/conversations/${cid}/messages/${mid}`, { text: editText });
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
    const targetCid = conv?.id || cid;
    if (!targetCid) {
      return toast.error("ચેટ મળી નથી");
    }
    try {
      const { data } = await api.post(`/conversations/${targetCid}/call/start`, { callType });
      if (data?.call) {
        setActiveCall(data.call);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "કૉલ શરૂ થઈ શક્યો નહીં");
    }
  };

  // Trigger autoCall if navigated with ?autoCall=video or ?autoCall=voice
  useEffect(() => {
    const autoCall = searchParams.get("autoCall");
    if (autoCall && conv?.id && !autoCallHandledRef.current) {
      autoCallHandledRef.current = true;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("autoCall");
        return next;
      }, { replace: true });
      handleStartCall(autoCall === "video" ? "video" : "voice");
    }
  }, [conv?.id, searchParams]);

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

  // Clear Chat
  const handleClearChat = () => {
    if (window.confirm("શું તમે આ ચેટના તમામ સંદેશા સાફ કરવા માંગો છો?")) {
      setMsgs([]);
      toast.success("ચેટ સાફ કરવામાં આવી");
      setMenu(false);
    }
  };

  // Disappearing Messages change
  const handleChangeDisappearing = async (duration) => {
    setCachedConvSettings(cid, { disappearingDuration: duration });
    setConv((prev) => (prev ? { ...prev, disappearingDuration: duration } : prev));

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
    setCachedConvSettings(cid, { theme: newTheme });
    setConv((prev) => (prev ? { ...prev, theme: newTheme } : prev));

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
      <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh] bg-white rounded-none md:rounded-3xl p-8 border-0 md:border md:border-slate-100">
        <div className="w-10 h-10 border-4 border-purple-800 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">વાતચીત લોડ થઈ રહી છે...</p>
      </div>
    );
  }

  const currentTheme = conv.theme || "default";
  const themeConfig = CHAT_THEMES[currentTheme] || CHAT_THEMES.default;

  const otherName = conv.members?.[otherId]?.name?.replace(/\(Admin\)|\(Ahmedabad Samaj Admin\)/gi, "").trim();
  const title =
    conv.type === "group"
      ? conv.name || "ગ્રુપ ચેટ"
      : otherName || conv.members?.[otherId]?.phone || (otherId?.startsWith("user_") ? `+91 ${otherId.replace(/^user_/, "")}` : "સમાજ સભ્ય");
  const typingNames = Object.entries(conv.typing || {})
    .filter(([k, v]) => v && k !== user.id)
    .map(([k]) => conv.members?.[k]?.name)
    .filter(Boolean);
  const muted = (conv.muted || []).includes(user.id);
  const isOnline = presence?.online;
  const sub = typingNames.length
    ? `${typingNames.join(", ")} ${t("typing")}`
    : conv.type === "group"
    ? `${conv.memberIds.length} ${t("members_count")}`
    : isOnline
    ? "ઓનલાઇન"
    : presence?.lastSeen
    ? `${t("last_seen")} ${fmtTime(presence.lastSeen)}`
    : otherUser?.village || otherUser?.samajName || "સમાજ સભ્ય";

  const isDirect = conv.type === "direct" || (!conv.type && (conv.memberIds?.length === 2 || Object.keys(conv.members || {}).length === 2));

  // Filter messages if in-chat search query active
  const filteredMessages = dedupeMsgs(msgs).filter((m) => {
    if (!searchQ.trim()) return true;
    return (m.text || "").toLowerCase().includes(searchQ.toLowerCase());
  });

  return (
    <div
      className={`flex flex-col h-full w-full ${themeConfig.bgClass} rounded-none md:rounded-3xl overflow-hidden border-0 md:border md:border-slate-200/80 shadow-none md:shadow-sm relative transition-colors duration-300`}
      data-testid="chat-window"
    >
      {/* Top Bar Header (WhatsApp / Instagram DM Quality) */}
      <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center gap-2.5 sm:gap-3 border-b border-slate-200/80 shadow-2xs z-20">
        <button onClick={onBack} className="md:hidden p-2 rounded-full hover:bg-slate-100" data-testid="chat-back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Avatar with live status indicator */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-900 grid place-items-center font-bold overflow-hidden border border-purple-200">
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
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs animate-pulse" />
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900 truncate" data-testid="chat-title">
              {title}
            </span>
            {conv.disappearingDuration && conv.disappearingDuration !== "off" && (
              <button
                data-testid="chat-disappearing-badge"
                onClick={() => setDisappearingModal(true)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 transition-colors"
                title={`અદ્રશ્ય સંદેશા: ${conv.disappearingDuration}`}
              >
                <Clock className="w-3 h-3" />
                <span>{conv.disappearingDuration}</span>
              </button>
            )}
          </div>
          <div className="text-[11px] flex items-center gap-1.5 truncate" data-testid="chat-subtitle">
            {isOnline ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ઓનલાઇન
              </span>
            ) : (
              <span className="text-slate-500">{sub}</span>
            )}
          </div>
        </div>

        {/* Action Buttons: Audio call, Video call, In-Chat Search, Menu */}
        <div className="flex items-center gap-1">
          {/* In-chat search toggle */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearchQ("");
            }}
            className={`p-2 rounded-full transition-colors ${
              searchOpen ? "bg-purple-100 text-purple-900" : "text-slate-600 hover:bg-slate-100"
            }`}
            title="ચેટમાં શોધો (Search in Chat)"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {isDirect && !isBlockedByMe && (
            <>
              <button
                data-testid="voice-call-btn"
                onClick={() => handleStartCall("voice")}
                className="p-2 rounded-full text-slate-600 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                title="ઓડિયો કૉલ"
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

          {/* 3-Dot Extra Menu Trigger */}
          <button
            onClick={() => setMenu(true)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 active:scale-95 transition"
            data-testid="chat-menu"
            title="વધુ વિકલ્પો (Menu)"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modern Bottom Sheet for Chat Menu */}
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-slate-200/90 bg-white p-5 max-w-lg mx-auto shadow-2xl">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />
          <SheetHeader className="text-left pb-3 border-b border-slate-100 mb-2">
            <SheetTitle className="text-base font-extrabold text-slate-900 flex items-center justify-between">
              <span>ચેટ સેટિંગ્સ & વિકલ્પો</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-100 truncate max-w-[160px]">
                {title}
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              થીમ, ગોપનીયતા અને સુરક્ષા નિયંત્રણ સેટિંગ્સ
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
            {/* 🎨 Chat Theme */}
            <button
              data-testid="menu-chat-theme"
              onClick={() => {
                setThemeModal(true);
                setMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-purple-50/70 flex items-center justify-between text-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 grid place-items-center shrink-0 group-hover:scale-105 transition">
                  <Palette className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">🎨 ચેટ થીમ (Chat Themes)</div>
                  <div className="text-[11px] text-slate-500 capitalize">{currentTheme} થીમ સક્રિય</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
            </button>

            {/* ⏱ Disappearing Messages */}
            <button
              data-testid="menu-disappearing"
              onClick={() => {
                setDisappearingModal(true);
                setMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-purple-50/70 flex items-center justify-between text-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 grid place-items-center shrink-0 group-hover:scale-105 transition">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">⏱ અદ્રશ્ય સંદેશા (Disappearing)</div>
                  <div className="text-[11px] text-slate-500">
                    {conv.disappearingDuration && conv.disappearingDuration !== "off"
                      ? `ટાઈમર: ${conv.disappearingDuration}`
                      : "હાલમાં બંધ છે (Off)"}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 🔕 Mute */}
            <button
              data-testid="chat-mute"
              onClick={() => {
                mute();
                setMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-purple-50/70 flex items-center justify-between text-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 grid place-items-center shrink-0 group-hover:scale-105 transition">
                  {muted ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {muted ? "🔔 સૂચનાઓ ચાલુ કરો (Unmute)" : "🔕 સૂચનાઓ મ્યૂટ કરો (Mute)"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {muted ? "હાલમાં નોટિફિકેશન બંધ છે" : "નવા સંદેશા માટે નોટિફિકેશન મ્યૂટ કરો"}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700">{muted ? "અનમ્યૂટ" : "મ્યૂટ"}</span>
            </button>

            {/* 🔍 Search in Chat */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-purple-50/70 flex items-center justify-between text-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 grid place-items-center shrink-0 group-hover:scale-105 transition">
                  <Search className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">🔍 ચેટમાં શોધો (Search in Chat)</div>
                  <div className="text-[11px] text-slate-500">જૂના સંદેશાઓ શોધો</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
            </button>

            {/* View Profile */}
            {isDirect && otherId && (
              <button
                onClick={() => {
                  nav(`/profile/${otherId}`);
                  setMenu(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-purple-50/70 flex items-center justify-between text-slate-800 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 grid place-items-center shrink-0 group-hover:scale-105 transition">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">👤 પ્રોફાઇલ જુઓ (View Profile)</div>
                    <div className="text-[11px] text-slate-500">સભ્યની સંપૂર્ણ વિગતો જુઓ</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>
            )}

            {/* Add Member for Group */}
            {conv.type === "group" && (conv.admins || []).includes(user.id) && (
              <button
                data-testid="chat-add-member"
                onClick={() => {
                  addMember();
                  setMenu(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-purple-50/70 flex items-center justify-between text-slate-800 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 grid place-items-center shrink-0 group-hover:scale-105 transition">
                    <UserPlus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">👥 સભ્ય ઉમેરો (Add Member)</div>
                    <div className="text-[11px] text-slate-500">ગ્રૂપમાં અન્ય સભ્યોને જોડો</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>
            )}

            {/* 🚫 Block / Unblock Member */}
            {isDirect && (
              <button
                data-testid="menu-block-user"
                onClick={() => {
                  handleToggleBlock();
                  setMenu(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition group ${
                  isBlockedByMe ? "hover:bg-emerald-50 text-emerald-800" : "hover:bg-rose-50 text-rose-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition group-hover:scale-105 ${
                      isBlockedByMe ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <ShieldAlert className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {isBlockedByMe ? "🚫 અનબ્લોક કરો (Unblock Member)" : "🚫 બ્લોક કરો (Block Member)"}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {isBlockedByMe ? "સભ્ય સાથે ફરી વાતચીત કરી શકશો" : "આ સભ્ય તમને મેસેજ નહીં કરી શકે"}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold">{isBlockedByMe ? "અનબ્લોક" : "બ્લોક"}</span>
              </button>
            )}

            {/* Clear Chat */}
            <button
              onClick={() => {
                handleClearChat();
                setMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-100 text-slate-600 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 grid place-items-center shrink-0">
                  <Trash2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold">🗑️ ચેટ સાફ કરો (Clear Chat)</div>
                  <div className="text-[11px] text-slate-400">સ્ક્રીન પરથી મેસેજ દૂર કરો</div>
                </div>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* In-Chat Search Bar */}
      {searchOpen && (
        <div className="bg-purple-50/95 px-4 py-2 flex items-center gap-2 border-b border-purple-200 z-10 animate-in slide-in-from-top-1">
          <Search className="w-4 h-4 text-purple-700 shrink-0" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="ચેટમાં સંદેશો શોધો..."
            className="flex-1 bg-transparent text-xs text-purple-950 outline-none placeholder:text-purple-400 font-medium"
            autoFocus
          />
          {searchQ && (
            <span className="text-[10px] text-purple-700 font-bold">
              {filteredMessages.length} મળ્યા
            </span>
          )}
          <button
            onClick={() => {
              setSearchOpen(false);
              setSearchQ("");
            }}
            className="p-1 rounded-full hover:bg-purple-200/60 text-purple-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Disappearing Messages Indicator Banner */}
      {conv.disappearingDuration && conv.disappearingDuration !== "off" && (
        <div className="bg-gradient-to-r from-purple-100/90 via-indigo-100/90 to-purple-100/90 border-b border-purple-200/90 px-4 py-2 flex items-center justify-between text-xs text-purple-950 font-medium z-10">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-800 shrink-0" />
            <span>⏱️ {conv.disappearingDuration} માં મેસેજ આપમેળે અદ્રશ્ય થઈ જશે</span>
          </div>
          <button
            onClick={() => setDisappearingModal(true)}
            className="text-[11px] font-bold text-purple-800 hover:underline px-2 py-0.5 rounded"
          >
            બદલો
          </button>
        </div>
      )}

      {/* Messages Stream with Date Dividers */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {filteredMessages.map((m, idx) => {
          const prevMsg = filteredMessages[idx - 1];
          const currentDate = getMessageDateKey(m.createdAt);
          const prevDate = prevMsg ? getMessageDateKey(prevMsg.createdAt) : null;
          const showDateDivider = currentDate !== prevDate;

          return (
            <React.Fragment key={m.id}>
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] font-bold bg-white/90 backdrop-blur-xs text-slate-500 border border-slate-200/80 px-3.5 py-1 rounded-full shadow-2xs">
                    {currentDate}
                  </span>
                </div>
              )}
              <Bubble
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
            </React.Fragment>
          );
        })}
        <div ref={bottom} />
      </div>

      {/* Reply Banner */}
      {replyTo && (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-2 text-xs text-slate-700 flex items-center gap-2 border-t border-slate-200">
          <span className="font-bold text-purple-900">↩ {replyTo.senderName}:</span>
          <span className="truncate flex-1 text-slate-600">{replyTo.text || replyTo.type}</span>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Quick Picker Row */}
      {emojiOpen && (
        <div className="bg-white border-t border-slate-200/90 px-3 py-2 flex items-center gap-2 overflow-x-auto z-10 animate-in slide-in-from-bottom-2">
          {["🙏", "👍", "❤️", "😊", "👏", "🎉", "💐", "🚩", "🌸", "🙌", "✨", "🔥"].map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setText((prev) => prev + em);
              }}
              className="text-xl p-1.5 hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Popover Menu */}
      {attachMenuOpen && (
        <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-xl mx-3 mb-2 flex items-center justify-around gap-2 z-20 animate-in slide-in-from-bottom-2">
          <div className="text-center">
            <MediaUploader
              multiple={false}
              kind="chat"
              accept="image/*,video/*"
              onDone={upload}
              label={
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 grid place-items-center shadow-xs mx-auto hover:bg-purple-200 transition">
                  <ImageIcon className="w-5 h-5" />
                </div>
              }
              className="!p-0"
            />
            <span className="text-[10px] font-bold text-slate-700 mt-1 block">ફોટો / વિડિયો</span>
          </div>

          <div className="text-center">
            <MediaUploader
              multiple={false}
              kind="chat"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              onDone={upload}
              label={
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-800 grid place-items-center shadow-xs mx-auto hover:bg-indigo-200 transition">
                  <FileText className="w-5 h-5" />
                </div>
              }
              className="!p-0"
            />
            <span className="text-[10px] font-bold text-slate-700 mt-1 block">દસ્તાવેજ</span>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={shareLocation}
              className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 grid place-items-center shadow-xs mx-auto hover:bg-rose-200 transition"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold text-slate-700 mt-1 block">સ્થાન (Location)</span>
          </div>
        </div>
      )}

      {/* Bottom Composer Area or Blocked Banner */}
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
        /* Modern Composer: [＋] [Message લખો...] [😊] [🎤/➤] */
        <div className="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center gap-1.5 sm:gap-2 border-t border-slate-200/80 shrink-0">
          {/* [＋] Attachment Toggle */}
          <button
            type="button"
            data-testid="chat-attach-plus"
            onClick={() => {
              setAttachMenuOpen(!attachMenuOpen);
              setEmojiOpen(false);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              attachMenuOpen
                ? "bg-purple-900 text-white rotate-45 shadow-md"
                : "bg-purple-50 hover:bg-purple-100 text-purple-900 active:scale-95 border border-purple-100/80"
            }`}
            title="જોડાણ (Attach)"
          >
            <Plus className="w-5 h-5 transition-transform duration-200" />
          </button>

          {/* [Message લખો...] Input Box */}
          <input
            data-testid="chat-input"
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Message લખો..."
            className="flex-1 bg-slate-100/90 border border-slate-200/80 rounded-full px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
          />

          {/* [😊] Emoji Toggle */}
          <button
            type="button"
            data-testid="chat-emoji-btn"
            onClick={() => {
              setEmojiOpen(!emojiOpen);
              setAttachMenuOpen(false);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              emojiOpen
                ? "bg-purple-100 text-purple-900"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95"
            }`}
            title="ઇમોજી (Emoji)"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* [🎤/➤] Send or Voice Note Mic */}
          {text.trim() ? (
            <button
              type="button"
              data-testid="chat-send"
              onClick={() => send()}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-tr from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 text-white shadow-md active:scale-95 transition-all cursor-pointer"
              title="મોકલો (Send)"
            >
              <Send className="w-4 h-4 translate-x-0.5" />
            </button>
          ) : (
            <MediaUploader
              multiple={false}
              kind="chat"
              accept="audio/*"
              onDone={upload}
              label={
                <span
                  data-testid="chat-mic"
                  className="w-10 h-10 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-100/80 flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="વોઇસ મેસેજ (Voice Note)"
                >
                  <Mic className="w-5 h-5" />
                </span>
              }
              className="!p-0 shrink-0"
            />
          )}
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
