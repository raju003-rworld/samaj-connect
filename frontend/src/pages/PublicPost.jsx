import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Heart, MessageCircle, Share2, Lock } from "lucide-react";
import { API } from "@/lib/api";
import { Media, Caption, EventCard, timeAgo } from "@/components/social/PostCard";

// Public share landing: only PUBLIC posts when public access is enabled (server-enforced). No auth required.
export default function PublicPost() {
  const { pid } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { axios.get(`${API}/public/posts/${pid}`).then(({ data }) => setP(data)).catch((e) => setErr(e?.response?.status || 500)); }, [pid]);
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-xl mx-auto space-y-4">
        <Link to="/" className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 grid place-items-center text-white font-extrabold">SC</div><span className="font-heading font-extrabold text-slate-900">SAMAJ CONNECT</span></Link>
        {err && (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center" data-testid="public-post-locked">
            <Lock className="w-8 h-8 mx-auto text-purple-700 mb-2" />
            <div className="font-semibold text-slate-900">આ પોસ્ટ જોવા માટે લોગિન જરૂરી છે</div>
            <Link to="/login" className="inline-block mt-4 bg-purple-900 text-white text-sm font-semibold px-5 py-2 rounded-full">લોગિન</Link>
          </div>
        )}
        {p && (
          <article className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm" data-testid="public-post">
            <header className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden">{p.authorPhoto ? <img src={p.authorPhoto} alt="" className="w-full h-full object-cover" /> : (p.authorName?.[0] || "?").toUpperCase()}</div>
              <div><div className="text-sm font-semibold text-slate-900">{p.authorName}</div><div className="text-[11px] text-slate-500">{timeAgo(p.createdAt)}</div></div>
            </header>
            <Caption text={p.caption} />
            <Media urls={p.mediaUrls} />
            <EventCard event={p.event} />
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {p.likesCount}</span><span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {p.commentsCount}</span><span className="flex items-center gap-1"><Share2 className="w-4 h-4" /> {p.sharesCount}</span></div>
          </article>
        )}
      </div>
    </div>
  );
}
