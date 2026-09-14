import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Flag, MoreHorizontal, ChevronLeft, ChevronRight, Eye, MapPin, Calendar, Repeat2, ExternalLink, Music, Play, Pause, Send, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilityBadge, VisibilitySelect } from "@/components/Visibility";
import { isVideoUrl } from "@/components/MediaUploader";
import { Comments } from "@/components/social/Comments";
import { EditPostModal } from "@/components/social/EditPostModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getFilterCss } from "@/lib/mediaFilters";
import { playTrackPreview } from "@/lib/audioLibrary";
import { StoryShareDialog } from "@/components/social/StoryShareDialog";

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const PostMusicBanner = ({ music }) => {
  const [playing, setPlaying] = useState(false);
  const stopFnRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stopFnRef.current) {
        stopFnRef.current();
        stopFnRef.current = null;
      }
    };
  }, []);

  if (!music || !music.title) return null;

  const toggle = () => {
    if (playing) {
      if (stopFnRef.current) stopFnRef.current();
      stopFnRef.current = null;
      setPlaying(false);
    } else {
      const stop = playTrackPreview(music.id || music);
      stopFnRef.current = stop;
      setPlaying(true);
    }
  };

  return (
    <div
      data-testid="post-music-banner"
      className="mt-2.5 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200/80 text-xs"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{music.cover || "🎵"}</span>
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
            <span className="truncate">{music.title}</span>
          </div>
          {music.artist && (
            <div className="text-[10px] text-slate-500 truncate">{music.artist}</div>
          )}
        </div>
      </div>
      <button
        type="button"
        data-testid="post-music-play-btn"
        onClick={toggle}
        className="shrink-0 p-1.5 rounded-full bg-purple-900 hover:bg-purple-950 text-white shadow-xs transition"
        title={playing ? "Stop" : "Play"}
      >
        {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>
    </div>
  );
};

