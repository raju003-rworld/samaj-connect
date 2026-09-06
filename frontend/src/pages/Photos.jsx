import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Images, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilitySelect, VisibilityBadge } from "@/components/Visibility";
import { MediaUploader } from "@/components/MediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function AlbumDialog({ open, onOpenChange, onSaved, album }) {
  const { t } = useApp();
  const [f, setF] = useState({ title: "", description: "", coverUrl: "", eventId: "", visibility: "samaj" });
  const [events, setEvents] = useState([]);
  useEffect(() => { if (open) { setF(album ? { title: album.title, description: album.description || "", coverUrl: album.coverUrl || "", eventId: album.eventId || "", visibility: album.visibility } : { title: "", description: "", coverUrl: "", eventId: "", visibility: "samaj" }); api.get("/events", { params: { filter: "upcoming" } }).then(({ data }) => setEvents(data.items)).catch(() => {}); } }, [open, album]);
  const save = async () => {
    if (!f.title.trim()) return toast.error("આલ્બમ નામ જરૂરી છે");
    try {
      const body = { ...f, eventId: f.eventId || null };
      const { data } = album ? await api.patch(`/albums/${album.id}`, body) : await api.post("/albums", body);
      toast.success(t("saved_ok")); onSaved(data); onOpenChange(false);
    } catch (e) { toast.error(e?.response?.data?.detail || t("saved_fail")); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="album-dialog">
        <DialogHeader><DialogTitle>{album ? "આલ્બમ સંપાદિત કરો" : t("new_album")}</DialogTitle><DialogDescription className="sr-only">Album form</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <input data-testid="album-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="આલ્બમ નામ" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
          <textarea data-testid="album-description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="વર્ણન" rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
          <select data-testid="album-event" value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })} className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <option value="">ઈવેન્ટ વગર (સમાજ આલ્બમ)</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.date}</option>)}
          </select>
          <div className="flex items-center gap-2 flex-wrap">
            <MediaUploader multiple={false} accept="image/*" kind="albums" onDone={(u) => setF({ ...f, coverUrl: u[0] })} label="કવર ફોટો" testId="album-cover-upload" />
            {f.coverUrl && <img src={f.coverUrl} alt="" className="w-14 h-10 rounded-lg object-cover" />}
            <VisibilitySelect testId="album-visibility" value={f.visibility} onChange={(v) => setF({ ...f, visibility: v })} />
          </div>
          <button data-testid="album-save" onClick={save} className="w-full py-2.5 rounded-2xl bg-purple-900 text-white text-sm font-semibold">{t("save")}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Photos() {
  const { t } = useApp();
  const nav = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [recent, setRecent] = useState([]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const load = () => Promise.all([api.get("/albums"), api.get("/photos/recent")]).then(([a, r]) => { setAlbums(a.data.items); setRecent(r.data.items); });
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("cloud_photos")}</h2>
        <button data-testid="new-album-btn" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 bg-purple-900 text-white text-sm font-semibold px-3.5 py-2 rounded-full"><Plus className="w-4 h-4" /> {t("new_album")}</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="albums-grid">
        {albums.map((a) => (
          <button key={a.id} data-testid={`album-card-${a.id}`} onClick={() => nav(`/photos/${a.id}`)} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left hover:shadow-md transition">
            <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-indigo-100 grid place-items-center">
              {a.coverUrl ? <img src={a.coverUrl} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Images className="w-8 h-8 text-purple-400" />}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-slate-900 truncate">{a.title}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">{a.photoCount || 0} ફોટો <VisibilityBadge value={a.visibility} />{a.event && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {a.event.title}</span>}{!a.approved && <span className="text-amber-600 font-semibold">મંજૂરી બાકી</span>}</div>
            </div>
          </button>
        ))}
      </div>
      {!albums.length && <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}

      {recent.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-slate-900 text-base mb-2">{t("recent_photos")}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1.5" data-testid="recent-photos">
            {recent.map((p) => <button key={p.id} onClick={() => setView(p)} className="aspect-square rounded-xl overflow-hidden bg-slate-100">{p.type === "video" ? <video src={p.url} className="w-full h-full object-cover" /> : <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />}</button>)}
          </div>
        </div>
      )}
      <AlbumDialog open={open} onOpenChange={setOpen} onSaved={(a) => nav(`/photos/${a.id}`)} />
      {view && (
        <div className="fixed inset-0 z-50 bg-black/95 grid place-items-center" onClick={() => setView(null)} data-testid="photo-lightbox">
          <button className="absolute top-4 right-4 text-white"><X className="w-6 h-6" /></button>
          {view.type === "video" ? <video src={view.url} controls autoPlay className="max-h-[90vh] max-w-[95vw]" /> : <img src={view.url} alt="" className="max-h-[90vh] max-w-[95vw] object-contain" />}
        </div>
      )}
    </div>
  );
}
