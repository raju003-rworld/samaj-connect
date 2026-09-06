import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { PostCard } from "@/components/social/PostCard";

export default function Search() {
  const { t } = useApp();
  const q0 = new URLSearchParams(window.location.search).get("q") || "";
  const [q, setQ] = useState(q0);
  const [res, setRes] = useState({ posts: [], hashtags: [], users: [], events: [] });
  const run = async (query) => { if (!query.trim()) return; const { data } = await api.get("/search", { params: { q: query } }); setRes(data); };
  useEffect(() => { run(q0); }, [q0]);
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="flex gap-2">
        <input data-testid="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-300 text-sm" />
        <button data-testid="search-submit" className="px-4 rounded-2xl bg-purple-900 text-white text-sm font-semibold">{t("search")}</button>
      </form>
      {res.hashtags.length > 0 && <div className="flex gap-2 flex-wrap">{res.hashtags.map((h) => <button key={h.tag} data-testid={`hashtag-${h.tag}`} onClick={() => { setQ("#" + h.tag); run("#" + h.tag); }} className="text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full">#{h.tag} · {h.count}</button>)}</div>}
      {res.users.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-3 grid gap-2">
          {res.users.map((u) => <Link key={u.id} to={`/users/${u.id}`} data-testid={`user-result-${u.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2">
            <div className="w-9 h-9 rounded-full bg-purple-100 grid place-items-center font-bold text-purple-800 overflow-hidden">{u.profilePhoto ? <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" /> : u.name?.[0]}</div>
            <div><div className="text-sm font-semibold">{u.name}</div><div className="text-[11px] text-slate-500">{u.followersCount} {t("followers")}</div></div>
          </Link>)}
        </div>
      )}
      {res.events?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-3 grid gap-2">
          {res.events.map((e) => <Link key={e.id} to={`/events?event=${e.id}`} data-testid={`event-result-${e.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 grid place-items-center text-indigo-700"><Calendar className="w-4 h-4" /></div>
            <div><div className="text-sm font-semibold">{e.title}</div><div className="text-[11px] text-slate-500">{e.date}{e.location ? ` · ${e.location}` : ""}</div></div>
          </Link>)}
        </div>
      )}
      {res.posts.map((p) => <PostCard key={p.id} p={p} onChange={(np) => setRes((r) => ({ ...r, posts: r.posts.map((x) => x.id === np.id ? { ...x, ...np } : x) }))} onRemove={(id) => setRes((r) => ({ ...r, posts: r.posts.filter((x) => x.id !== id) }))} />)}
      {q && !res.posts.length && !res.users.length && <div className="text-center text-sm text-slate-500 py-8">{t("no_data")}</div>}
    </div>
  );
}
