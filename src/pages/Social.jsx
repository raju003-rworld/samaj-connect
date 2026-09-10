import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Film, Bookmark, LayoutGrid, MapPin, Calendar, X, Loader2, TrendingUp, Music, Smile, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { MediaUploader, MediaPreview, isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect } from "@/components/Visibility";
import { Stories } from "@/components/social/Stories";
import { PostCard } from "@/components/social/PostCard";
import { MusicPickerModal } from "@/components/social/MusicPickerModal";
import { PostEditorModal } from "@/components/social/PostEditorModal";

function EventPicker({ value, onChange }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (open && !list.length) api.get("/events", { params: { filter: "upcoming" } }).then(({ data }) => setList(data.items)); }, [open, list.length]);
  if (value) return (
    <span data-testid="post-event-selected" className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-full">
      <Calendar className="w-3.5 h-3.5" /> {value.title} <button onClick={() => onChange(null)}><X className="w-3 h-3" /></button>
    </span>
  );
  return (
    <div className="relative">
      <button type="button" data-testid="post-attach-event" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full"><Calendar className="w-3.5 h-3.5" /> ઈવેન્ટ</button>
      {open && (
        <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg w-64 max-h-56 overflow-y-auto z-20 py-1">
          {list.map((e) => <button key={e.id} data-testid={`post-event-option-${e.id}`} onClick={() => { onChange(e); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"><div className="font-medium truncate">{e.title}</div><div className="text-[11px] text-slate-500">{e.date}</div></button>)}
          {!list.length && <div className="text-xs text-slate-500 px-3 py-3">કોઈ આગામી ઈવેન્ટ નથી</div>}
        </div>
      )}
    </div>
  );
}

function Composer({ onCreated }) {
  const { user, t } = useApp();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [vis, setVis] = useState("samaj");
  const [event, setEvent] = useState(null);
  const [location, setLocation] = useState("");
  const [showLoc, setShowLoc] = useState(false);
  const [busy, setBusy] = useState(false);

  // Music & Post Editing
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

  const submit = async () => {
    if (!content.trim() && !media.length) return toast.error("કંઈક લખો અથવા ફોટો ઉમેરો");
    setBusy(true);
    try {
      const mediaType = media.length ? (media.every(isVideoUrl) ? "reel" : media.some(isVideoUrl) ? "video" : "image") : "text";
      const { data } = await api.post("/posts", {
        caption: content,
        mediaUrls: media,
        imageUrls: media,
        mediaType,
        visibility: vis,
        eventId: event?.id || null,
        location,
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
      onCreated(data);
      setContent("");
      setMedia([]);
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
      setEvent(null);
      setLocation("");
      setShowLoc(false);
      toast.success(data.approved ? "પોસ્ટ થયું" : "પોસ્ટ મંજૂરી માટે મોકલાઈ");
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("saved_fail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm" data-testid="post-composer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden shrink-0">
          {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" /> : (user?.name?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <textarea data-testid={IDS.postCreateInput} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("whats_on_mind") + " #hashtag"} rows={2}
            className="w-full resize-none outline-none placeholder:text-slate-400 text-sm" />
          <MediaPreview
            urls={media}
            onRemove={(i) => setMedia(media.filter((_, k) => k !== i))}
            onEdit={(u, i) => {
              setEditingMedia({ url: u, index: i, type: isVideoUrl(u) ? "video" : "image" });
              setPostEditorOpen(true);
            }}
          />
          {selectedMusic && (
            <div className="flex items-center gap-2 mt-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-purple-900">
              <span className="text-base">{selectedMusic.cover || "🎵"}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{selectedMusic.title}</div>
                <div className="text-[10px] text-purple-700 truncate">{selectedMusic.artist || "સમાજ સંગીત"}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMusic(null)}
                className="p-1 text-purple-600 hover:text-purple-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {showLoc && <input data-testid="post-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="સ્થળ (વૈકલ્પિક)" className="mt-2 w-full text-sm border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-300" />}
          <div className="flex items-center gap-2 mt-2 border-t border-slate-100 pt-2 flex-wrap">
            <MediaUploader kind="posts" onDone={(urls) => setMedia([...media, ...urls])} testId="post-media-upload" />
            <button
              type="button"
              data-testid="post-music-btn"
              onClick={() => setMusicPickerOpen(true)}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                selectedMusic ? "bg-purple-900 text-white border-purple-900" : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              {selectedMusic ? <span className="max-w-[80px] truncate">{selectedMusic.title}</span> : "સંગીત"}
            </button>
            <div className="relative">
              <button
                type="button"
                data-testid="post-emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition"
              >
                <Smile className="w-3.5 h-3.5 text-amber-500" /> ઇમોજી
              </button>
              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-1 p-2 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center gap-1.5 z-30">
                  {["🙏", "🪔", "💐", "🎉", "🚩", "✨", "🌺", "❤️", "👍", "🎂"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setContent((prev) => prev + " " + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <EventPicker value={event} onChange={setEvent} />
            <button type="button" data-testid="post-toggle-location" onClick={() => setShowLoc(!showLoc)} className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border ${showLoc ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}><MapPin className="w-3.5 h-3.5" /> સ્થળ</button>
            <VisibilitySelect testId="post-visibility" value={vis} onChange={setVis} />
            <button data-testid={IDS.postSubmit} onClick={submit} disabled={busy} className="ml-auto bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-60">{busy ? "..." : t("post")}</button>
          </div>
        </div>
      </div>

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

      {postEditorOpen && editingMedia && (
        <PostEditorModal
          open={postEditorOpen}
          onOpenChange={setPostEditorOpen}
          mediaUrl={editingMedia.url}
          mediaType={editingMedia.type}
          initialConfig={postConfig}
          onSave={(edited) => {
            if (edited.mediaUrl && editingMedia.index !== undefined) {
              setMedia((prev) => {
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
    </div>
  );
}

const PAGE = 10;

const dedupePosts = (list) => {
  const seen = new Set();
  return (list || []).filter((p) => {
    if (!p?.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
};

function Trending() {
  const nav = useNavigate();
  const [tags, setTags] = useState([]);
  useEffect(() => { api.get("/hashtags/trending").then(({ data }) => setTags(data.items)).catch(() => {}); }, []);
  if (!tags.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" data-testid="trending-hashtags">
      <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-purple-700" /> ટ્રેન્ડિંગ</span>
      {tags.map((h) => <button key={h.tag} data-testid={`trending-${h.tag}`} onClick={() => nav(`/search?q=${encodeURIComponent("#" + h.tag)}`)} className="shrink-0 text-xs font-semibold bg-white border border-purple-200 text-purple-800 px-3 py-1 rounded-full hover:bg-purple-50">#{h.tag} <span className="text-slate-400">{h.count}</span></button>)}
    </div>
  );
}

export default function Social() {
  const { t } = useApp();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("feed");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(null);
  const sentinel = useRef();
  const focusId = params.get("post");

  const fetchPage = useCallback(async (before) => {
    const p = { limit: PAGE, ...(before ? { before } : {}), ...(tab === "reels" ? { mediaType: "reel" } : tab === "saved" ? { saved: true } : {}) };
    const { data } = await api.get("/posts", { params: p });
    return data;
  }, [tab]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setPosts([]); setCursor(null);
    fetchPage(null).then((d) => { if (!alive) return; setPosts(dedupePosts(d.items)); setCursor(d.nextCursor); setMore(!!d.nextCursor); }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [fetchPage]);

  useEffect(() => {
    if (!focusId) return setFocused(null);
    api.get(`/posts/${focusId}`).then(({ data }) => setFocused(data)).catch(() => toast.error("પોસ્ટ મળી નહીં"));
  }, [focusId]);

  useEffect(() => {
    if (!sentinel.current || !more || loading) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || !cursor) return;
      io.disconnect();
      const d = await fetchPage(cursor);
      setPosts((x) => dedupePosts([...x, ...(d.items || [])]));
      setCursor(d.nextCursor); setMore(!!d.nextCursor);
    }, { rootMargin: "400px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [cursor, more, loading, fetchPage]);

  useEffect(() => { if (params.get("compose")) document.querySelector(`[data-testid="${IDS.postCreateInput}"]`)?.focus(); }, [params]);

  const onChange = (np) => { setPosts((arr) => arr.map((x) => (x.id === np.id ? { ...x, ...np } : x))); if (focused?.id === np.id) setFocused({ ...focused, ...np }); };
  const onRemove = (id) => { setPosts((arr) => arr.filter((x) => x.id !== id)); if (focused?.id === id) setParams({}); };
  const onCreated = (p) => setPosts((x) => dedupePosts([p, ...x]));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl flex-1">{t("social_feed")}</h2>
        <form onSubmit={(e) => { e.preventDefault(); q.trim() && nav(`/search?q=${encodeURIComponent(q)}`); }} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5">
          <SearchIcon className="w-4 h-4 text-slate-400" />
          <input data-testid="social-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="outline-none text-sm w-28 sm:w-44 bg-transparent" />
        </form>
      </div>

      {focused && (
        <div className="space-y-2" data-testid="focused-post">
          <button data-testid="focused-post-close" onClick={() => setParams({})} className="text-xs font-semibold text-purple-800 flex items-center gap-1"><X className="w-3.5 h-3.5" /> ફીડ પર પાછા</button>
          <PostCard p={focused} onChange={onChange} onRemove={onRemove} onCreated={onCreated} autoOpenComments />
        </div>
      )}

      <Stories />
      <Trending />
      <Composer onCreated={onCreated} />

      <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm inline-flex">
        {[["feed", LayoutGrid, t("social")], ["reels", Film, t("reels")], ["saved", Bookmark, t("saved")]].map(([k, Icon, label]) => (
          <button key={k} data-testid={`social-tab-${k}`} onClick={() => setTab(k)} className={`text-sm font-semibold px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 ${tab === k ? "bg-purple-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading && <div className="space-y-3"><div className="skeleton h-40 rounded-3xl" /><div className="skeleton h-40 rounded-3xl" /></div>}
      {!loading && posts.length === 0 && <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
      <div className="space-y-4" data-testid="social-feed">
        {dedupePosts(posts).map((p) => <PostCard key={p.id} p={p} onChange={onChange} onRemove={onRemove} onCreated={onCreated} />)}
      </div>
      <div ref={sentinel} className="h-8 grid place-items-center text-slate-400" data-testid="feed-sentinel">{more && <Loader2 className="w-4 h-4 animate-spin" />}</div>
    </div>
  );
}
