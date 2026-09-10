import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Images,
  Calendar,
  X,
  Download,
  Share2,
  FolderPlus,
  User,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilitySelect, VisibilityBadge } from "@/components/Visibility";
import { MediaUploader, isVideoUrl } from "@/components/MediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function AlbumDialog({ open, onOpenChange, onSaved, album }) {
  const { t } = useApp();
  const [f, setF] = useState({
    title: "",
    description: "",
    coverUrl: "",
    eventId: "",
    visibility: "samaj",
  });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (open) {
      setF(
        album
          ? {
              title: album.title,
              description: album.description || "",
              coverUrl: album.coverUrl || "",
              eventId: album.eventId || "",
              visibility: album.visibility || "samaj",
            }
          : { title: "", description: "", coverUrl: "", eventId: "", visibility: "samaj" }
      );
      api
        .get("/events", { params: { filter: "upcoming" } })
        .then(({ data }) => setEvents(data.items || []))
        .catch(() => {});
    }
  }, [open, album]);

  const save = async () => {
    if (!f.title.trim()) return toast.error("આલ્બમ નામ જરૂરી છે");
    try {
      const body = { ...f, eventId: f.eventId || null };
      const { data } = album
        ? await api.patch(`/albums/${album.id}`, body)
        : await api.post("/albums", body);
      toast.success(t("saved_ok"));
      onSaved(data);
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("saved_fail"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="album-dialog">
        <DialogHeader>
          <DialogTitle className="text-purple-950 font-heading">
            {album ? "આલ્બમ સંપાદિત કરો" : t("new_album")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            સમાજ અથવા ઈવેન્ટના ફોટા સંગ્રહવા માટે આલ્બમ બનાવો
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <input
            data-testid="album-title"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="આલ્બમનું શીર્ષક (Title)"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-400"
          />
          <textarea
            data-testid="album-description"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder="આલ્બમ વર્ણન (વૈકલ્પિક)"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-400"
          />
          <select
            data-testid="album-event"
            value={f.eventId}
            onChange={(e) => setF({ ...f, eventId: e.target.value })}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 outline-none"
          >
            <option value="">સામાન્ય સમાજ આલ્બમ (કોઈ ઈવેન્ટ વગર)</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                📅 {e.title} · {e.date}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 flex-wrap">
            <MediaUploader
              multiple={false}
              accept="image/*"
              kind="albums"
              onDone={(u) => setF({ ...f, coverUrl: u[0] })}
              label="કવર ફોટો પસંદ કરો"
              testId="album-cover-upload"
            />
            {f.coverUrl && <img src={f.coverUrl} alt="" className="w-16 h-12 rounded-xl object-cover border" />}
            <VisibilitySelect testId="album-visibility" value={f.visibility} onChange={(v) => setF({ ...f, visibility: v })} />
          </div>
          <button
            data-testid="album-save"
            onClick={save}
            className="w-full py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold shadow transition"
          >
            {t("save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Photos() {
  const { user, t, activeSamaj } = useApp();
  const nav = useNavigate();

  // Active view tab: "all" | "my" | "albums"
  const [tab, setTab] = useState("all");
  const [albums, setAlbums] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [albumRes, recentRes, postsRes, myPostsRes] = await Promise.all([
        api.get("/albums").catch(() => ({ data: { items: [] } })),
        api.get("/photos/recent").catch(() => ({ data: { items: [] } })),
        api.get("/posts", { params: { mediaType: "image", limit: 30 } }).catch(() => ({ data: { items: [] } })),
        api.get("/posts", { params: { authorId: user?.id, limit: 30 } }).catch(() => ({ data: { items: [] } })),
      ]);

      setAlbums(albumRes.data.items || []);

      // Aggregate all photos from albums and posts
      const recentList = recentRes.data.items || [];
      const postPhotos = (postsRes.data.items || []).flatMap((p) =>
        (p.mediaUrls || []).map((url) => ({
          id: p.id + url,
          url,
          type: isVideoUrl(url) ? "video" : "image",
          title: p.caption,
          authorName: p.authorName,
          authorId: p.authorId,
          postId: p.id,
        }))
      );

      // Unique combined photos
      const combinedAll = [...recentList];
      postPhotos.forEach((item) => {
        if (!combinedAll.some((x) => x.url === item.url)) {
          combinedAll.push(item);
        }
      });
      setAllPhotos(combinedAll);

      // Extract current user's photos
      const userPhotoItems = (myPostsRes.data.items || []).flatMap((p) =>
        (p.mediaUrls || []).map((url) => ({
          id: p.id + url,
          url,
          type: isVideoUrl(url) ? "video" : "image",
          title: p.caption,
          authorName: user?.name,
          authorId: user?.id,
          postId: p.id,
        }))
      );
      setMyPhotos(userPhotoItems);
    } catch {
      toast.error("ફોટો લોડ કરવામાં ક્ષતિ આવી");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSamaj?.id, user?.id]);

  // Handle direct photo upload
  const handleDirectUpload = async (urls) => {
    if (!urls.length) return;
    try {
      // Create a quick post with uploaded photos so it persists across sessions
      await api.post("/posts", {
        caption: "ક્લાઉડ ફોટો ગેલેરી અપડેટ",
        mediaUrls: urls,
        mediaType: isVideoUrl(urls[0]) ? "video" : "image",
        visibility: "samaj",
      });
      toast.success(`${urls.length} ફોટો ગેલેરીમાં ઉમેરાયા!`);
      loadData();
    } catch {
      toast.error("ફોટો અપલોડ કરવામાં ક્ષતિ આવી");
    }
  };

  const displayedPhotos = tab === "my" ? myPhotos : allPhotos;

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight flex items-center gap-2">
            <Images className="w-6 h-6 text-purple-700" />
            {t("cloud_photos")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            તમારા સમાજની સુંદર પળો, સ્મૃતિઓ અને આલ્બમ્સ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Upload Photos Button */}
          <MediaUploader
            multiple={true}
            accept="image/*,video/*"
            kind="gallery"
            onDone={handleDirectUpload}
            label={
              <span className="inline-flex items-center gap-1.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-xs transition">
                <Plus className="w-4 h-4" /> ફોટો ઉમેરો
              </span>
            }
            testId="quick-upload-photo"
          />

          {/* Create New Album Button */}
          <button
            data-testid="new-album-btn"
            onClick={() => setAlbumOpen(true)}
            className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold px-3.5 py-2 rounded-full transition"
          >
            <FolderPlus className="w-4 h-4" /> {t("new_album")}
          </button>
        </div>
      </div>

      {/* Modern Filter Tabs: All Photos | My Photos | Albums */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            tab === "all"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>તમામ ફોટા ({allPhotos.length})</span>
        </button>

        <button
          onClick={() => setTab("my")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            tab === "my"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>મારા ફોટા ({myPhotos.length})</span>
        </button>

        <button
          onClick={() => setTab("albums")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            tab === "albums"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Images className="w-3.5 h-3.5" />
          <span>આલ્બમ્સ ({albums.length})</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div key={k} className="aspect-square rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : tab === "albums" ? (
        /* Albums Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5" data-testid="albums-grid">
          {albums.map((a) => (
            <button
              key={a.id}
              data-testid={`album-card-${a.id}`}
              onClick={() => nav(`/photos/${a.id}`)}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden text-left hover:shadow-md transition group"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-indigo-100 relative overflow-hidden flex items-center justify-center">
                {a.coverUrl ? (
                  <img
                    src={a.coverUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <Images className="w-10 h-10 text-purple-400" />
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {a.photoCount || 0} ફોટો
                </div>
              </div>
              <div className="p-3.5">
                <div className="text-sm font-bold text-slate-900 truncate group-hover:text-purple-900">
                  {a.title}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 flex-wrap">
                  <VisibilityBadge value={a.visibility} />
                  {a.event && (
                    <span className="flex items-center gap-0.5 text-purple-800">
                      <Calendar className="w-3 h-3" /> {a.event.title}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {!albums.length && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-500">
              <FolderPlus className="w-12 h-12 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-700">હજી કોઈ આલ્બમ નથી</p>
              <p className="text-xs text-slate-400 mt-1">
                સમાજના કાર્યક્રમ અથવા સભા માટે નવું આલ્બમ બનાવો
              </p>
              <button
                onClick={() => setAlbumOpen(true)}
                className="mt-3 px-4 py-2 rounded-full bg-purple-900 text-white text-xs font-semibold"
              >
                + નવું આલ્બમ બનાવો
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Photos Grid / Masonry View */
        <div>
          {displayedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5" data-testid="photos-grid">
              {displayedPhotos.map((p, idx) => (
                <div
                  key={p.id || p.url + idx}
                  onClick={() => setViewPhoto(p)}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative group cursor-pointer shadow-2xs hover:shadow-md transition"
                >
                  {p.type === "video" || isVideoUrl(p.url) ? (
                    <video src={p.url} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={p.url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}

                  {/* Hover info overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                    {p.title && <div className="text-xs font-medium truncate">{p.title}</div>}
                    {p.authorName && (
                      <div className="text-[10px] text-white/80">👤 {p.authorName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-700">કોઈ ફોટા મળ્યા નહીં</p>
              <p className="text-xs text-slate-400 mt-1">ગેલેરીમાં પ્રથમ ફોટો અપલોડ કરો!</p>
            </div>
          )}
        </div>
      )}

      {/* Album Creation Dialog */}
      <AlbumDialog
        open={albumOpen}
        onOpenChange={setAlbumOpen}
        onSaved={(a) => nav(`/photos/${a.id}`)}
      />

      {/* Full-Screen Photo Lightbox Viewer */}
      {viewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          data-testid="photo-lightbox"
          onClick={() => setViewPhoto(null)}
        >
          {/* Top Bar inside Lightbox */}
          <div
            className="w-full max-w-4xl flex items-center justify-between text-white mb-3 px-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold truncate">
              {viewPhoto.title || "સમાજ ફોટો"} {viewPhoto.authorName && `· ${viewPhoto.authorName}`}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ url: viewPhoto.url });
                  } else {
                    navigator.clipboard.writeText(viewPhoto.url);
                    toast.success("લિંક કોપી થઈ");
                  }
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <a
                href={viewPhoto.url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                title="Download / Open"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setViewPhoto(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Content */}
          <div
            className="relative max-h-[82vh] max-w-[92vw] flex items-center justify-center rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {viewPhoto.type === "video" || isVideoUrl(viewPhoto.url) ? (
              <video src={viewPhoto.url} controls autoPlay className="max-h-[82vh] max-w-[92vw] rounded-2xl" />
            ) : (
              <img
                src={viewPhoto.url}
                alt=""
                className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
