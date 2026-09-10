import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  X,
  Heart,
  Share2,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Eye,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect } from "@/components/Visibility";
import { StoryEditorModal } from "@/components/social/StoryEditorModal";
import { StoryShareDialog } from "@/components/social/StoryShareDialog";
import { formatStoryTime, getFilterCss } from "@/lib/mediaFilters";
import { playTrackPreview, stopTrackPreview } from "@/lib/audioLibrary";
import { uploadFile } from "@/lib/firebase";

export function Stories() {
  const { user, t } = useApp();
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null); // { g, i }
  const [vis, setVis] = useState("samaj");

  // Story Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMedia, setEditorMedia] = useState({ url: "", type: "image", rawFile: null });

  // Story Share Dialog state
  const [sharingStory, setSharingStory] = useState(null);

  // Auto-updating relative time ticker
  const [ticker, setTicker] = useState(0);
  const fileInputRef = useRef(null);
  const videoElemRef = useRef(null);

  const load = () => {
    api
      .get("/stories")
      .then(({ data }) => setGroups(data.items || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    // Auto-update timestamps every 30 seconds
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Audio playback during story viewing
  useEffect(() => {
    if (viewing && viewing.g?.items?.[viewing.i]) {
      const currentStory = viewing.g.items[viewing.i];
      if (currentStory.music) {
        playTrackPreview(currentStory.music, currentStory.music.volume ?? 0.75);
      } else {
        stopTrackPreview();
      }
    } else {
      stopTrackPreview();
    }
    return () => stopTrackPreview();
  }, [viewing]);

  // Handle local file pick for editor
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    const localUrl = URL.createObjectURL(file);

    setEditorMedia({
      url: localUrl,
      type: isVid ? "video" : "image",
      rawFile: file,
    });
    setEditorOpen(true);
    e.target.value = "";
  };

  // Publish from StoryEditorModal
  const handlePublishStory = async (editorData) => {
    let finalUrl = editorData.mediaUrl;

    // If it's a blob URL, upload to Firebase Storage
    if (editorMedia.rawFile && finalUrl.startsWith("blob:")) {
      toast.info("મીડિયા અપલોડ થઈ રહ્યું છે...");
      finalUrl = await uploadFile(editorMedia.rawFile, "stories");
    }

    const payload = {
      mediaUrl: finalUrl,
      mediaType: editorData.mediaType,
      caption: editorData.caption,
      filter: editorData.filter,
      rotation: editorData.rotation,
      aspectRatio: editorData.aspectRatio,
      volume: editorData.volume,
      trimStart: editorData.trimStart,
      trimEnd: editorData.trimEnd,
      textOverlays: editorData.textOverlays,
      emojiOverlays: editorData.emojiOverlays,
      music: editorData.music,
      visibility: editorData.visibility || vis,
    };

    await api.post("/stories", payload);
    toast.success("સ્ટોરી સફળતાપૂર્વક પબ્લિશ થઈ!");
    load();
  };

  const open = (g) => {
    setViewing({ g, i: 0 });
    if (g.items?.[0]?.id) {
      api.post(`/stories/${g.items[0].id}/view`).catch(() => {});
    }
  };

  const next = () => {
    if (!viewing) return;
    const ni = viewing.i + 1;
    if (ni >= viewing.g.items.length) {
      stopTrackPreview();
      return setViewing(null);
    }
    api.post(`/stories/${viewing.g.items[ni].id}/view`).catch(() => {});
    setViewing({ ...viewing, i: ni });
  };

  const prev = (e) => {
    e.stopPropagation();
    if (!viewing) return;
    const pi = viewing.i - 1;
    if (pi >= 0) {
      setViewing({ ...viewing, i: pi });
    }
  };

  const del = async (s) => {
    await api.delete(`/stories/${s.id}`);
    stopTrackPreview();
    setViewing(null);
    toast.success("સ્ટોરી હટાવી દેવામાં આવી");
    load();
  };

  // Toggle Like for active story
  const toggleLike = async (e, s) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/stories/${s.id}/like`);
      // Update local state in viewer
      s.likedByMe = data.liked;
      s.likesCount = data.likesCount;
      setViewing({ ...viewing });
      load();
    } catch (err) {
      toast.error("લાઇક કરવામાં ભૂલ આવી");
    }
  };

  const currentStory = viewing?.g?.items?.[viewing?.i];

  return (
    <>
      {/* Stories Bar */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" data-testid="stories-bar">
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
            data-testid="story-upload-input"
          />
          <button
            type="button"
            data-testid="story-upload"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-full bg-purple-50 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-100/80 transition grid place-items-center text-purple-800 group"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="sr-only">સ્ટોરી ઉમેરો</span>
          </button>
          <VisibilitySelect
            testId="story-visibility"
            value={vis}
            onChange={setVis}
            className="!px-1.5 !py-0.5 !text-[9px] max-w-[64px]"
          />
        </div>

        {/* Stories list */}
        {groups.map((g) => {
          const seen = g.items.every((s) => s.viewedByMe);
          const latestItem = g.items[g.items.length - 1];

          return (
            <button
              key={g.userId}
              data-testid={`story-${g.userId}`}
              onClick={() => open(g)}
              className="flex flex-col items-center gap-1 shrink-0 w-16 group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                  seen
                    ? "bg-slate-300"
                    : "bg-gradient-to-tr from-purple-700 via-fuchsia-500 to-amber-400 animate-pulse"
                }`}
              >
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-purple-100 grid place-items-center font-bold text-purple-800">
                    {g.photo ? (
                      <img src={g.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (g.name?.[0] || "?").toUpperCase()
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 truncate w-full font-medium">
                {g.userId === user?.id ? "તમે (You)" : g.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story Viewer Overlay */}
      {viewing && currentStory && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none"
          onClick={next}
          data-testid="story-viewer"
        >
          {/* Progress Bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
            {viewing.g.items.map((_, k) => (
              <div
                key={k}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  k < viewing.i
                    ? "bg-white"
                    : k === viewing.i
                    ? "bg-purple-400"
                    : "bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* Top User Header with relative posted time */}
          <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-200 border border-white/40 grid place-items-center font-bold text-purple-900 text-sm">
                {viewing.g.photo ? (
                  <img src={viewing.g.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  (viewing.g.name?.[0] || "?").toUpperCase()
                )}
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>{viewing.g.name}</span>
                  {currentStory.music && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-purple-900/60 px-2 py-0.5 rounded-full text-purple-200 border border-purple-500/30">
                      <Music className="w-2.5 h-2.5" />
                      {currentStory.music.title}
                    </span>
                  )}
                </div>

                {/* Point 2.1: Relative Posted Time display */}
                <div
                  className="flex items-center gap-1.5 text-[11px] text-slate-300"
                  data-testid="story-posted-time"
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatStoryTime(currentStory.createdAt, "gu")}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{formatStoryTime(currentStory.createdAt, "en")}</span>
                </div>
              </div>
            </div>

            {/* Actions: Delete & Close */}
            <div className="flex items-center gap-2">
              {(viewing.g.userId === user?.id || ["admin", "samaj_admin", "super_admin"].includes(user?.role)) && (
                <button
                  data-testid="story-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    del(currentStory);
                  }}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-red-600/80 text-white transition"
                  title="સ્ટોરી હટાવો"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                className="p-1.5 rounded-full bg-black/40 hover:bg-white/20 text-white transition"
                onClick={(e) => {
                  e.stopPropagation();
                  stopTrackPreview();
                  setViewing(null);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Left / Right tap zones for navigation */}
          <div
            className="absolute top-16 bottom-20 left-0 w-1/4 z-20 cursor-pointer"
            onClick={prev}
            title="પાછળ"
          />
          <div
            className="absolute top-16 bottom-20 right-0 w-3/4 z-20 cursor-pointer"
            onClick={next}
            title="આગળ"
          />

          {/* Media Centerpiece */}
          <div className="relative max-h-[85vh] max-w-full flex items-center justify-center overflow-hidden">
            {currentStory.mediaType === "video" ? (
              <video
                ref={videoElemRef}
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                onEnded={next}
                style={{
                  filter: getFilterCss(currentStory.filter),
                  transform: `rotate(${currentStory.rotation || 0}deg)`,
                }}
                className="max-h-[82vh] max-w-full object-contain rounded-xl"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt=""
                style={{
                  filter: getFilterCss(currentStory.filter),
                  transform: `rotate(${currentStory.rotation || 0}deg)`,
                }}
                className="max-h-[82vh] max-w-full object-contain rounded-xl"
              />
            )}

            {/* Render Text Overlays */}
            {currentStory.textOverlays?.map((t) => (
              <div
                key={t.id}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  color: t.color || "#FFFFFF",
                  fontSize: `${t.fontSize || 20}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-bold px-2.5 py-1 rounded bg-black/40 text-white pointer-events-none drop-shadow-md"
              >
                {t.text}
              </div>
            ))}

            {/* Render Emoji Overlays */}
            {currentStory.emojiOverlays?.map((em) => (
              <div
                key={em.id}
                style={{
                  left: `${em.x}%`,
                  top: `${em.y}%`,
                  fontSize: `${em.size || 38}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-md select-none leading-none"
              >
                {em.emoji}
              </div>
            ))}
          </div>

          {/* Bottom Bar: Caption + Like + Share + Views count */}
          <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-3 text-white">
            {/* Caption */}
            <div className="flex-1 min-w-0">
              {currentStory.caption && (
                <div className="inline-block max-w-full truncate text-xs bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10">
                  {currentStory.caption}
                </div>
              )}
            </div>

            {/* Interaction Buttons: Like, Share, Views */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Like Button & Count (Point 2.7) */}
              <button
                data-testid="story-like-btn"
                onClick={(e) => toggleLike(e, currentStory)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-xs border transition ${
                  currentStory.likedByMe
                    ? "bg-rose-600/90 border-rose-500 text-white"
                    : "bg-black/50 border-white/20 text-white hover:bg-black/70"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    currentStory.likedByMe ? "fill-current text-white" : ""
                  }`}
                />
                <span data-testid="story-like-count" className="text-xs font-bold">
                  {currentStory.likesCount || 0}
                </span>
              </button>

              {/* Share Button (Point 2.8) */}
              <button
                data-testid="story-share-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSharingStory(currentStory);
                }}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white backdrop-blur-xs transition"
                title="ચેટમાં શેર કરો"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Views Count */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/50 border border-white/20 text-slate-300 text-xs backdrop-blur-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>{currentStory.viewsCount || 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Editor Modal for Video & Photo (Points 2.2, 2.3, 2.4, 2.5, 2.6) */}
      <StoryEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        mediaUrl={editorMedia.url}
        mediaType={editorMedia.type}
        onPublish={handlePublishStory}
        initialVisibility={vis}
      />

      {/* Story Share to Chat Dialog (Point 2.8) */}
      <StoryShareDialog
        open={Boolean(sharingStory)}
        onClose={() => setSharingStory(null)}
        story={sharingStory}
      />
    </>
  );
}
