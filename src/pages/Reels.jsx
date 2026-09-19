import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Plus, Play, Pause, ChevronUp, ChevronDown, Music2, UserCheck, UserPlus, Sparkles, X, Edit3, Trash2, MoreVertical, Flame } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      setCaption("");
      setMedia([]);
      setVis("samaj");
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    if (!media.length) return toast.error("કૃપા કરીને એક વિડિયો અપલોડ કરો (Please select a video)");
    setBusy(true);
    try {
      const payload = {
        caption: caption.trim(),
        content: caption.trim(),
        mediaUrls: media,
        imageUrls: media,
        mediaType: "reel",
        visibility: vis,
      };

      // Strict backend creation — backend/database is the single source of truth
      const { data } = await api.post("/posts", payload);
      if (!data || !data.id) {
        throw new Error("સર્વર તરફથી અમાન્ય પ્રતિસાદ મળ્યો (Invalid server response)");
      }

      onCreated(data);
      onOpenChange(false);
      setCaption("");
      setMedia([]);
      setVis("samaj");
      toast.success("રીલ સફળતાપૂર્વક અપલોડ થઈ ગઈ!");
    } catch (e) {
      console.error("Reel creation failed:", e);
      const errDetail =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        (e?.response?.status ? `સર્વર ક્ષતિ (${e.response.status})` : e?.message) ||
        "રીલ અપલોડ કરવામાં નિષ્ફળતા";
      toast.error(`રીલ અપલોડ નિષ્ફળ: ${errDetail}`);
      // Do NOT create a fake Reel, do NOT report success, keep video in dialog so user can retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-[95vw] rounded-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        data-testid="create-reel-dialog"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-900 font-bold">
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
                <video
                  src={media[0]}
                  className="max-h-48 w-full object-contain"
                  controls
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
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
                  kind={vis === "only_me" || vis === "private" ? "only_me" : "posts"}
                  onDone={(urls) => setMedia(urls)}
                  label="વિડિયો પસંદ કરો (Select Video)"
                  testId="reel-video-upload"
                />
                <p className="text-[11px] text-slate-500 mt-1">MP4, MOV અથવા WebM ફોર્મેટ (મહત્તમ 100MB)</p>
              </div>
            )}
          </div>

          {/* Privacy Selector - Point 3 Requirement */}
          <div className="pt-1">
            <PrivacySelector
              value={vis}
              onChange={(newVis) => setVis(newVis)}
              testIdPrefix="create-reel-privacy"
            />
          </div>

          <button
            data-testid="submit-reel-btn"
            onClick={submit}
            disabled={busy || !media.length}
            className="w-full py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
      <DialogContent
        className="max-w-md w-[95vw] rounded-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        data-testid="edit-reel-dialog"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
      >
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
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef(null);

  const location = useLocation();

  const loadReels = async () => {
    setLoading(true);
    try {
      // Clear any legacy unsaved local reel cache from previous sessions
      try {
        localStorage.removeItem("sc_local_reels");
      } catch {}

      // Fetch verified posts directly from the backend API (single source of truth)
      const { data } = await api.get("/posts", { params: { limit: 60 } });
      const remoteItems = data?.items || [];

      // Include reels, video posts, and memorial posts (Maran Nodh / Shraddhanjali)
      const relevantItems = remoteItems.filter(
        (p) =>
          p.mediaType === "reel" ||
          p.isReel ||
          p.isMemorial ||
          p.category === "memorial" ||
          Boolean(p.maranNodhId) ||
          (p.mediaUrls && p.mediaUrls.some(isVideoUrl))
      );
      const finalReels = relevantItems.length > 0 ? relevantItems : remoteItems;

      setReels(finalReels);

      // Deep link to a specific reel or memorial entry if requested
      const params = new URLSearchParams(location.search);
      const targetMaranId = params.get("maranId");
      const targetId = params.get("id");
      if (targetMaranId) {
        const foundIdx = finalReels.findIndex(
          (r) =>
            r.maranNodhId === targetMaranId ||
            r.id === `post_memorial_${targetMaranId}` ||
            r.id === targetMaranId
        );
        if (foundIdx !== -1) setCurrentIdx(foundIdx);
      } else if (targetId) {
        const foundIdx = finalReels.findIndex((r) => r.id === targetId);
        if (foundIdx !== -1) setCurrentIdx(foundIdx);
      }
    } catch {
      toast.error("રીલ્સ લોડ કરવામાં ભૂલ આવી");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, [activeSamaj?.id, location.search]);

  useEffect(() => {
    setMediaError(false);
  }, [currentIdx]);

  const activeReel = reels[currentIdx];

  const isMemorial = Boolean(
    activeReel?.isMemorial ||
    activeReel?.category === "memorial" ||
    activeReel?.maranNodhId ||
    activeReel?.id?.startsWith("post_memorial_")
  );

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

  const handleMemorialTribute = async (type = "diya") => {
    if (!activeReel) return;
    const maranId =
      activeReel.maranNodhId ||
      (activeReel.id?.startsWith("post_memorial_")
        ? activeReel.id.replace("post_memorial_", "")
        : null);

    if (maranId) {
      try {
        const { data } = await api.post(`/maran-nodh/${maranId}/tribute`, { type });
        toast.success(
          type === "diya"
            ? "દિવંગત આત્મા માટે દીવો પ્રગટાવવામાં આવ્યો 🪔"
            : "પુષ્પાંજલિ અર્પણ કરવામાં આવી 🌸"
        );
        setReels((prev) =>
          prev.map((r, idx) => {
            if (idx === currentIdx) {
              const prevData = r.maranNodhData || {};
              return {
                ...r,
                likedByMe: true,
                likesCount: (r.likesCount || 0) + 1,
                maranNodhData: {
                  ...prevData,
                  diyaCount: data.diyaCount ?? ((prevData.diyaCount || 0) + 1),
                  flowerCount: data.flowerCount ?? (prevData.flowerCount || 0),
                },
              };
            }
            return r;
          })
        );
        return;
      } catch {
        // Continue to regular like fallback
      }
    }

    // Fallback if no specific maranId
    try {
      const { data } = await api.post(`/posts/${activeReel.id}/like`);
      toast.success(type === "diya" ? "દીવો પ્રગટાવવામાં આવ્યો 🪔" : "શ્રદ્ધાંજલિ નોંધાઈ 🌸");
      setReels((prev) =>
        prev.map((r, idx) =>
          idx === currentIdx ? { ...r, likedByMe: true, likesCount: data.likesCount } : r
        )
      );
    } catch {
      toast.error("શ્રદ્ધાંજલિ નોંધવામાં ક્ષતિ આવી");
    }
  };

  const handleLike = async (e) => {
    e?.stopPropagation?.();
    if (!activeReel) return;
    if (isMemorial) {
      handleMemorialTribute("diya");
      return;
    }
    try {
      const { data } = await api.post(`/posts/${activeReel.id}/like`);
      setReels((prev) =>
        prev.map((r, idx) => (idx === currentIdx ? { ...r, likedByMe: data.liked, likesCount: data.likesCount } : r))
      );
    } catch {
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
    } catch {
      toast.error("સેવ કરવામાં ક્ષતિ આવી");
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (!activeReel) return;
    const maranId =
      activeReel.maranNodhId ||
      (activeReel.id?.startsWith("post_memorial_")
        ? activeReel.id.replace("post_memorial_", "")
        : null);
    const url = maranId
      ? `${window.location.origin}/reels?maranId=${maranId}`
      : `${window.location.origin}/reels?id=${activeReel.id}`;

    const deceasedName =
      activeReel.maranNodhData?.deceasedName ||
      activeReel.caption?.replace(/^🕊️ ભાવભીની શ્રદ્ધાંજલિ:?\s*/, "") ||
      "સ્વર્ગસ્થ સભ્ય";

    const shareTitle = isMemorial
      ? `🕊️ શ્રદ્ધાંજલિ: સ્વ. ${deceasedName}`
      : "SAMAJ CONNECT Reel";

    const shareText = isMemorial
      ? `🕊️ ભાવભીની શ્રદ્ધાંજલિ: સ્વ. ${deceasedName}\nબેસણું: ${activeReel.maranNodhData?.besnuDate || "જાહેર થશે"}${activeReel.maranNodhData?.besnuVenue ? " (" + activeReel.maranNodhData.besnuVenue + ")" : ""}\nસમાજ રીલ પર શ્રદ્ધાંજલિ આપો:\n${url}`
      : (activeReel.caption || "Check out this reel on SAMAJ CONNECT!");

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
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
        videoRef.current.play()?.catch(() => {});
      }
      setPlaying(!playing);
    }
  };

  // Touch gesture support for mobile vertical swipe
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) {
      nextReel();
    } else if (diff < -50) {
      prevReel();
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        nextReel();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        prevReel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, reels.length]);

  // Global listener to trigger create reel from bottom nav or external events
  useEffect(() => {
    const handleOpenCreate = () => setCreateOpen(true);
    window.addEventListener("samaj-open-create-reel", handleOpenCreate);
    return () => window.removeEventListener("samaj-open-create-reel", handleOpenCreate);
  }, []);

  return (
    <div
      className="relative w-full h-[calc(100dvh-64px-env(safe-area-inset-bottom,0px))] sm:h-[calc(100vh-2rem)] flex flex-col items-center justify-center bg-black sm:bg-transparent overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {loading ? (
        <div className="w-full h-full sm:max-w-[400px] sm:h-full sm:max-h-[820px] sm:aspect-[9/16] sm:rounded-3xl bg-slate-900 flex items-center justify-center animate-pulse">
          <div className="text-slate-400 text-sm font-medium">{t("loading")}</div>
        </div>
      ) : reels.length === 0 ? (
        <div className="w-full max-w-sm p-8 text-center bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-4 mx-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-900/60 text-purple-300 grid place-items-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-white text-base">હજી કોઈ રીલ્સ નથી</h3>
          <p className="text-xs text-slate-400">તમારા સમાજ સાથે પ્રથમ વિડિયો કે રીલ શેર કરનાર બનો!</p>
          <button
            data-testid="create-reel-btn"
            onClick={() => setCreateOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> પ્રથમ રીલ બનાવો
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full sm:max-w-[400px] sm:h-full sm:max-h-[820px] sm:aspect-[9/16] sm:rounded-3xl overflow-hidden bg-black shadow-2xl sm:border sm:border-slate-800 flex items-center justify-center select-none">
          {/* Main Video, Memorial Tribute, or Media Display */}
          {isMemorial ? (
            <div className="relative w-full h-full bg-gradient-to-b from-stone-950 via-amber-950/80 to-stone-950 flex flex-col items-center justify-between p-4 py-8 text-white select-none overflow-y-auto">
              {/* Spiritual Top Accent Header */}
              <div className="flex flex-col items-center text-center space-y-1 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold tracking-wide shadow-md">
                  <span>🕊️</span>
                  <span>ભાવભીની શ્રદ્ધાંજલિ • ૐ શાંતિ</span>
                </div>
                <div className="text-[11px] text-amber-100/70">સમાજ મરણ નોંધ અને પ્રાર્થના સભા</div>
              </div>

              {/* Centered Dignified Photo in Memorial Frame */}
              <div className="flex flex-col items-center my-auto py-2 z-10 w-full max-w-[290px]">
                <div className="relative p-1.5 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-2xl ring-4 ring-amber-500/30">
                  <div className="w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden bg-stone-900 grid place-items-center">
                    {activeReel.mediaUrls?.[0] ? (
                      <img
                        src={activeReel.mediaUrls[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-amber-200/60">
                        <div className="text-4xl mb-1">🕊️</div>
                        <div className="text-xs font-bold">ઓમ શાંતિ</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-stone-950 border border-amber-400 text-amber-300 text-[11px] font-bold shadow-lg whitespace-nowrap">
                    સ્વર્ગસ્થ • ૐ શાંતિ 🕊️
                  </div>
                </div>

                {/* Name & Age */}
                <h2 className="mt-4 font-heading font-extrabold text-xl sm:text-2xl text-amber-100 text-center tracking-wide drop-shadow-md">
                  સ્વ. {activeReel.maranNodhData?.deceasedName || activeReel.maranNodhData?.name || activeReel.caption?.replace(/^🕊️ ભાવભીની શ્રદ્ધાંજલિ:?\s*/, "")}
                </h2>
                {activeReel.maranNodhData?.age && (
                  <div className="text-xs text-amber-200/90 font-medium mt-0.5">
                    ઉંમર: {activeReel.maranNodhData.age} વર્ષ
                  </div>
                )}

                <div className="text-xs text-stone-300 mt-1 flex items-center justify-center gap-2 flex-wrap">
                  {activeReel.maranNodhData?.village && (
                    <span>વતન: <strong className="text-amber-200">{activeReel.maranNodhData.village}</strong></span>
                  )}
                  {activeReel.maranNodhData?.currentCity && (
                    <span>• હાલ: <strong className="text-amber-200">{activeReel.maranNodhData.currentCity}</strong></span>
                  )}
                </div>

                {/* Besnu (Prayer meeting) info badge */}
                {(activeReel.maranNodhData?.besnuDate || activeReel.maranNodhData?.besnuVenue) && (
                  <div className="mt-3 w-full bg-stone-900/80 backdrop-blur-md border border-amber-400/40 rounded-2xl p-2.5 text-center text-xs space-y-1 shadow-lg">
                    <div className="text-amber-300 font-bold flex items-center justify-center gap-1.5 text-[11px]">
                      <span>📅 બેસણું (પ્રાર્થના સભા):</span>
                      <span>{activeReel.maranNodhData.besnuDate || "જાહેર થશે"}</span>
                    </div>
                    {activeReel.maranNodhData.besnuTime && (
                      <div className="text-[11px] text-stone-300">
                        ⏰ સમય: {activeReel.maranNodhData.besnuTime}
                      </div>
                    )}
                    {activeReel.maranNodhData.besnuVenue && (
                      <div className="text-[11px] text-stone-300 line-clamp-1">
                        📍 સ્થળ: {activeReel.maranNodhData.besnuVenue}
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Tribute Action Buttons on Reel */}
                <div className="flex items-center gap-2 mt-3 w-full justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMemorialTribute("diya");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <span>🪔</span> દીવો પ્રગટાવો
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMemorialTribute("flower");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-amber-400/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <span>🌸</span> પુષ્પાંજલિ
                  </button>
                </div>

                {/* Link to Full Obituary page */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nav("/maran-nodh");
                  }}
                  className="mt-2 text-[11px] text-amber-300/90 hover:text-amber-200 underline cursor-pointer"
                >
                  સંપૂર્ણ મરણ નોંધ અને સાંત્વના સંદેશ જુઓ →
                </button>
              </div>

              {/* Decorative bottom prayer message */}
              <div className="text-[10px] text-stone-400 text-center italic z-10">
                પ્રભુ દિવંગત આત્માને પરમ શાંતિ અર્પે • ૐ શાંતિ
              </div>
            </div>
          ) : !mediaError && activeReel.mediaUrls && activeReel.mediaUrls[0] && isVideoUrl(activeReel.mediaUrls[0]) ? (
            <video
              ref={videoRef}
              src={activeReel.mediaUrls[0]}
              className="w-full h-full object-cover cursor-pointer"
              autoPlay
              loop
              playsInline
              muted={muted}
              onClick={togglePlay}
              onError={() => setMediaError(true)}
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

          {/* Play/Pause Overlay Animation Indicator (for video) */}
          {!isMemorial && !playing && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer z-15"
            >
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md grid place-items-center text-white">
                <Play className="w-8 h-8 ml-1 fill-white" />
              </div>
            </div>
          )}

          {/* Top Info Bar inside Reel - Minimal translucent overlays */}
          <div className="absolute top-3 left-3.5 right-3.5 flex items-center justify-between text-white z-20 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xs">
                {currentIdx + 1} / {reels.length}
              </span>
              <VisibilityBadge value={activeReel.visibility} />
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              {isAuthorOrAdmin && (
                <>
                  <button
                    type="button"
                    data-testid="reel-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditReelOpen(true);
                    }}
                    className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition border border-white/10 cursor-pointer"
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
                    className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-rose-900/70 transition border border-white/10 text-rose-300 cursor-pointer"
                    title="Delete Reel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted(!muted);
                }}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition border border-white/10 cursor-pointer"
                data-testid="reel-sound-toggle"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Floating Interaction Bar */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
            {/* Like / Diya */}
            <button
              onClick={isMemorial ? () => handleMemorialTribute("diya") : handleLike}
              data-testid="reel-like-btn"
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div
                className={`w-11 h-11 rounded-full grid place-items-center backdrop-blur-md transition-transform active:scale-125 ${
                  isMemorial
                    ? "bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 shadow-lg shadow-amber-500/50"
                    : activeReel.likedByMe
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40"
                    : "bg-black/50 text-white hover:bg-black/70 border border-white/10"
                }`}
              >
                {isMemorial ? (
                  <Flame className="w-5 h-5 fill-amber-300 text-amber-950" />
                ) : (
                  <Heart className={`w-5 h-5 ${activeReel.likedByMe ? "fill-white" : ""}`} />
                )}
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {isMemorial
                  ? (activeReel.maranNodhData?.diyaCount || activeReel.likesCount || 0)
                  : (activeReel.likesCount || 0)}
              </span>
              {isMemorial && <span className="text-[9px] text-amber-300 font-semibold">દીવો</span>}
            </button>

            {/* Comment */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              data-testid="reel-comment-btn"
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white grid place-items-center hover:bg-black/70 border border-white/10">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {activeReel.commentsCount || 0}
              </span>
              {isMemorial && <span className="text-[9px] text-white/80 font-medium">સાંત્વના</span>}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              data-testid="reel-share-btn"
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white grid place-items-center hover:bg-black/70 border border-white/10">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">{t("share")}</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              data-testid="reel-save-btn"
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className={`w-11 h-11 rounded-full grid place-items-center backdrop-blur-md border border-white/10 ${activeReel.savedByMe ? "bg-purple-600 text-white" : "bg-black/50 text-white hover:bg-black/70"}`}>
                <Bookmark className={`w-5 h-5 ${activeReel.savedByMe ? "fill-white" : ""}`} />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">{t("saved")}</span>
            </button>

            {/* Music / Spiritual disc animation */}
            <div
              className={`w-9 h-9 rounded-full border-2 border-white/60 grid place-items-center animate-spin [animation-duration:4s] ${
                isMemorial
                  ? "bg-gradient-to-tr from-amber-600 to-stone-800 text-amber-200"
                  : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
              }`}
            >
              {isMemorial ? <span className="text-xs">🕊️</span> : <Music2 className="w-4 h-4 text-white" />}
            </div>
          </div>

          {/* Subtle gradient scrim at bottom to ensure text readability */}
          {!isMemorial && (
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />
          )}

          {/* Bottom Left Creator & Caption Info Overlay (for standard reels) */}
          {!isMemorial && (
            <div className="absolute bottom-3 left-3.5 right-16 text-white z-20 space-y-2 pointer-events-auto">
              {/* Creator Row: Avatar + Name + Follow */}
              <div className="flex items-center gap-2.5">
                <Link
                  to={`/users/${activeReel.authorId || activeReel.createdBy}`}
                  className="w-10 h-10 rounded-full border-2 border-white/80 overflow-hidden bg-purple-200 grid place-items-center shrink-0 shadow-md"
                >
                  {activeReel.authorPhoto ? (
                    <img src={activeReel.authorPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-extrabold text-purple-900 text-sm">
                      {(activeReel.authorName?.[0] || "?").toUpperCase()}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    to={`/users/${activeReel.authorId || activeReel.createdBy}`}
                    className="font-bold text-sm text-white drop-shadow-md truncate hover:underline"
                  >
                    {activeReel.authorName || "સમાજ સભ્ય"}
                  </Link>
                  {activeReel.authorId !== user?.id && (
                    <button
                      onClick={handleFollow}
                      data-testid="reel-follow-btn"
                      className={`text-[11px] font-bold px-3 py-0.5 rounded-full backdrop-blur-md transition shadow-xs cursor-pointer ${
                        activeReel.followedByMe
                          ? "bg-white/20 text-white border border-white/40"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {activeReel.followedByMe ? "ફોલોઇંગ" : "ફોલો"}
                    </button>
                  )}
                </div>
              </div>

              {/* Caption */}
              {activeReel.caption && (
                <p className="text-xs text-white/95 line-clamp-2 drop-shadow font-normal leading-relaxed">
                  {activeReel.caption}
                </p>
              )}

              {/* Music/audio information */}
              <div className="flex items-center gap-2 text-[11px] text-white/90 drop-shadow">
                <Music2 className="w-3.5 h-3.5 shrink-0 text-purple-300 animate-pulse" />
                <div className="truncate max-w-[220px]">
                  {activeReel.audioTitle || `ઓરિજિનલ ઓડિયો • ${activeReel.authorName || 'સમાજ રીલ'}`}
                </div>
                {activeReel.location && (
                  <span className="text-white/70 text-[10px] truncate">
                    • 📍 {activeReel.location}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation Arrows for desktop */}
          <div className="hidden sm:flex flex-col gap-2 absolute -right-14 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={prevReel}
              disabled={currentIdx === 0}
              className="p-2.5 rounded-full bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 shadow-md disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Previous Reel"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={nextReel}
              disabled={currentIdx === reels.length - 1}
              className="p-2.5 rounded-full bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 shadow-md disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
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
