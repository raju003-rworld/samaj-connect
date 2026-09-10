import React, { useState, useEffect } from "react";
import {
  Music,
  Play,
  Square,
  Volume2,
  VolumeX,
  Upload,
  Check,
  X,
  Sparkles,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import {
  COMMUNITY_MUSIC_TRACKS,
  playTrackPreview,
  stopTrackPreview,
} from "@/lib/audioLibrary";
import { uploadFile } from "@/lib/firebase";

export function MusicPickerModal({
  open,
  onClose,
  selectedMusic,
  onSelect,
}) {
  const [playingId, setPlayingId] = useState(null);
  const [volume, setVolume] = useState(selectedMusic?.volume ?? 0.8);
  const [activeTab, setActiveTab] = useState("community");
  const [uploading, setUploading] = useState(false);
  const [customTracks, setCustomTracks] = useState([]);

  useEffect(() => {
    return () => {
      stopTrackPreview();
    };
  }, []);

  if (!open) return null;

  const handleTogglePlay = (track) => {
    if (playingId === track.id) {
      stopTrackPreview();
      setPlayingId(null);
    } else {
      setPlayingId(track.id);
      playTrackPreview(track, volume, () => setPlayingId(null));
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (selectedMusic) {
      onSelect({ ...selectedMusic, volume: newVol });
    }
  };

  const handleChoose = (track) => {
    stopTrackPreview();
    setPlayingId(null);
    onSelect({
      id: track.id,
      title: track.title,
      artist: track.artist || "સમાજ સૂર",
      url: track.url || null,
      cover: track.cover || "🎵",
      volume,
    });
    toast.success(`સંગીત ઉમેરાયું: ${track.title}`);
    onClose();
  };

  const handleRemoveMusic = () => {
    stopTrackPreview();
    setPlayingId(null);
    onSelect(null);
    toast.info("સંગીત હટાવવામાં આવ્યું");
    onClose();
  };

  const handleCustomAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      return toast.error("કૃપા કરીને ઑડિયો ફાઈલ (MP3, WAV, M4A) પસંદ કરો");
    }

    setUploading(true);
    try {
      const url = await uploadFile(file, "music");
      const newTrack = {
        id: `user_audio_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "મારું ઑડિયો",
        url,
        duration: 30,
        cover: "🎙️",
      };
      setCustomTracks((prev) => [newTrack, ...prev]);
      handleChoose(newTrack);
    } catch (err) {
      toast.error("ઑડિયો અપલોડ નિષ્ફળ: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const allTracks = [...customTracks, ...COMMUNITY_MUSIC_TRACKS];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      data-testid="music-picker-modal"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 grid place-items-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">
                સંગીત પસંદ કરો (Background Music)
              </h3>
              <p className="text-[11px] text-slate-500">
                પરવાનગી ધરાવતું ભક્તિ, મંગલ અને ઉત્સવ સંગીત
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTrackPreview();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Volume & Remove Section if selected */}
        <div className="py-3 px-3.5 my-2.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {volume > 0 ? (
              <Volume2 className="w-4 h-4 text-purple-700 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-purple-950 font-medium mb-1">
                <span>વોલ્યુમ (Volume)</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                data-testid="music-volume-slider"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-800"
              />
            </div>
          </div>

          {selectedMusic && (
            <button
              data-testid="music-remove-btn"
              onClick={handleRemoveMusic}
              className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl shrink-0"
            >
              હટાવો (Remove)
            </button>
          )}
        </div>

        {/* Custom Audio Upload Button */}
        <div className="mb-3">
          <label className="flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-dashed border-purple-300 bg-purple-50/40 hover:bg-purple-50 cursor-pointer text-purple-900 text-xs font-semibold transition">
            <Upload className="w-4 h-4 text-purple-700" />
            <span>
              {uploading
                ? "ઑડિયો અપલોડ થઈ રહ્યો છે..."
                : "+ આપણું ઑડિયો ઉમેરો (Upload Custom Audio)"}
            </span>
            <input
              type="file"
              data-testid="music-custom-upload"
              accept="audio/*"
              className="hidden"
              disabled={uploading}
              onChange={handleCustomAudioUpload}
            />
          </label>
        </div>

        {/* Track List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {allTracks.map((tr) => {
            const isSelected = selectedMusic?.id === tr.id;
            const isPlaying = playingId === tr.id;

            return (
              <div
                key={tr.id}
                data-testid={`music-track-${tr.id}`}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-purple-50 border-purple-300"
                    : "bg-white border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleChoose(tr)}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 grid place-items-center text-lg shrink-0">
                    {tr.cover || "🎵"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {tr.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {tr.artist} · {tr.duration}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    data-testid={`music-preview-btn-${tr.id}`}
                    onClick={() => handleTogglePlay(tr)}
                    className={`w-8 h-8 rounded-full grid place-items-center text-xs transition ${
                      isPlaying
                        ? "bg-purple-900 text-white animate-pulse"
                        : "bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-900"
                    }`}
                    title={isPlaying ? "રોકો" : "સાંભળો"}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>

                  <button
                    data-testid={`music-select-btn-${tr.id}`}
                    onClick={() => handleChoose(tr)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? "bg-purple-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-purple-900 hover:text-white"
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : "પસંદ કરો"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-600" /> કૉપીરાઇટ મુક્ત સમાજ સંગીત
          </span>
          <button
            onClick={() => {
              stopTrackPreview();
              onClose();
            }}
            className="text-xs font-semibold text-purple-900 hover:underline"
          >
            બંધ કરો
          </button>
        </div>
      </div>
    </div>
  );
}
