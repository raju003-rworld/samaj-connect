import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, Send, Share2, Flag, UserPlus, UserCheck, Square, MessageSquareOff, Radio } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { listenLive, listenLiveChat } from "@/lib/firebase";
import { VisibilityBadge } from "@/components/Visibility";

const ytId = (u) => (u.match(/(?:youtu\.be\/|v=|\/live\/|embed\/)([\w-]{11})/) || [])[1];

// Real playback only: YouTube/Facebook iframe, HLS via <video> (Safari native / hls.js if present), WebRTC via provider SDK.
function Player({ live }) {
  const pb = live.playback;
  const videoRef = useRef();
  useEffect(() => {
    if (pb?.playbackType !== "hls" || !videoRef.current) return;
    const v = videoRef.current;
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = pb.playbackUrl; return; }
    import("hls.js").then(({ default: Hls }) => { if (Hls.isSupported()) { const h = new Hls(); h.loadSource(pb.playbackUrl); h.attachMedia(v); } }).catch(() => {});
  }, [pb?.playbackUrl, pb?.playbackType]);

  if (live.status === "ended") {
    const url = live.replayUrl || pb?.playbackUrl;
    if (!url) return <div className="aspect-video grid place-items-center text-white/70 text-sm">રિપ્લે ઉપલબ્ધ નથી</div>;
    const id = ytId(url);
    return id ? <iframe title="replay" className="w-full aspect-video" src={`https://www.youtube.com/embed/${id}`} allowFullScreen allow="autoplay; encrypted-media" /> : <video src={url} controls className="w-full aspect-video" />;
  }
  if (live.status !== "live" || !pb) return (
    <div className="aspect-video grid place-items-center text-white text-center p-6">
      <div><Radio className="w-10 h-10 mx-auto mb-2 opacity-70" /><div className="font-semibold">{live.status === "scheduled" ? `શેડ્યૂલ: ${new Date(live.scheduledAt).toLocaleString("en-IN")}` : "લાઈવ હજી શરૂ થયું નથી"}</div></div>
    </div>
  );
  if (pb.playbackType === "youtube") return <iframe title="live" className="w-full aspect-video" src={`https://www.youtube.com/embed/${ytId(pb.playbackUrl)}?autoplay=1`} allowFullScreen allow="autoplay; encrypted-media" />;
  if (pb.playbackType === "facebook") return <iframe title="live" className="w-full aspect-video" src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(pb.playbackUrl)}&autoplay=1`} allowFullScreen allow="autoplay; encrypted-media" />;
  if (pb.playbackType === "hls") return <video ref={videoRef} controls autoPlay playsInline className="w-full aspect-video" />;
  if (pb.playbackType === "webrtc") return <div className="aspect-video grid place-items-center text-white text-sm p-6 text-center">WebRTC room: {pb.room}<br /><span className="text-xs opacity-70">Provider SDK player configured via LIVE_PROVIDER</span></div>;
  return <iframe title="live" className="w-full aspect-video" src={pb.playbackUrl} allowFullScreen allow="autoplay; encrypted-media" />;
}

export default function LiveRoom() {
  const { lid } = useParams();
  const nav = useNavigate();
  const { user, t, isMod } = useApp();
  const [live, setLive] = useState(null);
  const [chat, setChat] = useState([]);
  const [text, setText] = useState("");
  const [floating, setFloating] = useState([]);
  const bottom = useRef();

  useEffect(() => {
    api.get(`/live/${lid}`).then(({ data }) => setLive(data)).catch(() => { toast.error("Live મળ્યું નહીં"); nav("/live"); });
    api.post(`/live/${lid}/join`).catch(() => {});
    const u1 = listenLive(lid, (d) => setLive((p) => ({ ...p, ...d })));
    const u2 = listenLiveChat(lid, setChat);
    return () => { u1(); u2(); api.post(`/live/${lid}/leave`).catch(() => {}); };
  }, [lid]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.length]);

  const send = async () => { if (!text.trim()) return; const tx = text; setText(""); try { await api.post(`/live/${lid}/chat`, { text: tx }); } catch (e) { toast.error(e?.response?.data?.detail || "Error"); } };
  const react = (emoji) => {
    api.post(`/live/${lid}/react`, { emoji }).catch(() => {});
    const id = Date.now() + Math.random(); setFloating((f) => [...f, { id, emoji }]); setTimeout(() => setFloating((f) => f.filter((x) => x.id !== id)), 1800);
  };
  const share = async () => { const url = window.location.href; try { await navigator.share({ title: live.title, url }); } catch { await navigator.clipboard?.writeText(url); toast.success("લિંક કોપી થઈ"); } };
  const follow = async () => { const { data } = await api.post(`/users/${live.hostId}/follow`); setLive({ ...live, hostFollowedByMe: data.following }); };
  const report = async () => { const r = window.prompt("રિપોર્ટનું કારણ:"); if (r) { await api.post("/reports", { targetType: "live", targetId: lid, reason: r }); toast.success("રિપોર્ટ મોકલાયો"); } };
  const end = async () => { if (window.confirm("લાઈવ બંધ કરવું?")) { await api.post(`/live/${lid}/end`, {}); toast.success("લાઈવ પૂર્ણ"); } };
  const start = async () => { try { await api.post(`/live/${lid}/start`, {}); } catch (e) { toast.error(e?.response?.data?.detail || "Error"); } };
  const mod = (action, extra = {}) => api.post(`/live/${lid}/moderate`, { action, ...extra }).catch((e) => toast.error(e?.response?.data?.detail || "Error"));

  if (!live) return <div className="skeleton h-64" />;
  const isHost = live.hostId === user?.id;
  const total = Object.values(live.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4" data-testid="live-room">
      <div className="space-y-3">
        <div className="relative bg-black rounded-3xl overflow-hidden">
          <Player live={live} />
          {live.status === "live" && <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE</span>}
          <span data-testid="live-viewer-count" className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {live.viewerCount || 0}</span>
          <div className="absolute bottom-3 right-3 pointer-events-none">{floating.map((f) => <span key={f.id} className="absolute bottom-0 right-0 text-2xl animate-[float_1.8s_ease-out_forwards]">{f.emoji}</span>)}</div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-start gap-3">
            <Link to={`/users/${live.hostId}`} className="w-11 h-11 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden shrink-0">{live.hostPhoto ? <img src={live.hostPhoto} alt="" className="w-full h-full object-cover" /> : (live.hostName?.[0] || "?").toUpperCase()}</Link>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-bold text-lg text-slate-900 leading-tight" data-testid="live-title">{live.title}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap"><Link to={`/users/${live.hostId}`} className="font-semibold text-slate-700">{live.hostName}</Link> <VisibilityBadge value={live.visibility} /> {total > 0 && <span>❤️ {total}</span>}</div>
              {live.description && <p className="text-sm text-slate-600 mt-2">{live.description}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap text-xs font-semibold">
            {["❤️", "👏", "🙏", "🔥"].map((e) => <button key={e} data-testid={`live-react-${e}`} onClick={() => react(e)} className="px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-purple-50 text-base">{e}</button>)}
            <button data-testid="live-share" onClick={share} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {t("share")}</button>
            {!isHost && <button data-testid="live-follow" onClick={follow} className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${live.hostFollowedByMe ? "bg-slate-100 text-slate-700" : "bg-purple-900 text-white"}`}>{live.hostFollowedByMe ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />} {live.hostFollowedByMe ? t("following") : t("follow")}</button>}
            {!isHost && <button data-testid="live-report" onClick={report} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> {t("report")}</button>}
            {isHost && live.status !== "live" && live.status !== "ended" && <button data-testid="live-host-start" onClick={start} className="px-3 py-1.5 rounded-full bg-rose-600 text-white flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> {t("go_live")}</button>}
            {(isHost || isMod) && live.status === "live" && <button data-testid="live-end" onClick={end} className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"><Square className="w-3.5 h-3.5" /> {t("end_live")}</button>}
            {(isHost || isMod) && <button data-testid="live-toggle-chat" onClick={() => mod("toggle_chat")} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-1"><MessageSquareOff className="w-3.5 h-3.5" /> Chat {live.chatEnabled === false ? "ON" : "OFF"}</button>}
            {isMod && !isHost && <button data-testid="live-remove" onClick={() => mod("remove").then(() => nav("/live"))} className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Remove</button>}
          </div>
        </div>
      </div>
      <aside className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[70vh] lg:h-auto" data-testid="live-chat">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-800">Live Chat</div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chat.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm group" data-testid={`live-chat-msg-${m.id}`}>
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 grid place-items-center text-xs font-bold shrink-0 overflow-hidden">{m.userPhoto ? <img src={m.userPhoto} alt="" className="w-full h-full object-cover" /> : (m.userName?.[0] || "?").toUpperCase()}</div>
              <div className="flex-1 min-w-0"><span className="font-semibold text-slate-800 text-xs">{m.userName}</span> <span className="text-slate-700 break-words">{m.text}</span></div>
              {(isHost || isMod) && <div className="opacity-0 group-hover:opacity-100 flex gap-1 text-[10px]"><button onClick={() => mod("hide_message", { messageId: m.id })} className="text-slate-500">hide</button><button onClick={() => mod("ban_user", { userId: m.userId })} className="text-rose-600">ban</button></div>}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <div className="p-2 border-t border-slate-100 flex gap-2">
          <input data-testid="live-chat-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={live.chatEnabled === false} placeholder={live.chatEnabled === false ? "Chat disabled" : t("write_comment")} className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
          <button data-testid="live-chat-send" onClick={send} className="p-2.5 rounded-full bg-purple-900 text-white"><Send className="w-4 h-4" /></button>
        </div>
      </aside>
      <style>{`@keyframes float{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-120px) scale(1.4);opacity:0}}`}</style>
    </div>
  );
}
