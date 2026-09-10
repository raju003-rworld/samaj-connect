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
} from "lucide-react";
import { MEDIA_FILTERS, getFilterCss } from "@/lib/mediaFilters";
import { MusicPickerModal } from "@/components/social/MusicPickerModal";
import { playTrackPreview, stopTrackPreview } from "@/lib/audioLibrary";

const EMOJI_LIST = ["🙏", "💐", "🚩", "🪔", "🕉️", "❤️", "👏", "🎉", "✨", "😊", "💫", "🤝", "🌸"];
const COLOR_LIST = ["#FFFFFF", "#000000", "#581c87", "#dc2626", "#d97706", "#16a34a", "#2563eb"];

export function PostEditorModal({
  open,
  onClose,
  mediaUrl,
  mediaType = "image",
  onSave,
  initialConfig = {},
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [activeTool, setActiveTool] = useState(null);
  const [filter, setFilter] = useState(initialConfig.filter || "normal");
  const [rotation, setRotation] = useState(initialConfig.rotation || 0);
  const [aspectRatio, setAspectRatio] = useState(initialConfig.aspectRatio || "1:1");
  const [volume, setVolume] = useState(initialConfig.volume ?? 1);
  const [muted, setMuted] = useState(false);

  // Video trimming
  const [duration, setDuration] = useState(30);
  const [trimStart, setTrimStart] = useState(initialConfig.trimStart || 0);
  const [trimEnd, setTrimEnd] = useState(initialConfig.trimEnd || 30);
  const [isPlaying, setIsPlaying] = useState(true);

  // Overlays
  const [textOverlays, setTextOverlays] = useState(initialConfig.textOverlays || []);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [showTextInput, setShowTextInput] = useState(false);

  const [emojiOverlays, setEmojiOverlays] = useState(initialConfig.emojiOverlays || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Music
  const [selectedMusic, setSelectedMusic] = useState(initialConfig.music || null);
  const [showMusicModal, setShowMusicModal] = useState(false);

  useEffect(() => {
    return () => {
      stopTrackPreview();
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = Math.round(videoRef.current.duration) || 30;
      setDuration(dur);
      if (!initialConfig.trimEnd) setTrimEnd(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleAddText = () => {
    if (!newText.trim()) return;
    const item = {
      id: `txt_${Date.now()}`,
      text: newText.trim(),
      color: textColor,
      fontSize: 22,
      x: 50,
      y: 50,
    };
    setTextOverlays((prev) => [...prev, item]);
    setNewText("");
    setShowTextInput(false);
  };

  const handleAddEmoji = (emoji) => {
    const item = {
      id: `em_${Date.now()}`,
      emoji,
      x: 50,
      y: 40,
      size: 44,
    };
    setEmojiOverlays((prev) => [...prev, item]);
    setShowEmojiPicker(false);
  };

  const handleSave = () => {
    stopTrackPreview();
    onSave({
      filter,
      rotation,
      aspectRatio,
      volume: muted ? 0 : volume,
      trimStart,
      trimEnd,
      textOverlays,
      emojiOverlays,
      music: selectedMusic,
    });
    onClose();
  };

  if (!open || !mediaUrl) return null;

  let aspectClass = "aspect-square max-h-[55vh]";
  if (aspectRatio === "4:5") aspectClass = "aspect-[4/5] max-h-[60vh]";
  if (aspectRatio === "16:9") aspectClass = "aspect-video max-h-[50vh]";
  if (aspectRatio === "full") aspectClass = "h-[55vh] w-full";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
      data-testid="post-editor-modal"
    >
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col my-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-200">
            {mediaType === "video" ? "વિડિઓ એડિટ કરો (Edit Video)" : "ફોટો એડિટ કરો (Edit Photo)"}
          </span>
          <button
            onClick={handleSave}
            data-testid="post-editor-save-btn"
            className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>સાચવો</span>
          </button>
        </div>

        {/* Media Preview Container */}
        <div className="relative flex-1 min-h-[300px] max-h-[60vh] bg-black grid place-items-center p-2">
          <div
            ref={containerRef}
            className={`relative rounded-2xl overflow-hidden ${aspectClass} mx-auto transition-all shadow-xl bg-black flex items-center justify-center`}
          >
            {mediaType === "video" ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                autoPlay
                loop
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                style={{
                  filter: getFilterCss(filter),
                  transform: `rotate(${rotation}deg)`,
                }}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={mediaUrl}
                alt=""
                style={{
                  filter: getFilterCss(filter),
                  transform: `rotate(${rotation}deg)`,
                }}
                className="w-full h-full object-contain"
              />
            )}

            {/* Overlays */}
            {textOverlays.map((t) => (
              <div
                key={t.id}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  color: t.color,
                  fontSize: `${t.fontSize}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-bold px-2 py-0.5 rounded bg-black/40 text-white select-none"
              >
                {t.text}
              </div>
            ))}

            {emojiOverlays.map((em) => (
              <div
                key={em.id}
                style={{
                  left: `${em.x}%`,
                  top: `${em.y}%`,
                  fontSize: `${em.size}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
              >
                {em.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Tool Subpanels */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800">
          {/* Filters */}
          {activeTool === "filter" && (
            <div className="py-2 space-y-1.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400">ફિલ્ટર્સ (Filters)</div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" data-testid="post-media-filter">
                {MEDIA_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl ${
                      filter === f.id ? "bg-purple-900/60 border border-purple-400" : "bg-slate-900 border border-slate-800"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${f.previewBg} grid place-items-center text-xs font-bold text-slate-800`}>
                      Aa
                    </div>
                    <span className="text-[10px] text-slate-300">{f.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Trim */}
          {activeTool === "trim" && mediaType === "video" && (
            <div className="py-2 space-y-1.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400 flex justify-between">
                <span>વિડિઓ લંબાઈ (Trim)</span>
                <span className="text-purple-400 font-bold">{trimEnd - trimStart}s</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>{trimStart}s</span>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, trimEnd - 2)}
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseInt(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
                <input
                  type="range"
                  min={trimStart + 2}
                  max={duration}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg"
                />
                <span>{trimEnd}s</span>
              </div>
            </div>
          )}

          {/* Crop */}
          {activeTool === "crop" && (
            <div className="py-2 space-y-1.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-slate-400">ક્રોપ આસ્પેક્ટ રેશિયો</div>
              <div className="flex gap-2">
                {[
                  { id: "1:1", label: "૧:૧ (ચોરસ)" },
                  { id: "4:5", label: "૪:૫ (પોર્ટ્રેટ)" },
                  { id: "16:9", label: "૧૬:૯ (લેન્ડસ્કેપ)" },
                  { id: "full", label: "ઓરિજિનલ" },
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAspectRatio(a.id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border ${
                      aspectRatio === a.id
                        ? "bg-purple-900 border-purple-400 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text input */}
          {showTextInput && (
            <div className="py-2 flex items-center gap-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="લખાણ દાખલ કરો..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddText()}
              />
              <button
                onClick={handleAddText}
                className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                ઉમેરો
              </button>
            </div>
          )}

          {/* Emoji */}
          {showEmojiPicker && (
            <div className="py-2 flex items-center gap-2 overflow-x-auto pb-1">
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

        {/* Toolbar */}
        <div className="flex items-center justify-around px-3 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
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
            data-testid="post-media-rotate"
            onClick={handleRotate}
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:text-white"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[10px]">ફેરવો</span>
          </button>

          <button
            onClick={() => {
              setShowTextInput(!showTextInput);
              setShowEmojiPicker(false);
            }}
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:text-white"
          >
            <Type className="w-4 h-4" />
            <span className="text-[10px]">લખાણ</span>
          </button>

          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowTextInput(false);
            }}
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:text-white"
          >
            <Smile className="w-4 h-4" />
            <span className="text-[10px]">ઇમોજી</span>
          </button>

          <button
            data-testid="post-music-btn"
            onClick={() => setShowMusicModal(true)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl ${selectedMusic ? "text-purple-400 font-bold" : "hover:text-white"}`}
          >
            <Music className="w-4 h-4" />
            <span className="text-[10px]">સંગીત</span>
          </button>
        </div>
      </div>

      <MusicPickerModal
        open={showMusicModal}
        onClose={() => setShowMusicModal(false)}
        selectedMusic={selectedMusic}
        onSelect={(m) => setSelectedMusic(m)}
      />
    </div>
  );
}
