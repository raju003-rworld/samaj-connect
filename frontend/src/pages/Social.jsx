import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Film, Bookmark, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { MediaUploader, MediaPreview, isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect } from "@/components/Visibility";
import { Stories } from "@/components/social/Stories";
import { PostCard } from "@/components/social/PostCard";

function Composer({ onCreated }) {
  const { user, t } = useApp();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [vis, setVis] = useState("samaj");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!content.trim() && !media.length) return toast.error("કંઈક લખો અથવા ફોટો ઉમેરો");
    setBusy(true);
    try {
      const mediaType = media.length ? (media.every(isVideoUrl) ? "reel" : "image") : "text";
      const { data } = await api.post("/posts", { caption: content, mediaUrls: media, mediaType, visibility: vis });
      onCreated(data); setContent(""); setMedia([]);
      toast.success(data.approved ? "પોસ્ટ થયું" : "પોસ્ટ મંજૂરી માટે મોકલાઈ");
    } catch (e) { toast.error(e?.response?.data?.detail || t("saved_fail")); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">
          {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" /> : (user?.name?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea data-testid={IDS.postCreateInput} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("whats_on_mind") + " #hashtag"} rows={2}
            className="w-full resize-none outline-none placeholder:text-slate-400 text-sm" />
          <MediaPreview urls={media} onRemove={(i) => setMedia(media.filter((_, k) => k !== i))} />
          <div className="flex items-center gap-2 mt-2 border-t border-slate-100 pt-2 flex-wrap">
            <MediaUploader kind="posts" onDone={(urls) => setMedia([...media, ...urls])} testId="post-media-upload" />
            <VisibilitySelect testId="post-visibility" value={vis} onChange={setVis} />
            <button data-testid={IDS.postSubmit} onClick={submit} disabled={busy} className="ml-auto bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-60">{busy ? "..." : t("post")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Social() {
  const { t } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("feed");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const p = tab === "reels" ? { mediaType: "reel" } : tab === "saved" ? { saved: true } : {};
      const { data } = await api.get("/posts", { params: p });
      setPosts(data.items);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);
  useEffect(() => { if (params.get("compose")) document.querySelector(`[data-testid="${IDS.postCreateInput}"]`)?.focus(); }, [params]);

  const onChange = (np) => setPosts((arr) => arr.map((x) => (x.id === np.id ? { ...x, ...np } : x)));
  const onRemove = (id) => setPosts((arr) => arr.filter((x) => x.id !== id));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl flex-1">{t("social_feed")}</h2>
        <form onSubmit={(e) => { e.preventDefault(); q.trim() && nav(`/search?q=${encodeURIComponent(q)}`); }} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5">
          <SearchIcon className="w-4 h-4 text-slate-400" />
          <input data-testid="social-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="outline-none text-sm w-28 sm:w-44 bg-transparent" />
        </form>
      </div>

      <Stories />
      <Composer onCreated={(p) => setPosts((x) => [p, ...x])} />

      <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm inline-flex">
        {[["feed", LayoutGrid, t("social")], ["reels", Film, t("reels")], ["saved", Bookmark, t("saved")]].map(([k, Icon, label]) => (
          <button key={k} data-testid={`social-tab-${k}`} onClick={() => setTab(k)} className={`text-sm font-semibold px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 ${tab === k ? "bg-purple-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton h-32" />}
      {!loading && posts.length === 0 && <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
      {posts.map((p) => <PostCard key={p.id} p={p} onChange={onChange} onRemove={onRemove} />)}
    </div>
  );
}