export const Media = ({ urls, filter, rotation, textOverlays = [], emojiOverlays = [] }) => {
  const [i, setI] = useState(0);
  if (!urls?.length) return null;
  const u = urls[i];
  const filterCss = getFilterCss(filter);
  const rotStyle = rotation ? { transform: `rotate(${rotation}deg)` } : {};
  const filterStyle = filterCss ? { filter: filterCss } : {};

  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-100 bg-black">
      <div className="relative flex items-center justify-center overflow-hidden">
        {isVideoUrl(u) ? (
          <video
            src={u}
            controls
            playsInline
            preload="metadata"
            style={{ ...rotStyle, ...filterStyle }}
            className="w-full max-h-[70vh] object-contain transition-transform"
            data-testid="post-video"
          />
        ) : (
          <img
            src={u}
            alt=""
            loading="lazy"
            style={{ ...rotStyle, ...filterStyle }}
            className="w-full max-h-[70vh] object-contain transition-transform"
          />
        )}

        {/* Text overlays */}
        {textOverlays?.map((t, idx) => (
          <div
            key={idx}
            style={{
              left: `${t.x || 50}%`,
              top: `${t.y || 50}%`,
              transform: "translate(-50%, -50%)",
              color: t.color || "#ffffff",
              backgroundColor: t.bg || "rgba(0,0,0,0.5)",
              fontSize: `${t.size || 18}px`,
            }}
            className="absolute font-bold px-3 py-1 rounded-xl pointer-events-none drop-shadow-md whitespace-pre-wrap max-w-[85%] text-center"
          >
            {t.text}
          </div>
        ))}

        {/* Emoji overlays */}
        {emojiOverlays?.map((em, idx) => (
          <div
            key={idx}
            style={{
              left: `${em.x || 50}%`,
              top: `${em.y || 50}%`,
              transform: "translate(-50%, -50%)",
              fontSize: `${em.size || 36}px`,
            }}
            className="absolute pointer-events-none select-none drop-shadow-md"
          >
            {em.emoji}
          </div>
        ))}
      </div>

      {urls.length > 1 && (
        <>
          <button onClick={() => setI((i - 1 + urls.length) % urls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setI((i + 1) % urls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1"><ChevronRight className="w-4 h-4" /></button>
          <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{i + 1}/{urls.length}</span>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">{urls.map((_, k) => <span key={k} className={`w-1.5 h-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/40"}`} />)}</div>
        </>
      )}
    </div>
  );
};

export const Caption = ({ text }) => text ? (
  <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">
    {text.split(/(#[\w\u0A80-\u0AFF]+)/g).map((part, k) => part.startsWith("#")
      ? <Link key={k} to={`/search?q=${encodeURIComponent(part)}`} data-testid="hashtag-link" className="text-purple-800 font-semibold">{part}</Link> : part)}
  </p>
) : null;

export const EventCard = ({ event }) => event ? (
  <Link to={`/events?event=${event.id}`} data-testid={`post-event-${event.id}`} className="mt-3 flex items-center gap-3 bg-purple-50/70 border border-purple-100 rounded-2xl p-3 hover:bg-purple-50">
    <div className="w-12 h-12 rounded-xl bg-white border border-purple-100 grid place-items-center text-purple-700 overflow-hidden shrink-0">
      {event.eventImage ? <img src={event.eventImage} alt="" className="w-full h-full object-cover" /> : <Calendar className="w-5 h-5" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-slate-900 truncate">{event.title}</div>
      <div className="text-[11px] text-slate-500">{event.date}{event.location ? ` · ${event.location}` : ""}</div>
    </div>
    <ExternalLink className="w-4 h-4 text-purple-700" />
  </Link>
) : null;

const SharedFrom = ({ s }) => (
  <div className="mt-3 border border-slate-200 rounded-2xl p-3 bg-slate-50/60" data-testid="shared-from">
    <div className="text-xs text-slate-500 flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> <Link to={`/users/${s.authorId}`} className="font-semibold text-slate-700">{s.authorName}</Link> · {timeAgo(s.createdAt)}</div>
    <Caption text={s.caption} />
    <Media urls={s.mediaUrls} />
  </div>
);

function ShareDialog({ p, open, onOpenChange, onDone }) {
  const { user, samajList, isAdmin, t } = useApp();
  const [caption, setCaption] = useState("");
  const [samajId, setSamajId] = useState(user?.activeSamajId);
  const [vis, setVis] = useState("samaj");
  const [chatShareOpen, setChatShareOpen] = useState(false);
  const targets = samajList.filter((s) => user?.samajIds?.includes(s.id) && (isAdmin || s.id === p.samajId || p.visibility !== "samaj"));
  const go = async () => {
    try { const { data } = await api.post(`/posts/${p.id}/repost`, { caption, samajId, visibility: vis }); toast.success("શેર થયું"); onDone(data); onOpenChange(false); }
    catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
  };
  const native = async () => {
    const url = p.visibility === "public" ? `${window.location.origin}/p/${p.id}` : `${window.location.origin}/social?post=${p.id}`;
    try { await navigator.share({ text: p.caption, url }); } catch { await navigator.clipboard?.writeText(url); toast.success("લિંક કોપી થઈ"); }
    api.post(`/posts/${p.id}/share`).catch(() => {});
    onOpenChange(false);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-3xl" data-testid="share-dialog">
          <DialogHeader><DialogTitle>{t("share")}</DialogTitle><DialogDescription className="text-xs">SAMAJ CONNECT માં શેર કરો અથવા લિંક કોપી કરો{p.visibility === "samaj" ? " (ફક્ત સમાજ — લિંક લોગિન માંગશે)" : ""}</DialogDescription></DialogHeader>
          <textarea data-testid="share-caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} placeholder="તમારો સંદેશ (વૈકલ્પિક)" className="w-full text-sm border border-slate-200 rounded-2xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
          <div className="flex gap-2 flex-wrap">
            <select data-testid="share-samaj" value={samajId} onChange={(e) => setSamajId(e.target.value)} className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              {targets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <VisibilitySelect testId="share-visibility" value={vis} onChange={setVis} />
          </div>
          <div className="flex gap-2">
            <button data-testid="share-native" onClick={native} className="flex-1 py-2.5 rounded-2xl border border-purple-300 text-purple-800 text-sm font-semibold">લિંક / શેર</button>
            <button data-testid="share-repost" onClick={go} className="flex-1 py-2.5 rounded-2xl bg-purple-900 text-white text-sm font-semibold"><Repeat2 className="w-4 h-4 inline mr-1" />ફીડમાં શેર</button>
          </div>
          <button
            type="button"
            data-testid="post-share-chat-btn"
            onClick={() => setChatShareOpen(true)}
            className="w-full py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" /> ચેટમાં મોકલો (Send in Chat)
          </button>
        </DialogContent>
      </Dialog>
      {chatShareOpen && (
        <StoryShareDialog
          open={chatShareOpen}
          onOpenChange={setChatShareOpen}
          story={{
            id: p.id,
            caption: p.caption || "સમાજ પોસ્ટ",
            mediaUrl: p.mediaUrls?.[0] || "",
            mediaType: p.mediaType || "image",
          }}
        />
      )}
    </>
  );
}

export function PostCard({ p, onChange, onRemove, onCreated, autoOpenComments = false }) {
  const { user, t, isMod } = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(autoOpenComments);
  const [menu, setMenu] = useState(false);
  const [share, setShare] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const ref = useRef();
  const viewed = useRef(false);

  useEffect(() => {
    if (!ref.current || p.authorId === user?.id) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !viewed.current) { viewed.current = true; api.post(`/posts/${p.id}/view`).catch(() => {}); io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [p.id, p.authorId, user?.id]);

  const like = async () => {
    onChange({ ...p, likedByMe: !p.likedByMe, likesCount: (p.likesCount || 0) + (p.likedByMe ? -1 : 1) });
    try { const { data } = await api.post(`/posts/${p.id}/like`); onChange(data); } catch { onChange(p); }
  };
  const save = async () => { const { data } = await api.post(`/posts/${p.id}/save`); onChange({ ...p, savedByMe: data.saved }); toast.success(data.saved ? "સેવ થયું" : "અનસેવ"); };
  const del = async () => {
    setMenu(false);
    if (!window.confirm("શું તમે આ પોસ્ટ ડિલીટ કરવા માંગો છો? આ ક્રિયા પાછી નહીં ફરે.")) return;
    try {
      await api.delete(`/posts/${p.id}`);
      toast.success("પોસ્ટ સફળતાપૂર્વક ડિલીટ થઈ ગઈ");
      onRemove?.(p.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "ડિલીટ કરવામાં ક્ષતિ આવી");
    }
  };
  const report = async () => {
    const reason = window.prompt("રિપોર્ટનું કારણ:"); if (!reason) return;
    await api.post("/reports", { targetType: "post", targetId: p.id, reason }); toast.success("રિપોર્ટ મોકલાયો"); setMenu(false);
  };
  const block = async () => { await api.post(`/users/${p.authorId}/block`); toast.success("બ્લોક થયું"); onRemove(p.id); };
  const mine = p.authorId === user?.id;

  return (
    <article ref={ref} data-testid={`post-card-${p.id}`} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <header className="flex items-center gap-3">
        <Link to={`/users/${p.authorId}`} className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden shrink-0">
          {p.authorPhoto ? <img src={p.authorPhoto} alt="" className="w-full h-full object-cover" /> : (p.authorName?.[0] || "?").toUpperCase()}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/users/${p.authorId}`} className="text-sm font-semibold text-slate-900 hover:text-purple-800">{p.authorName}</Link>
            {["super_admin", "samaj_admin", "admin"].includes(p.authorRole) && <span className="text-[9px] font-bold bg-purple-900 text-white px-1.5 py-0.5 rounded-full">ADMIN</span>}
            {p.mediaType === "share" && <span className="text-[11px] text-slate-500 flex items-center gap-0.5"><Repeat2 className="w-3 h-3" /> શેર કર્યું</span>}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
            <span title={new Date(p.createdAt).toLocaleString("en-IN")}>{timeAgo(p.createdAt)}</span>
            <VisibilityBadge value={p.visibility} />
            {p.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {p.location}</span>}
            {!p.approved && <span className="text-amber-600 font-semibold">મંજૂરી બાકી</span>}
          </div>
        </div>
        <div className="relative">
          <button data-testid={`post-menu-${p.id}`} onClick={() => setMenu(!menu)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-50"><MoreHorizontal className="w-4 h-4" /></button>
          {menu && (
            <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg py-1.5 w-48 z-10 text-sm">
              {(mine || isMod) && (
                <button
                  type="button"
                  data-testid={`post-edit-${p.id}`}
                  onClick={() => {
                    setMenu(false);
                    setEditOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                >
                  <Edit3 className="w-4 h-4 text-purple-700" />
                  <span>પોસ્ટ સુધારો (Edit)</span>
                </button>
              )}
              {(mine || isMod) && (
                <button
                  type="button"
                  data-testid={`post-delete-${p.id}`}
                  onClick={del}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("delete")}</span>
                </button>
              )}
              {!mine && (
                <button
                  type="button"
                  data-testid={`post-report-${p.id}`}
                  onClick={report}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" /> {t("report")}
                </button>
              )}
              {!mine && (
                <button
                  type="button"
                  data-testid={`post-block-${p.id}`}
                  onClick={block}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                >
                  🚫 {t("block")}
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      <Caption text={p.caption} />
      {p.music && <PostMusicBanner music={p.music} />}
      {p.sharedFrom ? (
        <SharedFrom s={p.sharedFrom} />
      ) : (
        <Media
          urls={p.mediaUrls}
          filter={p.filter}
          rotation={p.rotation}
          textOverlays={p.textOverlays}
          emojiOverlays={p.emojiOverlays}
        />
      )}
      <EventCard event={p.event} />
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs">
        <button data-testid={`post-like-${p.id}`} onClick={like} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-colors ${p.likedByMe ? "bg-rose-50 text-rose-600" : "text-slate-600 hover:bg-slate-50"}`}>
          <Heart className={`w-4 h-4 ${p.likedByMe ? "fill-current" : ""}`} /> {p.likesCount || 0}
        </button>
        <button data-testid={`post-comments-${p.id}`} onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50">
          <MessageCircle className="w-4 h-4" /> {p.commentsCount || 0}
        </button>
        <button data-testid={`post-share-${p.id}`} onClick={() => setShare(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50">
          <Share2 className="w-4 h-4" /> {p.sharesCount || 0}
        </button>
        {p.viewsCount > 0 && <span data-testid={`post-views-${p.id}`} className="flex items-center gap-1 px-2 text-slate-400"><Eye className="w-3.5 h-3.5" /> {p.viewsCount}</span>}
        <button data-testid={`post-save-${p.id}`} onClick={save} className={`ml-auto p-2 rounded-full ${p.savedByMe ? "text-purple-800 bg-purple-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <Bookmark className={`w-4 h-4 ${p.savedByMe ? "fill-current" : ""}`} />
        </button>
      </div>
      {open && <Comments postId={p.id} onCount={(d) => onChange({ ...p, commentsCount: Math.max(0, (p.commentsCount || 0) + d) })} />}
      {share && <ShareDialog p={p} open={share} onOpenChange={setShare} onDone={(np) => { onChange({ ...p, sharesCount: (p.sharesCount || 0) + 1 }); onCreated?.(np); }} />}
      {editOpen && (
        <EditPostModal
          open={editOpen}
          onOpenChange={setEditOpen}
          post={p}
          onSave={(updated) => onChange(updated)}
        />
      )}
    </article>
  );
}
