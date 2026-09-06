import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Share2, Trash2, Pencil, X, ChevronLeft, ChevronRight, Flag, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilityBadge } from "@/components/Visibility";
import { MediaUploader } from "@/components/MediaUploader";
import { AlbumDialog } from "@/pages/Photos";

export default function Album() {
  const { aid } = useParams();
  const nav = useNavigate();
  const { user, t, isMod } = useApp();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [idx, setIdx] = useState(null);
  const [edit, setEdit] = useState(false);

  const load = () => Promise.all([api.get(`/albums/${aid}`), api.get(`/albums/${aid}/photos`)]).then(([a, p]) => { setAlbum(a.data); setPhotos(p.data.items); }).catch(() => { toast.error("આલ્બમ મળ્યું નહીં"); nav("/photos"); });
  useEffect(() => { load(); }, [aid]);

  const upload = async (urls, files) => {
    const items = urls.map((url, i) => ({ url, type: files[i].type.startsWith("video/") ? "video" : "image" }));
    const { data } = await api.post(`/albums/${aid}/photos`, { items });
    setPhotos((x) => [...data.items, ...x]); toast.success(`${data.items.length} ફોટો ઉમેરાયા`); load();
  };
  const del = async (p) => { if (!window.confirm("ફોટો ડિલીટ કરવો?")) return; await api.delete(`/photos/${p.id}`); setPhotos((x) => x.filter((i) => i.id !== p.id)); setIdx(null); };
  const delAlbum = async () => { if (!window.confirm("આલ્બમ ડિલીટ કરવું?")) return; await api.delete(`/albums/${aid}`); nav("/photos"); };
  const share = async (p) => { try { await navigator.share({ url: p.url }); } catch { await navigator.clipboard?.writeText(p.url); toast.success("લિંક કોપી થઈ"); } };
  const report = async (p) => { const r = window.prompt("રિપોર્ટનું કારણ:"); if (r) { await api.post("/reports", { targetType: "photo", targetId: p.id, reason: r }); toast.success("રિપોર્ટ મોકલાયો"); } };

  if (!album) return <div className="skeleton h-40" />;
  const cur = idx !== null ? photos[idx] : null;
  const canUpload = album.samajId === user?.activeSamajId || album.canEdit;

  return (
    <div className="space-y-4" data-testid="album-page">
      <div className="flex items-start gap-3">
        <button onClick={() => nav("/photos")} className="p-2 rounded-full hover:bg-white"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-extrabold text-slate-900 text-xl truncate" data-testid="album-title-text">{album.title}</h2>
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">{album.authorName} · {album.photoCount || 0} ફોટો <VisibilityBadge value={album.visibility} />{album.event && <Link to={`/events?event=${album.event.id}`} className="flex items-center gap-0.5 text-purple-800 font-semibold"><Calendar className="w-3 h-3" /> {album.event.title}</Link>}</div>
          {album.description && <p className="text-sm text-slate-600 mt-1">{album.description}</p>}
        </div>
        <div className="flex gap-1">
          {canUpload && <MediaUploader kind="albums" onDone={upload} testId="album-upload" label={t("upload")} />}
          {album.canEdit && <button data-testid="album-edit" onClick={() => setEdit(true)} className="p-2 rounded-full bg-white border border-slate-200"><Pencil className="w-4 h-4" /></button>}
          {(album.canEdit || isMod) && <button data-testid="album-delete" onClick={delAlbum} className="p-2 rounded-full bg-rose-50 text-rose-600 border border-rose-100"><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5" data-testid="album-photos">
        {photos.map((p, i) => (
          <button key={p.id} data-testid={`photo-${p.id}`} onClick={() => setIdx(i)} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group">
            {p.type === "video" ? <video src={p.url} className="w-full h-full object-cover" /> : <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
          </button>
        ))}
      </div>
      {!photos.length && <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{canUpload ? "પહેલો ફોટો અપલોડ કરો" : t("no_data")}</div>}

      {cur && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" data-testid="photo-viewer">
          <div className="flex items-center justify-between p-3 text-white text-sm">
            <span>{cur.authorName} · {idx + 1}/{photos.length}</span>
            <div className="flex gap-1">
              <a href={cur.url} download target="_blank" rel="noreferrer" data-testid="photo-download" className="p-2 rounded-full hover:bg-white/10"><Download className="w-5 h-5" /></a>
              <button data-testid="photo-share" onClick={() => share(cur)} className="p-2 rounded-full hover:bg-white/10"><Share2 className="w-5 h-5" /></button>
              {cur.authorId !== user?.id && <button data-testid="photo-report" onClick={() => report(cur)} className="p-2 rounded-full hover:bg-white/10"><Flag className="w-5 h-5" /></button>}
              {(cur.authorId === user?.id || isMod) && <button data-testid="photo-delete" onClick={() => del(cur)} className="p-2 rounded-full hover:bg-white/10 text-rose-400"><Trash2 className="w-5 h-5" /></button>}
              <button onClick={() => setIdx(null)} className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex-1 grid place-items-center relative">
            {cur.type === "video" ? <video src={cur.url} controls autoPlay className="max-h-[80vh] max-w-[95vw]" /> : <img src={cur.url} alt="" className="max-h-[80vh] max-w-[95vw] object-contain" />}
            <button onClick={() => setIdx((idx - 1 + photos.length) % photos.length)} className="absolute left-3 text-white bg-white/10 rounded-full p-2"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={() => setIdx((idx + 1) % photos.length)} className="absolute right-3 text-white bg-white/10 rounded-full p-2"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      )}
      <AlbumDialog open={edit} onOpenChange={setEdit} album={album} onSaved={() => load()} />
    </div>
  );
}
