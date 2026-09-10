import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  RotateCw,
  Crop,
  Volume2,
  VolumeX,
  Sparkles,
  Type,
  Smile,
  Music,
  Check,
  Scissors,
  Trash2,
  Eye,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { MEDIA_FILTERS, getFilterCss } from "@/lib/mediaFilters";
import { MusicPickerModal } from "@/components/social/MusicPickerModal";
import { playTrackPreview, stopTrackPreview } from "@/lib/audioLibrary";
import { VisibilitySelect } from "@/components/Visibility";

const EMOJI_LIST = ["🙏", "💐", "🚩", "🪔", "🕉️", "❤️", "👏", "🎉", "✨", "😊", "💫", "🤝", "🌸", "🔥", "🕊️"];
const COLOR_LIST = ["#FFFFFF", "#000000", "#581c87", "#dc2626", "#d97706", "#16a34a", "#2563eb", "#ec4899"];

export function StoryEditorModal({
  open,
  onClose,
  mediaUrl,
  mediaType = "video",
  onPublish,
  initialVisibility = "samaj",
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Editing state
  const [activeTool, setActiveTool] = useState(null); // null | "filter" | "trim" | "crop" | "rotate" | "volume" | "text" | "emoji" | "music"
  const [filter, setFilter] = useState("normal");
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [aspectRatio, setAspectRatio] = useState("9:16"); // "9:16" | "1:1" | "4:5" | "full"
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [caption, setCaption] = useState("");

  // Video duration & trimming
  const [duration, setDuration] = useState(15);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Overlays
  const [textOverlays, setTextOverlays] = useState([]);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(20);
  const [showTextInput, setShowTextInput] = useState(false);

  const [emojiOverlays, setEmojiOverlays] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Music
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicModal, setShowMusicModal] = useState(false);

  const [publishing, setPublishing] = useState(false);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = Math.round(videoRef.current.duration) || 15;
      setDuration(dur);
      setTrimEnd(Math.min(dur, 30)); // max 30s per story
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      if (cur >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Audio preview syncing with video or image
  useEffect(() => {
    if (selectedMusic && isPlaying) {
      playTrackPreview(selectedMusic, selectedMusic.volume ?? 0.7);
    } else {
      stopTrackPreview();
    }
    return () => {
      stopTrackPreview();
    };
  }, [selectedMusic, isPlaying]);

  const togglePlay = () => {
    if (mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Add text overlay
  const handleAddText = () => {
    if (!newText.trim()) return;
    const item = {
      id: `text_${Date.now()}`,
      text: newText.trim(),
      color: textColor,
      fontSize: fontSize,
      x: 50, // percent
      y: 45, // percent
    };
    setTextOverlays((prev) => [...prev, item]);
    setNewText("");
    setShowTextInput(false);
  };

  // Add emoji overlay
  const handleAddEmoji = (emoji) => {
    const item = {
      id: `emoji_${Date.now()}`,
      emoji,
      x: 50,
      y: 35,
      size: 40,
    };
    setEmojiOverlays((prev) => [...prev, item]);
    setShowEmojiPicker(false);
  };

  // Dragging overlay logic
  const handleOverlayDrag = (id, type, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    if (type === "text") {
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === id ? { ...t, x, y } : t))
      );
    } else {
      setEmojiOverlays((prev) =>
        prev.map((em) => (em.id === id ? { ...em, x, y } : em))
      );
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish({
        mediaUrl,
        mediaType,
        caption,
        filter,
        rotation,
        aspectRatio,
        volume: muted ? 0 : volume,
        trimStart: mediaType === "video" ? trimStart : 0,
        trimEnd: mediaType === "video" ? trimEnd : duration,
        textOverlays,
        emojiOverlays,
        music: selectedMusic,
        visibility,
      });
      stopTrackPreview();
      onClose();
    } catch (err) {
      toast.error("સ્ટોરી પબ્લિશ કરવામાં ભૂલ આવી: " + (err?.message || ""));
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  // Aspect ratio container styles
  let aspectClass = "aspect-[9/16] max-h-[72vh]";
  if (aspectRatio === "1:1") aspectClass = "aspect-square max-h-[60vh]";
  if (aspectRatio === "4:5") aspectClass = "aspect-[4/5] max-h-[68vh]";
  if (aspectRatio === "full") aspectClass = "h-[70vh] w-full";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      data-testid="story-editor-modal"
    >
      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col my-auto text-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80 z-20">
          <button
            data-testid="story-cancel-btn"
            onClick={() => {
              stopTrackPreview();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-xs font-bold text-slate-200">
              {mediaType === "video" ? "વિડિઓ સ્ટોરી એડિટર" : "ફોટો સ્ટોરી એડિટર"}
            </span>
            {selectedMusic && (
              <div className="text-[10px] text-purple-300 truncate max-w-[200px]">
                🎵 {selectedMusic.title}
              </div>
            )}
          </div>

          <button
            data-testid="story-publish-btn"
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs font-bold shadow-lg transition disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{publishing ? "પબ્લિશિંગ..." : "શેર કરો"}</span>
          </button>
        </div>

        {/* Main Preview Area */}
        <div className="relative flex-1 min-h-[360px] max-h-[65vh] bg-black grid place-items-center overflow-hidden p-2">
          <div
            ref={containerRef}
            className={`relative rounded-2xl overflow-hidden ${aspectClass} mx-auto transition-all shadow-xl bg-black flex items-center justify-center`}
          >
            {mediaType === "video" ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                data-testid="story-preview-video"
                autoPlay
                loop
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                style={{
                  filter: getFilterCss(filter),
                  transform: `rotate(${rotation}deg)`,
                }}
                className="w-full h-full object-contain cursor-pointer transition-transform"
              />
            ) : (
              <img
                src={mediaUrl}
                alt=""
                data-testid="story-preview-image"
                style={{
                  filter: getFilterCss(filter),
                  transform: `rotate(${rotation}deg)`,
                }}
                className="w-full h-full object-contain transition-transform"
              />
            )}

            {/* Play/Pause Overlay indicator on click */}
            {mediaType === "video" && (
              <button
                onClick={togglePlay}
                className="absolute top-3 left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-xs"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}

            {/* Text Overlays */}
            {textOverlays.map((t) => (
              <div
                key={t.id}
                draggable
                onDragEnd={(e) => handleOverlayDrag(t.id, "text", e)}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  color: t.color,
                  fontSize: `${t.fontSize}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-bold cursor-move select-none px-2 py-1 rounded bg-black/30 backdrop-blur-xs flex items-center gap-1 group whitespace-nowrap shadow-md"
              >
                <span>{t.text}</span>
                <button
                  onClick={() => setTextOverlays((prev) => prev.filter((x) => x.id !== t.id))}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-1 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Emoji Overlays */}
            {emojiOverlays.map((em) => (
              <div
                key={em.id}
                draggable
                onDragEnd={(e) => handleOverlayDrag(em.id, "emoji", e)}
                style={{
                  left: `${em.x}%`,
                  top: `${em.y}%`,
                  fontSize: `${em.size}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none group leading-none"
              >
                <span>{em.emoji}</span>
                <button
                  onClick={() => setEmojiOverlays((prev) => prev.filter((x) => x.id !== em.id))}
                  className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] grid place-items-center"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Video Duration / Trim indicator */}
            {mediaType === "video" && (
              <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded-full text-slate-300">
                {Math.round(currentTime)}s / {trimEnd - trimStart}s
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Tool Editor Panels */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800">
          {/* 1. Filter selector */}
          {activeTool === "filter" && (
            <div className="py-2 space-y-2 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400 flex justify-between">
                <span>ફિલ્ટર્સ (Filters)</span>
                <button onClick={() => setFilter("normal")} className="text-purple-400 text-xs">
                  રીસેટ
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" data-testid="story-filter-select">
                {MEDIA_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl transition ${
                      filter === f.id ? "bg-purple-900/60 border border-purple-400" : "bg-slate-900 border border-slate-800"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${f.previewBg} grid place-items-center text-xs font-bold text-slate-800`}>
                      Aa
                    </div>
                    <span className="text-[10px] text-slate-300 whitespace-nowrap">{f.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Video Trim slider */}
          {activeTool === "trim" && mediaType === "video" && (
            <div className="py-2 space-y-2 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400 flex justify-between">
                <span>વિડિઓ ટ્રીમ (Trim Start / End)</span>
                <span className="text-purple-400 text-xs font-bold">{trimEnd - trimStart} સેકન્ડ</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span>{trimStart}s</span>
                <input
                  type="range"
                  data-testid="story-trim-start"
                  min="0"
                  max={Math.max(0, trimEnd - 2)}
                  value={trimStart}
                  onChange={(e) => {
                    const s = parseInt(e.target.value);
                    setTrimStart(s);
                    if (videoRef.current) videoRef.current.currentTime = s;
                  }}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  type="range"
                  data-testid="story-trim-end"
                  min={trimStart + 2}
                  max={duration}
                  value={trimEnd}
                  onChange={(e) => {
                    const end = parseInt(e.target.value);
                    setTrimEnd(end);
                  }}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
                <span>{trimEnd}s</span>
              </div>
            </div>
          )}

          {/* 3. Crop / Aspect ratio */}
          {activeTool === "crop" && (
            <div className="py-2 space-y-2 animate-in fade-in duration-150" data-testid="story-crop-select">
              <div className="text-[11px] font-semibold text-slate-400">ક્રોપ / આસ્પેક્ટ રેશિયો (Aspect Ratio)</div>
              <div className="flex gap-2">
                {[
                  { id: "9:16", label: "૯:૧૬ (સ્ટોરી)" },
                  { id: "1:1", label: "૧:૧ (ચોરસ)" },
                  { id: "4:5", label: "૪:૫ (પોર્ટ્રેટ)" },
                  { id: "full", label: "ઓરિજિનલ (Full)" },
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAspectRatio(a.id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition ${
                      aspectRatio === a.id
                        ? "bg-purple-900 border-purple-400 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Volume Control */}
          {activeTool === "volume" && (
            <div className="py-2 space-y-2 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400 flex justify-between">
                <span>વિડિઓ અવાજ (Video Volume)</span>
                <span>{muted ? "મ્યૂટ" : `${Math.round(volume * 100)}%`}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  data-testid="story-volume-slider"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setMuted(false);
                    setVolume(parseFloat(e.target.value));
                  }}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 5. Text input modal panel */}
          {showTextInput && (
            <div className="py-2 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  data-testid="story-text-input"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="લખાણ ઉમેરો (Type text here)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                />
                <button
                  onClick={handleAddText}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500"
                >
                  ઉમેરો
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">રંગ:</span>
                {COLOR_LIST.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border ${textColor === c ? "ring-2 ring-purple-400" : "border-slate-700"}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 6. Emoji Picker panel */}
          {showEmojiPicker && (
            <div className="py-2 animate-in fade-in duration-150 flex items-center gap-2 overflow-x-auto pb-1">
              {EMOJI_LIST.map((em) => (
                <button
                  key={em}
                  onClick={() => handleAddEmoji(em)}
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-xl grid place-items-center shrink-0"
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar: Filter, Trim, Crop, Rotate, Volume, Text, Emoji, Music */}
        <div className="flex items-center justify-around px-3 py-2 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <button
            onClick={() => setActiveTool(activeTool === "filter" ? null : "filter")}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${activeTool === "filter" ? "text-purple-400 font-bold" : "hover:text-white"}`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">ફિલ્ટર</span>
          </button>

          {mediaType === "video" && (
            <button
              onClick={() => setActiveTool(activeTool === "trim" ? null : "trim")}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${activeTool === "trim" ? "text-purple-400 font-bold" : "hover:text-white"}`}
            >
              <Scissors className="w-4 h-4" />
              <span className="text-[10px]">ટ્રીમ</span>
            </button>
          )}

          <button
            onClick={() => setActiveTool(activeTool === "crop" ? null : "crop")}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${activeTool === "crop" ? "text-purple-400 font-bold" : "hover:text-white"}`}
          >
            <Crop className="w-4 h-4" />
            <span className="text-[10px]">ક્રોપ</span>
          </button>

          <button
            data-testid="story-rotate-btn"
            onClick={handleRotate}
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:text-white"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[10px]">ફેરવો</span>
          </button>

          {mediaType === "video" && (
            <button
              onClick={() => setActiveTool(activeTool === "volume" ? null : "volume")}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${activeTool === "volume" ? "text-purple-400 font-bold" : "hover:text-white"}`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-[10px]">વોલ્યુમ</span>
            </button>
          )}

          <button
            data-testid="story-add-text-btn"
            onClick={() => {
              setShowTextInput(!showTextInput);
              setShowEmojiPicker(false);
            }}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${showTextInput ? "text-purple-400 font-bold" : "hover:text-white"}`}
          >
            <Type className="w-4 h-4" />
            <span className="text-[10px]">લખાણ</span>
          </button>

          <button
            data-testid="story-add-emoji-btn"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowTextInput(false);
            }}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${showEmojiPicker ? "text-purple-400 font-bold" : "hover:text-white"}`}
          >
            <Smile className="w-4 h-4" />
            <span className="text-[10px]">ઇમોજી</span>
          </button>

          <button
            data-testid="story-music-btn"
            onClick={() => setShowMusicModal(true)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${selectedMusic ? "text-purple-400 font-bold" : "hover:text-white"}`}
          >
            <Music className="w-4 h-4" />
            <span className="text-[10px]">સંગીત</span>
          </button>
        </div>

        {/* Bottom Visibility and Caption */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="કૅપ્શન લખો (Optional caption)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400"
          />
          <VisibilitySelect value={visibility} onChange={setVisibility} testId="story-visibility" />
        </div>
      </div>

      {/* Music Picker Dialog */}
      <MusicPickerModal
        open={showMusicModal}
        onClose={() => setShowMusicModal(false)}
        selectedMusic={selectedMusic}
        onSelect={(music) => setSelectedMusic(music)}
      />
    </div>
  );
}
