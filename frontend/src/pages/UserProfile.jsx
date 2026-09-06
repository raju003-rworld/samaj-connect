import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageCircle, UserPlus, UserCheck, Ban, Flag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { PostCard } from "@/components/social/PostCard";

export default function UserProfile() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { user, t } = useApp();
  const [u, setU] = useState(null);
  const [posts, setPosts] = useState([]);

  const load = async () => {
    const [{ data: a }, { data: b }] = await Promise.all([api.get(`/users/${uid}`), api.get("/posts", { params: { authorId: uid } })]);
    setU(a); setPosts(b.items);
  };
  useEffect(() => { load(); }, [uid]);

  const follow = async () => { const { data } = await api.post(`/users/${uid}/follow`); setU({ ...u, followedByMe: data.following, followersCount: u.followersCount + (data.following ? 1 : -1) }); };
  const chat = async () => { const { data } = await api.post("/conversations/direct", { userId: uid }); nav(`/messages/${data.id}`); };
  const block = async () => { const { data } = await api.post(`/users/${uid}/block`); setU({ ...u, blockedByMe: data.blocked }); toast.success(data.blocked ? "બ્લોક થયું" : "અનબ્લોક થયું"); };
  const reportUser = async () => { const r = window.prompt("રિપોર્ટનું કારણ:"); if (!r) return; await api.post("/reports", { targetType: "user", targetId: uid, reason: r }); toast.success("રિપોર્ટ મોકલાયો"); };

  if (!u) return <div className="skeleton h-40" />;
  const mine = uid === user?.id;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4" data-testid="user-profile-card">
        <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-extrabold text-2xl overflow-hidden border-2 border-purple-200">
          {u.profilePhoto ? <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-lg text-slate-900 truncate">{u.name}</div>
          {u.bio && <div className="text-sm text-slate-600">{u.bio}</div>}
          <div className="text-xs text-slate-500 mt-1 flex gap-3"><span><b>{posts.length}</b> {t("post")}</span><span data-testid="followers-count"><b>{u.followersCount}</b> {t("followers")}</span><span><b>{u.followingCount}</b> {t("following")}</span></div>
          {!mine && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <button data-testid="follow-btn" onClick={follow} className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${u.followedByMe ? "bg-slate-100 text-slate-700" : "bg-purple-900 text-white"}`}>
                {u.followedByMe ? <><UserCheck className="w-3.5 h-3.5" /> {t("following")}</> : <><UserPlus className="w-3.5 h-3.5" /> {t("follow")}</>}
              </button>
              <button data-testid="message-btn" onClick={chat} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-300 text-purple-800"><MessageCircle className="w-3.5 h-3.5" /> {t("messages")}</button>
              <button data-testid="block-btn" onClick={block} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600"><Ban className="w-3.5 h-3.5" /> {u.blockedByMe ? t("unblock") : t("block")}</button>
              <button data-testid="report-user-btn" onClick={reportUser} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600"><Flag className="w-3.5 h-3.5" /> {t("report")}</button>
            </div>
          )}
        </div>
      </div>
      {posts.map((p) => <PostCard key={p.id} p={p} onChange={(np) => setPosts((a) => a.map((x) => x.id === np.id ? { ...x, ...np } : x))} onRemove={(id) => setPosts((a) => a.filter((x) => x.id !== id))} />)}
      {!posts.length && <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
    </div>
  );
}
