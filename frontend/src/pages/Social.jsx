import React, { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Send, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";

const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

function Comments({ postId }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const { user, t } = useApp();

  useEffect(() => { api.get(`/posts/${postId}/comments`).then(({ data }) => setItems(data.items)); }, [postId]);

  const add = async () => {
    if (!text.trim()) return;
    const { data } = await api.post(`/posts/${postId}/comments`, { content: text });
    setItems((x) => [...x, data]);
    setText("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      {items.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 grid place-items-center text-xs font-bold shrink-0">{(c.authorName?.[0] || "?").toUpperCase()}</div>
          <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2">
            <div className="text-xs font-semibold text-slate-800">{c.authorName}</div>
            <div className="text-sm text-slate-700">{c.content}</div>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 grid place-items-center text-xs font-bold">{(user?.name?.[0] || "?").toUpperCase()}</div>
        <input
          data-testid={`comment-input-${postId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("write_comment")}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button data-testid={`comment-submit-${postId}`} onClick={add} className="p-2 rounded-full bg-purple-900 text-white"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export default function Social() {
  const { user, t } = useApp();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/posts");
      setPosts(data.items);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!content.trim()) return toast.error("કંઈક લખો");
    const { data } = await api.post("/posts", { content, imageUrls: imageUrl ? [imageUrl] : [] });
    setPosts((p) => [data, ...p]);
    setContent(""); setImageUrl("");
    toast.success("પોસ્ટ થયું");
  };

  const like = async (p) => {
    const { data } = await api.post(`/posts/${p.id}/like`);
    setPosts((arr) => arr.map((x) => (x.id === p.id ? data : x)));
  };

  const del = async (p) => {
    if (!window.confirm("Delete post?")) return;
    await api.delete(`/posts/${p.id}`);
    setPosts((arr) => arr.filter((x) => x.id !== p.id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("social_feed")}</h2>

      {/* Composer */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">
            {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover"/> : (user?.name?.[0] || "?").toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              data-testid={IDS.postCreateInput}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("whats_on_mind")}
              rows={2}
              className="w-full resize-none outline-none placeholder:text-slate-400 text-sm"
            />
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 max-h-56 rounded-xl border border-slate-200 object-cover" onError={() => setImageUrl("")} />
            )}
            <div className="flex items-center justify-between mt-2 border-t border-slate-100 pt-2">
              <input
                data-testid="post-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="text-xs bg-slate-50 rounded-full px-3 py-1.5 border border-slate-200 outline-none w-40 sm:w-56"
              />
              <button data-testid={IDS.postSubmit} onClick={submit} className="bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold px-4 py-1.5 rounded-full">{t("post")}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading && <div className="skeleton h-32" />}
      {!loading && posts.length === 0 && (
        <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>
      )}
      {posts.map((p) => (
        <article key={p.id} data-testid={`post-card-${p.id}`} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">
              {p.authorPhoto ? <img src={p.authorPhoto} alt="" className="w-full h-full object-cover" /> : (p.authorName?.[0] || "?").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{p.authorName}</div>
              <div className="text-[11px] text-slate-500">{timeAgo(p.createdAt)}</div>
            </div>
            {p.authorId === user?.id && (
              <button data-testid={`post-delete-${p.id}`} onClick={() => del(p)} className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
            )}
          </header>
          <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">{p.content}</p>
          {p.imageUrls?.[0] && (
            <img src={p.imageUrls[0]} alt="" className="mt-3 w-full max-h-96 object-cover rounded-2xl border border-slate-100" />
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
            <button data-testid={`post-like-${p.id}`} onClick={() => like(p)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${p.likedByMe ? "bg-rose-50 text-rose-600" : "text-slate-600 hover:bg-slate-50"}`}>
              <Heart className={`w-4 h-4 ${p.likedByMe ? "fill-current" : ""}`} /> {p.likesCount || 0}
            </button>
            <button data-testid={`post-comments-${p.id}`} onClick={() => setOpenComments((s) => ({ ...s, [p.id]: !s[p.id] }))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50">
              <MessageCircle className="w-4 h-4" /> {p.commentsCount || 0}
            </button>
            <button data-testid={`post-share-${p.id}`} onClick={() => navigator.share?.({ text: p.content }).catch(() => {})} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50">
              <Share2 className="w-4 h-4" /> {t("share")}
            </button>
          </div>
          {openComments[p.id] && <Comments postId={p.id} />}
        </article>
      ))}
    </div>
  );
}
