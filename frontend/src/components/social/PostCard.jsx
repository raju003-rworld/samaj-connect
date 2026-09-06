import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Flag, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilityBadge } from "@/components/Visibility";
import { isVideoUrl } from "@/components/MediaUploader";
import { Comments } from "@/components/social/Comments";

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const Media = ({ urls }) => {
  const [i, setI] = useState(0);
  if (!urls?.length) return null;
  const u = urls[i];
  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-100 bg-black">
      {isVideoUrl(u) ? <video src={u} controls playsInline className="w-full max-h-[70vh] object-contain" data-testid="post-video" />
        : <img src={u} alt="" className="w-full max-h-[70vh] object-contain" />}
      {urls.length > 1 && (
        <>
          <button onClick={() => setI((i - 1 + urls.length) % urls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setI((i + 1) % urls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1"><ChevronRight className="w-4 h-4" /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">{urls.map((_, k) => <span key={k} className={`w-1.5 h-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/40"}`} />)}</div>
        </>
      )}
    </div>
  );
};

const Caption = ({ text }) => (
  <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">
    {text.split(/(#[\w\u0A80-\u0AFF]+)/g).map((part, k) => part.startsWith("#")
      ? <Link key={k} to={`/search?q=${encodeURIComponent(part)}`} className="text-purple-800 font-semibold">{part}</Link> : part)}
  </p>
);

export function PostCard({ p, onChange, onRemove }) {
  const { user, t, isMod } = useApp();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const like = async () => { const { data } = await api.post(`/posts/${p.id}/like`); onChange(data); };
  const save = async () => { const { data } = await api.post(`/posts/${p.id}/save`); onChange({ ...p, savedByMe: data.saved }); toast.success(data.saved ? "સેવ થયું" : "અનસેવ"); };
  const share = async () => {
    const url = `${window.location.origin}/social?post=${p.id}`;
    try { await navigator.share({ text: p.caption, url }); } catch { await navigator.clipboard?.writeText(url); toast.success("લિંક કોપી થઈ"); }
    api.post(`/posts/${p.id}/share`).then(({ data }) => data && onChange({ ...p, sharesCount: (p.sharesCount || 0) + 1 }));
  };
  const del = async () => { if (!window.confirm("Delete post?")) return; await api.delete(`/posts/${p.id}`); onRemove(p.id); };
  const report = async () => {
    const reason = window.prompt("રિપોર્ટનું કારણ:"); if (!reason) return;
    await api.post("/reports", { targetType: "post", targetId: p.id, reason }); toast.success("રિપોર્ટ મોકલાયો"); setMenu(false);
  };
  const block = async () => { await api.post(`/users/${p.authorId}/block`); toast.success("બ્લોક થયું"); onRemove(p.id); };
  const mine = p.authorId === user?.id;

  return (
    <article data-testid={`post-card-${p.id}`} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <header className="flex items-center gap-3">
        <Link to={`/users/${p.authorId}`} className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">
          {p.authorPhoto ? <img src={p.authorPhoto} alt="" className="w-full h-full object-cover" /> : (p.authorName?.[0] || "?").toUpperCase()}
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/users/${p.authorId}`} className="text-sm font-semibold text-slate-900 hover:text-purple-800">{p.authorName}</Link>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">{timeAgo(p.createdAt)} <VisibilityBadge value={p.visibility} />{!p.approved && <span className="text-amber-600 font-semibold">મંજૂરી બાકી</span>}</div>
        </div>
        <div className="relative">
          <button data-testid={`post-menu-${p.id}`} onClick={() => setMenu(!menu)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-50"><MoreHorizontal className="w-4 h-4" /></button>
          {menu && (
            <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 w-40 z-10 text-sm">
              {(mine || isMod) && <button data-testid={`post-delete-${p.id}`} onClick={del} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-rose-600 flex items-center gap-2"><Trash2 className="w-4 h-4" /> {t("delete")}</button>}
              {!mine && <button data-testid={`post-report-${p.id}`} onClick={report} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Flag className="w-4 h-4" /> {t("report")}</button>}
              {!mine && <button data-testid={`post-block-${p.id}`} onClick={block} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">🚫 {t("block")}</button>}
            </div>
          )}
        </div>
      </header>
      {p.caption && <Caption text={p.caption} />}
      <Media urls={p.mediaUrls} />
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs">
        <button data-testid={`post-like-${p.id}`} onClick={like} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${p.likedByMe ? "bg-rose-50 text-rose-600" : "text-slate-600 hover:bg-slate-50"}`}>
          <Heart className={`w-4 h-4 ${p.likedByMe ? "fill-current" : ""}`} /> {p.likesCount || 0}
        </button>
        <button data-testid={`post-comments-${p.id}`} onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50">
          <MessageCircle className="w-4 h-4" /> {p.commentsCount || 0}
        </button>
        <button data-testid={`post-share-${p.id}`} onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50">
          <Share2 className="w-4 h-4" /> {p.sharesCount || 0}
        </button>
        <button data-testid={`post-save-${p.id}`} onClick={save} className={`ml-auto p-2 rounded-full ${p.savedByMe ? "text-purple-800 bg-purple-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <Bookmark className={`w-4 h-4 ${p.savedByMe ? "fill-current" : ""}`} />
        </button>
      </div>
      {open && <Comments postId={p.id} onCount={(d) => onChange({ ...p, commentsCount: (p.commentsCount || 0) + d })} />}
    </article>
  );
}
