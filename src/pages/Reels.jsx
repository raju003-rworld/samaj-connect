import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Plus, Play, Pause, ChevronUp, ChevronDown, Music2, UserCheck, UserPlus, Sparkles, X, Edit3, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { MediaUploader, isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect, VisibilityBadge, PrivacySelector } from "@/components/Visibility";
import { Comments } from "@/components/social/Comments";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function CreateReelDialog({ open, onOpenChange, onCreated }) {
  const { user, t } = useApp();
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [vis, setVis] = useState("samaj");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!media.length) return toast.error("કૃપા કરીને એક વિડિયો અપલોડ કરો");
    setBusy(true);
    try {
      const { data } = await api.post("/posts", {
        caption,
        mediaUrls: media,
        mediaType: "reel",
        visibility: vis,
      });
      onCreated(data);
      onOpenChange(false);
      setCaption("");
      setMedia([]);
      toast.success("રીલ સફળતાપૂર્વક અપલોડ થઈ ગઈ!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "રીલ અપલોડ કરવામાં નિષ્ફળતા");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="create-reel-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="w-5 h-5 text-purple-600" />
            નવી રીલ ઉમેરો (Create Reel)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            તમારી સમાજ સાથે સુંદર પળો અને વિડિયો શેર કરો
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <textarea
              data-testid="reel-caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="રીલ વિશે કંઈક લખો... #samaj #reels"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50">
            {media.length > 0 ? (
              <div className="relative w-full max-h-48 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <video src={media[0]} className="max-h-48 w-full object-contain" controls />
                <button
                  type="button"
                  onClick={() => setMedia([])}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <MediaUploader
                  multiple={false}
                  accept="video/*"
                  kind="posts"
                  onDone={(urls) => setMedia(urls)}
                  label="વિડિયો પસંદ કરો (Select Video)"
                  testId="reel-video-upload"
                />
                <p className="text-[11px] text-slate-500 mt-1">MP4, MOV અથવા WebM ફોર્મેટ</p>
              </div>
            )}
          </div>

          {/* Privacy Selector - Point 3 Requirement */}
          <div className="pt-1">
            <PrivacySelector
              value={vis}
              onChange={setVis}
              testIdPrefix="create-reel-privacy"
            />
          </div>

          <button
            data-testid="submit-reel-btn"
            onClick={submit}
            disabled={busy || !media.length}
            className="w-full py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? "અપલોડ થઈ રહ્યું છે..." : "રીલ પોસ્ટ કરો"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditReelDialog({ open, onOpenChange, reel, onSaved }) {
  const { lang } = useApp();
  const [caption, setCaption] = useState(reel?.caption || reel?.content || "");
  const [vis, setVis] = useState(reel?.visibility || "samaj");
  const [location, setLocation] = useState(reel?.location || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (reel) {
      setCaption(reel.caption || reel.content || "");
      setVis(reel.visibility || "samaj");
      setLocation(reel.location || "");
    }
  }, [reel]);

  const submit = async (e) => {
    e?.preventDefault();
    if (busy || !reel?.id) return;
    setBusy(true);
    try {
      const { data } = await api.put(`/posts/${reel.id}`, {
        caption: caption.trim(),
        visibility: vis,
        location: location.trim(),
      });
      toast.success(lang === "en" ? "Reel updated" : "રીલ સુધારી લીધી");
      onSaved(data);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "રીલ સુધારવામાં ક્ષતિ આવી");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="edit-reel-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-900 font-bold">
            <Edit3 className="w-5 h-5 text-purple-700" />
            {lang === "en" ? "Edit Reel" : "રીલ સુધારો"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {lang === "en"
              ? "Update caption, privacy visibility or location"
              : "કેપ્શન, પ્રાઈવસી (કોણ જોઈ શકે) અથવા સ્થળ બદલો"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">કેપ્શન (Caption)</label>
            <textarea
              data-testid="edit-reel-caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50"
              placeholder="રીલ વિશે લખો..."
            />
          </div>

          <PrivacySelector
            value={vis}
            onChange={setVis}
            testIdPrefix="edit-reel-privacy"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">સ્થળ / લોકેશન</label>
            <input
              type="text"
              data-testid="edit-reel-location-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="દા.ત. અમદાવાદ"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              data-testid="edit-reel-cancel-btn"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              data-testid="edit-reel-save-btn"
              disabled={busy}
              className="px-5 py-2 text-xs font-bold bg-purple-900 hover:bg-purple-950 text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {busy ? "સાચવી રહ્યું છે..." : "સાચવો"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Reels() {
  const { user, t, activeSamaj } = useApp();
  const nav = useNavigate();
  const [reels, setReels] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editReelOpen, setEditReelOpen] = useState(false);
  const videoRef = useRef(null);

  const loadReels = async () => {
    setLoading(true);
    try {
      // First try to load reels
      const { data } = await api.get("/posts", { params: { limit: 30 } });
      const items = data.items || [];
      // Prioritize posts that have video or are marked as reel
      const videoItems = items.filter((p) => p.mediaType === "reel" || (p.mediaUrls && p.mediaUrls.some(isVideoUrl)));
      if (videoItems.length > 0) {
        setReels(videoItems);
      } else if (items.length > 0) {
        // Fallback to all posts so screen is never empty
        setReels(items);
      } else {
        setReels([]);
      }
    } catch (e) {
      toast.error("રીલ્સ લોડ કરવામાં ભૂલ આવી");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, [activeSamaj?.id]);

  const activeReel = reels[currentIdx];

  const isAuthorOrAdmin =
    activeReel &&
    (activeReel.authorId === user?.id ||
      activeReel.createdBy === user?.id ||
      ["super_admin", "samaj_admin", "admin"].includes(user?.role));

  const handleDeleteReel = async () => {
    if (!activeReel?.id) return;
    if (!window.confirm("શું તમે આ રીલ ડિલીટ કરવા માંગો છો? આ ક્રિયા પાછી નહીં ફરે.")) return;
    try {
      await api.delete(`/posts/${activeReel.id}`);
      toast.success("રીલ સફળતાપૂર્વક ડિલીટ થઈ ગઈ");
      setReels((prev) => {
        const nextList = prev.filter((r) => r.id !== activeReel.id);
        if (currentIdx >= nextList.length) {
          setCurrentIdx(Math.max(0, nextList.length - 1));
        }
        return nextList;
      });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "રીલ ડિલીટ કરવામાં ક્ષતિ આવી");
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!activeReel) return;
    try {
      const { data } = await api.post(`/posts/${activeReel.id}/like`);
      setReels((prev) =>
        prev.map((r, idx) => (idx === currentIdx ? { ...r, likedByMe: data.liked, likesCount: data.likesCount } : r))
      );
    } catch (err) {
      toast.error("લાઇક કરવામાં ક્ષતિ આવી");
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!activeReel) return;
    try {
      const { data } = await api.post(`/posts/${activeReel.id}/save`);
      setReels((prev) =>
        prev.map((r, idx) => (idx === currentIdx ? { ...r, savedByMe: data.saved } : r))
      );
      toast.success(data.saved ? "રીલ સેવ થઈ" : "રીલ અનસેવ થઈ");
    } catch (err) {
      toast.error("સેવ કરવામાં ક્ષતિ આવી");
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (!activeReel) return;
    const url = `${window.location.origin}/social?post=${activeReel.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SAMAJ CONNECT Reel",
          text: activeReel.caption || "Check out this reel on SAMAJ CONNECT!",
          url,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("લિંક કોપી થઈ ગઈ!");
    }
    api.post(`/posts/${activeReel.id}/share`).catch(() => {});
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!activeReel?.authorId) return;
    try {
      const { data } = await api.post(`/users/${activeReel.authorId}/follow`);
      setReels((prev) =>
        prev.map((r) =>
          r.authorId === activeReel.authorId ? { ...r, followedByMe: data.following } : r
        )
      );
      toast.success(data.following ? "ફોલો કરવામાં આવ્યા" : "અનફોલો કરવામાં આવ્યા");
    } catch {
      toast.error("ફોલો કરવામાં ક્ષતિ આવી");
    }
  };

  const nextReel = () => {
    if (currentIdx < reels.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setPlaying(true);
    }
  };

  const prevReel = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
      {/* Top Header Actions */}
      <div className="w-full max-w-md flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
            {t("reels")}
          </h2>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
            Live Community
          </span>
        </div>
        <button
          data-testid="create-reel-btn"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>રીલ ઉમેરો</span>
        </button>
      </div>

      {loading ? (
        <div className="w-full max-w-sm aspect-[9/16] rounded-3xl bg-slate-900/10 flex items-center justify-center animate-pulse">
          <div className="text-slate-400 text-sm font-medium">{t("loading")}</div>
        </div>
      ) : reels.length === 0 ? (
        <div className="w-full max-w-sm p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-800 grid place-items-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-slate-900 text-base">હજી કોઈ રીલ્સ નથી</h3>
          <p className="text-xs text-slate-500">તમારા સમાજ સાથે પ્રથમ વિડિયો કે રીલ શેર કરનાર બનો!</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-900 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> પ્રથમ રીલ બનાવો
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-[390px] aspect-[9/16] max-h-[78vh] rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 flex items-center justify-center select-none">
          {/* Main Video or Media Display */}
          {activeReel.mediaUrls && activeReel.mediaUrls[0] && isVideoUrl(activeReel.mediaUrls[0]) ? (
            <video
              ref={videoRef}
              src={activeReel.mediaUrls[0]}
              className="w-full h-full object-cover cursor-pointer"
              autoPlay
              loop
              playsInline
              muted={muted}
              onClick={togglePlay}
            />
          ) : activeReel.mediaUrls && activeReel.mediaUrls[0] ? (
            <img
              src={activeReel.mediaUrls[0]}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={togglePlay}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 p-6 flex flex-col justify-center text-white text-center">
              <p className="text-base font-medium leading-relaxed">{activeReel.caption || activeReel.content}</p>
            </div>
          )}

          {/* Play/Pause Overlay Animation Indicator */}
          {!playing && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md grid place-items-center text-white">
                <Play className="w-8 h-8 ml-1 fill-white" />
              </div>
            </div>
          )}

          {/* Top Info Bar inside Reel */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
                {currentIdx + 1} / {reels.length}
              </span>
              <VisibilityBadge value={activeReel.visibility} />
            </div>

            <div className="flex items-center gap-2">
              {isAuthorOrAdmin && (
                <>
                  <button
                    type="button"
                    data-testid="reel-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditReelOpen(true);
                    }}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                    title="Edit Reel"
                  >
                    <Edit3 className="w-4 h-4 text-purple-300" />
                  </button>
                  <button
                    type="button"
                    data-testid="reel-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReel();
                    }}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-rose-900/60 transition text-rose-300"
                    title="Delete Reel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={() => setMuted(!muted)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                data-testid="reel-sound-toggle"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Floating Interaction Bar */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
            {/* Like */}
            <button
              onClick={handleLike}
              data-testid="reel-like-btn"
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-11 h-11 rounded-full grid place-items-center backdrop-blur-md transition-transform active:scale-125 ${activeReel.likedByMe ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40" : "bg-black/50 text-white hover:bg-black/70"}`}>
                <Heart className={`w-5 h-5 ${activeReel.likedByMe ? "fill-white" : ""}`} />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {activeReel.likesCount || 0}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              data-testid="reel-comment-btn"
              className="flex flex-col items-center gap-1"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white grid place-items-center hover:bg-black/70">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {activeReel.commentsCount || 0}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              data-testid="reel-share-btn"
              className="flex flex-col items-center gap-1"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white grid place-items-center hover:bg-black/70">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">{t("share")}</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              data-testid="reel-save-btn"
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-11 h-11 rounded-full grid place-items-center backdrop-blur-md ${activeReel.savedByMe ? "bg-purple-600 text-white" : "bg-black/50 text-white hover:bg-black/70"}`}>
                <Bookmark className={`w-5 h-5 ${activeReel.savedByMe ? "fill-white" : ""}`} />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">{t("saved")}</span>
            </button>

            {/* Music disc animation */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-white/60 grid place-items-center animate-spin [animation-duration:4s]">
              <Music2 className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Bottom Left Creator & Caption Info Overlay */}
          <div className="absolute bottom-4 left-4 right-16 text-white z-10">
            <div className="flex items-center gap-2 mb-2">
              <Link
                to={`/users/${activeReel.authorId || activeReel.createdBy}`}
                className="w-10 h-10 rounded-full border-2 border-white/80 overflow-hidden bg-purple-200 grid place-items-center shrink-0"
              >
                {activeReel.authorPhoto ? (
                  <img src={activeReel.authorPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-extrabold text-purple-900 text-sm">
                    {(activeReel.authorName?.[0] || "?").toUpperCase()}
                  </span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/users/${activeReel.authorId || activeReel.createdBy}`}
                    className="font-semibold text-sm drop-shadow truncate hover:underline"
                  >
                    {activeReel.authorName || "સમાજ સભ્ય"}
                  </Link>
                  {activeReel.authorId !== user?.id && (
                    <button
                      onClick={handleFollow}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md transition ${activeReel.followedByMe ? "bg-white/20 text-white border border-white/40" : "bg-purple-600 text-white hover:bg-purple-700"}`}
                    >
                      {activeReel.followedByMe ? "ફોલોઇંગ" : "ફોલો"}
                    </button>
                  )}
                </div>
                {activeReel.location && (
                  <div className="text-[11px] text-white/80 truncate drop-shadow">
                    📍 {activeReel.location}
                  </div>
                )}
              </div>
            </div>

            {activeReel.caption && (
              <p className="text-xs text-white/95 line-clamp-2 drop-shadow font-normal leading-relaxed">
                {activeReel.caption}
              </p>
            )}
          </div>

          {/* Navigation Arrows for desktop */}
          <div className="hidden sm:flex flex-col gap-2 absolute -right-14 top-1/2 -translate-y-1/2">
            <button
              onClick={prevReel}
              disabled={currentIdx === 0}
              className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-md disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Reel"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={nextReel}
              disabled={currentIdx === reels.length - 1}
              className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-md disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Reel"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Comments Drawer / Sheet */}
      {showComments && activeReel && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-4 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-heading font-bold text-slate-900 text-sm">
              ટિપ્પણીઓ ({activeReel.commentsCount || 0})
            </div>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <Comments
              postId={activeReel.id}
              authorId={activeReel.authorId}
              onCount={(cnt) =>
                setReels((prev) =>
                  prev.map((r, idx) => (idx === currentIdx ? { ...r, commentsCount: cnt } : r))
                )
              }
            />
          </div>
        </div>
      )}

      <CreateReelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(newReel) => {
          setReels([newReel, ...reels]);
          setCurrentIdx(0);
        }}
      />

      {editReelOpen && activeReel && (
        <EditReelDialog
          open={editReelOpen}
          onOpenChange={setEditReelOpen}
          reel={activeReel}
          onSaved={(updated) => {
            setReels((prev) =>
              prev.map((r, idx) => (idx === currentIdx ? { ...r, ...updated } : r))
            );
          }}
        />
      )}
    </div>
  );
}
