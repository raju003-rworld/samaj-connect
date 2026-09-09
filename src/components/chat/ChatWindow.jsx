import React, { useEffect, useRef, useState } from "react";
import { Send, Reply, Trash2, Check, CheckCheck, BellOff, Bell, MoreVertical, FileText, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { listenMessages, listenConversation, listenPresence } from "@/lib/firebase";
import { MediaUploader, isVideoUrl } from "@/components/MediaUploader";

const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const Ticks = ({ m, members }) => {
  const others = members.filter((i) => i !== m.senderId);
  const read = others.length && others.every((i) => (m.readBy || []).includes(i));
  const delivered = others.length && others.every((i) => (m.deliveredTo || []).includes(i) || (m.readBy || []).includes(i));
  if (read) return <CheckCheck className="w-3.5 h-3.5 text-sky-400" data-testid="tick-read" />;
  if (delivered) return <CheckCheck className="w-3.5 h-3.5 text-slate-300" data-testid="tick-delivered" />;
  return <Check className="w-3.5 h-3.5 text-slate-300" data-testid="tick-sent" />;
};

const Bubble = ({ m, mine, members, onReply, onDelete }) => (
  <div className={`flex ${mine ? "justify-end" : "justify-start"} group`} data-testid={`msg-${m.id}`}>
    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-purple-900 text-white rounded-br-md" : "bg-white text-slate-800 rounded-bl-md border border-slate-100"}`}>
      {!mine && <div className="text-[10px] font-semibold text-purple-700 mb-0.5">{m.senderName}</div>}
      {m.replyTo && <div className={`text-[11px] border-l-2 pl-2 mb-1 opacity-80 ${mine ? "border-purple-300" : "border-purple-500"}`}>{m.replyTo.senderName}: {m.replyTo.text || m.replyTo.type}</div>}
      {m.deleted ? <i className="opacity-60 text-xs">🚫 મેસેજ ડિલીટ થયો</i> : (
        <>
          {m.type === "image" && <img src={m.mediaUrl} alt="" className="rounded-xl max-h-64 mb-1" />}
          {m.type === "video" && <video src={m.mediaUrl} controls className="rounded-xl max-h-64 mb-1" />}
          {m.type === "voice" && <audio src={m.mediaUrl} controls className="mb-1 max-w-full" />}
          {m.type === "document" && <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline mb-1"><FileText className="w-4 h-4" /> {m.fileName || "Document"}</a>}
          {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
        </>
      )}
      <div className={`flex items-center gap-1 justify-end mt-0.5 text-[10px] ${mine ? "text-purple-200" : "text-slate-400"}`}>
        {fmtTime(m.createdAt)} {mine && <Ticks m={m} members={members} />}
        <button onClick={() => onReply(m)} className="opacity-0 group-hover:opacity-100 ml-1" data-testid={`msg-reply-${m.id}`}><Reply className="w-3 h-3" /></button>
        <button onClick={() => onDelete(m)} className="opacity-0 group-hover:opacity-100" data-testid={`msg-delete-${m.id}`}><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  </div>
);

export function ChatWindow({ cid, onBack }) {
  const { user, t } = useApp();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [presence, setPresence] = useState(null);
  const [menu, setMenu] = useState(false);
  const bottom = useRef();
  const typingT = useRef();

  useEffect(() => {
    const u1 = listenConversation(cid, setConv);
    const u2 = listenMessages(cid, (m) => setMsgs(m.filter((x) => !(x.deletedFor || []).includes(user.id))));
    api.post(`/conversations/${cid}/delivered`).catch(() => {});
    api.post(`/conversations/${cid}/read`).catch(() => {});
    return () => { u1(); u2(); };
  }, [cid, user.id]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); if (msgs.length) api.post(`/conversations/${cid}/read`).catch(() => {}); }, [msgs.length, cid]);
  const otherId = conv?.type === "direct" ? conv.memberIds.find((i) => i !== user.id) : null;
  useEffect(() => otherId ? listenPresence(otherId, setPresence) : undefined, [otherId]);

  const send = async (extra = {}) => {
    if (!text.trim() && !extra.mediaUrl) return;
    const body = { type: "text", text, replyTo: replyTo?.id || null, ...extra };
    setText(""); setReplyTo(null);
    try { await api.post(`/conversations/${cid}/messages`, body); } catch (e) { toast.error(e?.response?.data?.detail || "મોકલવામાં નિષ્ફળ"); }
  };
  const onType = (v) => {
    setText(v);
    api.post(`/conversations/${cid}/typing`, { typing: true }).catch(() => {});
    clearTimeout(typingT.current);
    typingT.current = setTimeout(() => api.post(`/conversations/${cid}/typing`, { typing: false }).catch(() => {}), 2000);
  };
  const upload = (urls, files) => {
    const f = files[0];
    const type = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "voice" : "document";
    send({ type, mediaUrl: urls[0], fileName: f.name });
  };
  const del = async (m) => {
    const everyone = m.senderId === user.id && window.confirm("બધા માટે ડિલીટ કરવું? (Cancel = ફક્ત મારા માટે)");
    await api.delete(`/conversations/${cid}/messages/${m.id}`, { params: { forEveryone: everyone } });
  };
  const mute = async () => { await api.post(`/conversations/${cid}/mute`); setMenu(false); };
  const addMember = async () => {
    const q = window.prompt("સભ્યનું નામ / મોબાઇલ:"); if (!q) return;
    const { data } = await api.get("/users/search", { params: { q } });
    if (!data.items.length) return toast.error("યુઝર મળ્યો નહીં");
    await api.post(`/conversations/${cid}/members`, { memberIds: [data.items[0].id] }); toast.success(`${data.items[0].name} ઉમેરાયા`); setMenu(false);
  };

  if (!conv) return <div className="skeleton h-64" />;
  const title = conv.type === "group" ? conv.name : conv.members?.[otherId]?.name;
  const typingNames = Object.entries(conv.typing || {}).filter(([k, v]) => v && k !== user.id).map(([k]) => conv.members?.[k]?.name).filter(Boolean);
  const muted = (conv.muted || []).includes(user.id);
  const sub = typingNames.length ? `${typingNames.join(", ")} ${t("typing")}` : conv.type === "group" ? `${conv.memberIds.length} ${t("members_count")}` : presence?.online ? t("online") : presence?.lastSeen ? `${t("last_seen")} ${fmtTime(presence.lastSeen)}` : "";

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-8rem)] bg-[#efe7f7] rounded-3xl overflow-hidden border border-slate-100" data-testid="chat-window">
      <div className="bg-white px-3 py-2.5 flex items-center gap-3 border-b border-slate-100">
        <button onClick={onBack} className="md:hidden p-1" data-testid="chat-back"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">{(conv.type === "group" ? conv.photo : conv.members?.[otherId]?.photo) ? <img src={conv.type === "group" ? conv.photo : conv.members?.[otherId]?.photo} alt="" className="w-full h-full object-cover" /> : (title?.[0] || "?").toUpperCase()}</div>
        <div className="flex-1 min-w-0"><div className="font-semibold text-sm text-slate-900 truncate" data-testid="chat-title">{title}</div><div className="text-[11px] text-slate-500 truncate" data-testid="chat-subtitle">{sub}</div></div>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="p-1.5 rounded-full hover:bg-slate-100" data-testid="chat-menu"><MoreVertical className="w-5 h-5 text-slate-600" /></button>
          {menu && <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 w-44 z-10 text-sm">
            <button data-testid="chat-mute" onClick={mute} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">{muted ? <><Bell className="w-4 h-4" /> {t("unmute")}</> : <><BellOff className="w-4 h-4" /> {t("mute")}</>}</button>
            {conv.type === "group" && (conv.admins || []).includes(user.id) && <button data-testid="chat-add-member" onClick={addMember} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><UserPlus className="w-4 h-4" /> સભ્ય ઉમેરો</button>}
          </div>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.map((m) => <Bubble key={m.id} m={m} mine={m.senderId === user.id} members={conv.memberIds} onReply={setReplyTo} onDelete={del} />)}
        <div ref={bottom} />
      </div>
      {replyTo && <div className="bg-white/80 px-3 py-1.5 text-xs text-slate-700 flex items-center gap-2 border-t border-slate-100">↩ {replyTo.senderName}: <span className="truncate flex-1">{replyTo.text || replyTo.type}</span><button onClick={() => setReplyTo(null)}>×</button></div>}
      <div className="bg-white p-2 flex items-center gap-2 border-t border-slate-100">
        <MediaUploader multiple={false} kind="chat" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onDone={upload} testId="chat-attach" label="📎" className="!px-2.5" />
        <input data-testid="chat-input" value={text} onChange={(e) => onType(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder={t("type_message")} className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
        <button data-testid="chat-send" onClick={() => send()} className="p-2.5 rounded-full bg-purple-900 text-white"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
