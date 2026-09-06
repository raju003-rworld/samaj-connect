import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Film, Bookmark, LayoutGrid, MapPin, Calendar, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { MediaUploader, MediaPreview, isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect } from "@/components/Visibility";
import { Stories } from "@/components/social/Stories";
import { PostCard } from "@/components/social/PostCard";

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

  const submit = async () => {
    if (!content.trim() && !media.length) return toast.error("કંઈક લખો અથવા ફોટો ઉમેરો");
    setBusy(true);
    try {
      const mediaType = media.length ? (media.every(isVideoUrl) ? "reel" : media.some(isVideoUrl) ? "video" : "image") : "text";
      const { data } = await api.post("/posts", { caption: content, mediaUrls: media, mediaType, visibility: vis, eventId: event?.id || null, location });
      onCreated(data); setContent(""); setMedia([]); setEvent(null); setLocation(""); setShowLoc(false);
      toast.success(data.approved ? "પોસ્ટ થયું" : "પોસ્ટ મંજૂરી માટે મોકલાઈ");
    } catch (e) { toast.error(e?.response?.data?.detail || t("saved_fail")); }
    finally { setBusy(false); }
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
          <MediaPreview urls={media} onRemove={(i) => setMedia(media.filter((_, k) => k !== i))} />
          {showLoc && <input data-testid="post-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="સ્થળ (વૈકલ્પિક)" className="mt-2 w-full text-sm border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-300" />}
          <div className="flex items-center gap-2 mt-2 border-t border-slate-100 pt-2 flex-wrap">
            <MediaUploader kind="posts" onDone={(urls) => setMedia([...media, ...urls])} testId="post-media-upload" />
            <EventPicker value={event} onChange={setEvent} />
            <button type="button" data-testid="post-toggle-location" onClick={() => setShowLoc(!showLoc)} className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border ${showLoc ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}><MapPin className="w-3.5 h-3.5" /> સ્થળ</button>
            <VisibilitySelect testId="post-visibility" value={vis} onChange={setVis} />
            <button data-testid={IDS.postSubmit} onClick={submit} disabled={busy} className="ml-auto bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-60">{busy ? "..." : t("post")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGE = 10;

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
    fetchPage(null).then((d) => { if (!alive) return; setPosts(d.items); setCursor(d.nextCursor); setMore(!!d.nextCursor); }).finally(() => alive && setLoading(false));
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
      setPosts((x) => [...x, ...d.items.filter((n) => !x.some((o) => o.id === n.id))]);
      setCursor(d.nextCursor); setMore(!!d.nextCursor);
    }, { rootMargin: "400px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [cursor, more, loading, fetchPage]);

  useEffect(() => { if (params.get("compose")) document.querySelector(`[data-testid="${IDS.postCreateInput}"]`)?.focus(); }, [params]);

  const onChange = (np) => { setPosts((arr) => arr.map((x) => (x.id === np.id ? { ...x, ...np } : x))); if (focused?.id === np.id) setFocused({ ...focused, ...np }); };
  const onRemove = (id) => { setPosts((arr) => arr.filter((x) => x.id !== id)); if (focused?.id === id) setParams({}); };
  const onCreated = (p) => setPosts((x) => [p, ...x]);

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
        {posts.map((p) => <PostCard key={p.id} p={p} onChange={onChange} onRemove={onRemove} onCreated={onCreated} />)}
      </div>
      <div ref={sentinel} className="h-8 grid place-items-center text-slate-400" data-testid="feed-sentinel">{more && <Loader2 className="w-4 h-4 animate-spin" />}</div>
    </div>
  );
}
