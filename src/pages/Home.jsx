import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Send,
  X,
  Megaphone,
  Filter,
  Film,
  Bookmark,
  Layers,
  Building2,
  RefreshCw,
  Plus,
  Music,
  Smile,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { Stories } from "@/components/social/Stories";
import { PostCard } from "@/components/social/PostCard";
import { MediaUploader, isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect } from "@/components/Visibility";
import { MusicPickerModal } from "@/components/social/MusicPickerModal";
import { PostEditorModal } from "@/components/social/PostEditorModal";

const dedupePosts = (list) => {
  const seen = new Set();
  return (list || []).filter((p) => {
    if (!p?.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
};

export default function Home() {
  const { user, t, activeSamaj, lang } = useApp();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  // Feed Filter: "all" | "announcements" | "photos" | "reels" | "saved"
  const [tab, setTab] = useState(params.get("tab") || "all");
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Post Composer State
  const [composeOpen, setComposeOpen] = useState(params.get("compose") === "1");
  const [caption, setCaption] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [location, setLocation] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);
  const [visibility, setVisibility] = useState("samaj");
  const [posting, setPosting] = useState(false);

  // Post Creator State & Media Editing (Point 2.9 - 2.11)
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [postConfig, setPostConfig] = useState({
    filter: "normal",
    rotation: 0,
    aspectRatio: "original",
    volume: 1,
    trimStart: 0,
    trimEnd: 0,
    textOverlays: [],
    emojiOverlays: [],
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Official Announcements
  const [announcements, setAnnouncements] = useState([]);

  // Load user events for composer tagging
  useEffect(() => {
    api
      .get("/events", { params: { filter: "upcoming" } })
      .then(({ data }) => setEvents(data.items || []))
      .catch(() => {});
  }, [activeSamaj?.id]);

  // Load feed posts
  const loadFeed = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setCursor(null);
    }
    try {
      const q = { limit: 12 };
      if (!reset && cursor) q.before = cursor;
      if (tab === "saved") q.saved = true;
      if (tab === "photos") q.mediaType = "image";
      if (tab === "reels") q.mediaType = "reel";

      const { data } = await api.get("/posts", { params: q });
      let loaded = data.items || [];

      if (tab === "announcements") {
        // Filter for announcements (admin posts, all_samaj visibility, or hashtag #announcement / #જાહેરાત)
        loaded = loaded.filter(
          (p) =>
            p.visibility === "all_samaj" ||
            ["admin", "samaj_admin", "super_admin"].includes(p.authorRole) ||
            p.hashtags?.some((h) => ["announcement", "જાહેરાત", "notice"].includes(h.toLowerCase()))
        );
      }

      if (reset) {
        setItems(dedupePosts(loaded));
      } else {
        setItems((prev) => dedupePosts([...prev, ...loaded]));
      }
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } catch (e) {
      toast.error("ફીડ લોડ કરવામાં ક્ષતિ આવી");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load official announcements
  useEffect(() => {
    api
      .get("/posts", { params: { limit: 10 } })
      .then(({ data }) => {
        const ann = (data.items || []).filter(
          (p) =>
            p.visibility === "all_samaj" ||
            ["admin", "samaj_admin", "super_admin"].includes(p.authorRole) ||
            p.hashtags?.some((h) => ["announcement", "જાહેરાત"].includes(h.toLowerCase()))
        );
        setAnnouncements(ann.slice(0, 2));
      })
      .catch(() => {});
  }, [activeSamaj?.id]);

  useEffect(() => {
    loadFeed(true);
  }, [tab, activeSamaj?.id]);

  // Handle URL compose trigger and custom event
  useEffect(() => {
    const triggerCompose = () => {
      setComposeOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        const el = document.querySelector(`[data-testid="${IDS.postCreateInput}"]`);
        if (el) el.focus();
      }, 100);
    };

    if (params.get("compose") === "1") {
      triggerCompose();
    }

    window.addEventListener("samaj-open-compose", triggerCompose);
    return () => window.removeEventListener("samaj-open-compose", triggerCompose);
  }, [params]);

  // Submit new post
  const handleCreatePost = async () => {
    if (!caption.trim() && !mediaUrls.length) {
      return toast.error("કૃપા કરીને લખાણ અથવા ફોટો/વિડિયો ઉમેરો");
    }
    setPosting(true);
    try {
      const mediaType = mediaUrls.length > 0 ? (isVideoUrl(mediaUrls[0]) ? "video" : "image") : "text";
      const { data } = await api.post("/posts", {
        caption,
        mediaUrls,
        imageUrls: mediaUrls,
        mediaType,
        visibility,
        location,
        eventId: eventId || null,
        filter: postConfig.filter,
        rotation: postConfig.rotation,
        aspectRatio: postConfig.aspectRatio,
        volume: postConfig.volume,
        trimStart: postConfig.trimStart,
        trimEnd: postConfig.trimEnd,
        music: selectedMusic,
        textOverlays: postConfig.textOverlays,
        emojiOverlays: postConfig.emojiOverlays,
      });

      setItems((prev) => dedupePosts([data, ...prev]));
      setCaption("");
      setMediaUrls([]);
      setSelectedMusic(null);
      setPostConfig({
        filter: "normal",
        rotation: 0,
        aspectRatio: "original",
        volume: 1,
        trimStart: 0,
        trimEnd: 0,
        textOverlays: [],
        emojiOverlays: [],
      });
      setLocation("");
      setShowLocation(false);
      setEventId("");
      setComposeOpen(false);
      // Remove compose param from URL if present
      if (params.get("compose")) {
        params.delete("compose");
        setParams(params);
      }
      toast.success("પોસ્ટ સફળતાપૂર્વક શેર થઈ ગઈ!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "પોસ્ટ કરવામાં ક્ષતિ આવી");
    } finally {
      setPosting(false);
    }
  };

  // Intersection Observer for Infinite Scroll
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || !cursor) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && hasMore && cursor) {
          loadFeed(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor]);

  const filterTabs = [
    { key: "all", label: "તમામ (All)", icon: Layers },
    { key: "announcements", label: "જાહેરાતો (Announcements)", icon: Megaphone },
    { key: "photos", label: "ફોટોઝ (Photos)", icon: ImageIcon },
    { key: "reels", label: "રીલ્સ (Reels)", icon: Film },
    { key: "saved", label: "સેવ કરેલ (Saved)", icon: Bookmark },
  ];

  return (
    <div className="space-y-4">
      {/* 0. ACTIVE SAMAJ COMMUNITY BAR */}
      <section
        data-testid="home-active-samaj-bar"
        className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-purple-800/40 relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md grid place-items-center text-2xl shrink-0 shadow-inner">
              🏛️
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>સક્રિય સમાજ</span>
              </div>
              <div className="font-heading font-extrabold text-base sm:text-lg truncate text-white">
                {activeSamaj?.name || "શ્રી ઉમિયાનગર પાટીદાર સમાજ"}
              </div>
              <div className="text-xs text-purple-200/90 truncate font-medium">
                {activeSamaj?.village || activeSamaj?.city || "Gadhsisa · કચ્છ"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("samaj-open-switcher"))}
            className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold shrink-0 transition active:scale-95"
          >
            બદલો
          </button>
        </div>
      </section>

      {/* 1. STORIES SECTION: "તમારી સ્ટોરી" */}
      <section className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="font-heading font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 animate-pulse" />
            <span>તમારી સ્ટોરી</span>
          </div>
          <span className="text-[11px] font-semibold text-purple-800">24 કલાક અપડેટ્સ</span>
        </div>
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <Stories />
        </div>
      </section>

      {/* 2. "શું શેર કરવું છે?" LARGE CREATE POST CARD */}
      <section
        data-testid="home-create-post-card"
        className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">શું શેર કરવું છે?</h3>
          <span className="text-xs font-medium text-purple-700">નવી પોસ્ટ</span>
        </div>

        {/* Input Trigger */}
        <div
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl cursor-pointer border border-slate-200/70 transition"
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-900 grid place-items-center font-bold text-sm shrink-0 overflow-hidden border border-purple-200">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.name?.[0] || "?").toUpperCase()
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium truncate flex-1">
            તમારા સમાજ સાથે શું શેર કરશો?
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-full bg-purple-900 text-white text-xs font-semibold shadow-xs hover:bg-purple-950 transition shrink-0"
          >
            લખો
          </button>
        </div>

        {/* 4 Quick Action Pill Buttons */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
          {/* Photo */}
          <MediaUploader
            multiple={true}
            accept="image/*"
            kind="posts"
            onDone={(urls) => {
              setMediaUrls((prev) => [...prev, ...urls]);
              setComposeOpen(true);
            }}
            label={
              <span className="w-full flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold text-purple-900 bg-purple-50/80 hover:bg-purple-100 border border-purple-100 transition truncate">
                <span>📷</span>
                <span className="truncate">ફોટો</span>
              </span>
            }
            testId="quick-photo-btn"
          />

          {/* Video */}
          <MediaUploader
            multiple={true}
            accept="video/*"
            kind="posts"
            onDone={(urls) => {
              setMediaUrls((prev) => [...prev, ...urls]);
              setComposeOpen(true);
            }}
            label={
              <span className="w-full flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 transition truncate">
                <span>🎥</span>
                <span className="truncate">વિડિયો</span>
              </span>
            }
            testId="quick-video-btn"
          />

          {/* Feeling */}
          <button
            type="button"
            data-testid="quick-feeling-btn"
            onClick={() => {
              setComposeOpen(true);
              setShowEmojiPicker(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-100 transition truncate"
          >
            <span>😊</span>
            <span className="truncate">Feeling</span>
          </button>

          {/* Music */}
          <button
            type="button"
            data-testid="quick-music-btn"
            onClick={() => {
              setComposeOpen(true);
              setMusicPickerOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold text-rose-900 bg-rose-50/80 hover:bg-rose-100 border border-rose-100 transition truncate"
          >
            <span>🎵</span>
            <span className="truncate">Music</span>
          </button>
        </div>
      </section>

      {/* PREMIUM FULL-SCREEN / BOTTOM-SHEET COMPOSER MODAL */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200"
          data-testid="create-post-modal"
        >
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 py-1 px-2.5 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
                <span>← નવી પોસ્ટ</span>
              </button>
              <div className="font-heading font-extrabold text-sm text-slate-900">
                પોસ્ટ બનાવો
              </div>
              <button
                type="button"
                data-testid={IDS.postSubmit}
                onClick={handleCreatePost}
                disabled={posting || (!caption.trim() && !mediaUrls.length)}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-800 to-indigo-700 text-white text-xs font-bold shadow hover:from-purple-900 hover:to-indigo-800 disabled:opacity-40 transition active:scale-95"
              >
                {posting ? "શેરિંગ..." : "પોસ્ટ કરો"}
              </button>
            </div>

            {/* Profile Bar & Privacy */}
            <div className="p-4 pb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-900 grid place-items-center font-bold text-sm shrink-0 overflow-hidden border border-purple-200">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user?.name?.[0] || "?").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || "સમાજ સભ્ય"}
                  </div>
                  <div className="text-[11px] font-semibold text-purple-800 truncate">
                    🏛️ {activeSamaj?.name || "સમાજ પરિવાર"}
                  </div>
                </div>
              </div>

              {/* Privacy Selector */}
              <div className="shrink-0">
                <VisibilitySelect value={visibility} onChange={setVisibility} testId="post-visibility" />
              </div>
            </div>

            {/* Composer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <textarea
                data-testid={IDS.postCreateInput}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="તમારા સમાજ સાથે શું શેર કરશો? #હૅશટૅગ..."
                rows={4}
                className="w-full resize-none bg-transparent p-1 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none leading-relaxed"
                autoFocus
              />

              {/* Selected Music Banner */}
              {selectedMusic && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-2.5 text-xs text-purple-900">
                  <span className="text-lg">{selectedMusic.cover || "🎵"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{selectedMusic.title}</div>
                    <div className="text-[10px] text-purple-700 truncate">{selectedMusic.artist || "સમાજ સંગીત"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMusic(null)}
                    className="p-1 rounded-full text-purple-600 hover:text-purple-900 hover:bg-purple-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Media Previews in Composer */}
              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {mediaUrls.map((u, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-black group">
                      {isVideoUrl(u) ? (
                        <video src={u} className="w-full h-full object-cover" />
                      ) : (
                        <img src={u} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black transition shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        data-testid={`post-media-edit-${i}`}
                        onClick={() => {
                          setEditingMedia({ url: u, index: i, type: isVideoUrl(u) ? "video" : "image" });
                          setPostEditorOpen(true);
                        }}
                        className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-purple-900/90 text-white hover:bg-purple-950 text-[10px] font-semibold flex items-center gap-1 shadow"
                      >
                        <Wand2 className="w-2.5 h-2.5" /> એડિટ
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional Location Input */}
              {showLocation && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ગામ / શહેર / સ્થળ દાખલ કરો..."
                    className="w-full text-xs bg-transparent outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLocation("");
                      setShowLocation(false);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Emojis Grid */}
              {showEmojiPicker && (
                <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-purple-900 w-full mb-1">ઝડપી ઇમોજી:</span>
                  {["🙏", "🪔", "💐", "🎉", "🚩", "✨", "🌺", "❤️", "👍", "🎂", "🤝", "😇"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCaption((prev) => prev + " " + emoji)}
                      className="text-xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-white"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <MediaUploader
                  multiple={true}
                  accept="image/*"
                  kind="posts"
                  onDone={(urls) => setMediaUrls((prev) => [...prev, ...urls])}
                  label={
                    <span className="flex items-center gap-1 text-xs font-semibold text-purple-800 bg-white hover:bg-purple-50 border border-slate-200 px-3 py-1.5 rounded-full transition shadow-2xs">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-700" /> ફોટો
                    </span>
                  }
                  testId="modal-post-photo"
                />

                <MediaUploader
                  multiple={true}
                  accept="video/*"
                  kind="posts"
                  onDone={(urls) => setMediaUrls((prev) => [...prev, ...urls])}
                  label={
                    <span className="flex items-center gap-1 text-xs font-semibold text-indigo-800 bg-white hover:bg-indigo-50 border border-slate-200 px-3 py-1.5 rounded-full transition shadow-2xs">
                      <Film className="w-3.5 h-3.5 text-indigo-700" /> વિડિયો
                    </span>
                  }
                  testId="modal-post-video"
                />

                <button
                  type="button"
                  onClick={() => setMusicPickerOpen(true)}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition shadow-2xs ${
                    selectedMusic
                      ? "bg-purple-900 text-white border-purple-900"
                      : "text-purple-800 bg-white hover:bg-purple-50 border-slate-200"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>સંગીત</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition shadow-2xs"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-500" />
                  <span>ઇમોજી</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocation(!showLocation)}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition shadow-2xs ${
                    showLocation || location
                      ? "bg-purple-900 text-white border-purple-900"
                      : "text-slate-700 bg-white hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>સ્થળ</span>
                </button>
              </div>

              {/* Event Linking dropdown if any */}
              {events.length > 0 && (
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-full outline-none"
                >
                  <option value="">ઈવેન્ટ લિંક</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      📅 {ev.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Music Picker Modal */}
      {musicPickerOpen && (
        <MusicPickerModal
          open={musicPickerOpen}
          onOpenChange={setMusicPickerOpen}
          selectedTrack={selectedMusic}
          onSelectTrack={(track) => {
            setSelectedMusic(track);
            setMusicPickerOpen(false);
            toast.success("સંગીત પસંદ થયું");
          }}
        />
      )}

      {/* Post Editor Modal for Photo/Video Enhancement */}
      {postEditorOpen && editingMedia && (
        <PostEditorModal
          open={postEditorOpen}
          onOpenChange={setPostEditorOpen}
          mediaUrl={editingMedia.url}
          mediaType={editingMedia.type}
          initialConfig={postConfig}
          onSave={(edited) => {
            if (edited.mediaUrl && editingMedia.index !== undefined) {
              setMediaUrls((prev) => {
                const updated = [...prev];
                updated[editingMedia.index] = edited.mediaUrl;
                return updated;
              });
            }
            setPostConfig({
              filter: edited.filter || "normal",
              rotation: edited.rotation || 0,
              aspectRatio: edited.aspectRatio || "original",
              volume: edited.volume ?? 1,
              trimStart: edited.trimStart || 0,
              trimEnd: edited.trimEnd || 0,
              textOverlays: edited.textOverlays || [],
              emojiOverlays: edited.emojiOverlays || [],
            });
            if (edited.music) {
              setSelectedMusic(edited.music);
            }
            setPostEditorOpen(false);
            setEditingMedia(null);
            toast.success("ફેરફારો સેવ થયા");
          }}
        />
      )}

      {/* 3. PINNED OFFICIAL SAMAJ ANNOUNCEMENT BANNER */}
      {announcements.length > 0 && tab !== "reels" && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-4 text-white shadow-md shadow-purple-950/20 relative overflow-hidden">
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md grid place-items-center text-amber-300 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-purple-950">
                  સમાજ મહત્વપૂર્ણ જાહેરાત
                </span>
                <span className="text-[11px] text-purple-200 truncate">
                  {activeSamaj?.name || "સમાજ કાર્યાલય"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/95 line-clamp-2 leading-relaxed font-medium">
                {announcements[0].caption || announcements[0].content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. FEED TABS FILTER BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {filterTabs.map((ft) => {
          const isActive = tab === ft.key;
          return (
            <button
              key={ft.key}
              data-testid={`feed-filter-${ft.key}`}
              onClick={() => {
                setTab(ft.key);
                params.set("tab", ft.key);
                setParams(params);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs ${
                isActive
                  ? "bg-purple-900 text-white shadow-sm shadow-purple-900/20 scale-102"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <ft.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-purple-700"}`} />
              <span>{ft.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. MAIN SOCIAL FEED POSTS */}
      <div className="space-y-4">
        {loading && items.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 border border-slate-100 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="h-48 bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-800 grid place-items-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">હજી કોઈ પોસ્ટ નથી</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              તમારા સમાજ સાથે સુંદર યાદો, ફોટા અથવા વિચારો શેર કરનાર પ્રથમ બનો!
            </p>
            <button
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-900 text-white text-xs font-semibold shadow"
            >
              <Plus className="w-4 h-4" /> નવી પોસ્ટ બનાવો
            </button>
          </div>
        ) : (
          dedupePosts(items).map((post) => (
            <PostCard
              key={post.id}
              p={post}
              onChange={(np) => setItems((prev) => prev.map((x) => (x.id === np.id ? { ...x, ...np } : x)))}
              onRemove={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
              onCreated={(newPost) => setItems((prev) => dedupePosts([newPost, ...prev]))}
            />
          ))
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="py-6 flex items-center justify-center">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-700" />
                <span>વધુ પોસ્ટ્સ લોડ થઈ રહી છે...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
