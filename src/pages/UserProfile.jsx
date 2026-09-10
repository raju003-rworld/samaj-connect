import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageCircle, UserPlus, UserCheck, Ban, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { PostCard } from "@/components/social/PostCard";
import { UserListModal } from "@/components/social/UserListModal";

export default function UserProfile() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { user, t, lang } = useApp();
  const [u, setU] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [userListOpen, setUserListOpen] = useState(false);
  const [userListType, setUserListType] = useState("followers");

  const load = async () => {
    try {
      const [{ data: a }, { data: b }] = await Promise.all([
        api.get(`/users/${uid}`),
        api.get("/posts", { params: { authorId: uid } }),
      ]);
      setU(a);
      setPosts(b.items || []);
    } catch {
      toast.error("પ્રોફાઇલ લોડ કરવામાં ક્ષતિ આવી");
    }
  };
  useEffect(() => {
    load();
  }, [uid]);

  const follow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/${uid}/follow`);
      const isNowFollowing = data.following;
      setU((prev) => ({
        ...prev,
        followedByMe: isNowFollowing,
        followersCount: Math.max(0, (prev?.followersCount || 0) + (isNowFollowing ? 1 : -1)),
      }));
      toast.success(
        isNowFollowing
          ? lang === "en"
            ? "Followed successfully"
            : "ફોલો કરવામાં આવ્યા"
          : lang === "en"
          ? "Unfollowed"
          : "અનફોલો કરવામાં આવ્યા"
      );
    } catch (err) {
      toast.error(err?.response?.data?.detail || "ક્ષતિ આવી");
    } finally {
      setFollowLoading(false);
    }
  };

  const openList = (type) => {
    setUserListType(type);
    setUserListOpen(true);
  };

  const chat = async () => {
    try {
      const { data } = await api.post("/conversations/direct", { userId: uid });
      nav(`/messages/${data.id}`);
    } catch (err) {
      toast.error("ચેટ શરૂ કરવામાં ક્ષતિ આવી");
    }
  };

  const block = async () => {
    try {
      const { data } = await api.post(`/users/${uid}/block`);
      setU({ ...u, blockedByMe: data.blocked });
      toast.success(data.blocked ? "બ્લોક થયું" : "અનબ્લોક થયું");
    } catch (err) {
      toast.error("બ્લોક કરવામાં ક્ષતિ આવી");
    }
  };

  const reportUser = async () => {
    const r = window.prompt("રિપોર્ટનું કારણ:");
    if (!r) return;
    try {
      await api.post("/reports", { targetType: "user", targetId: uid, reason: r });
      toast.success("રિપોર્ટ મોકલાયો");
    } catch {
      toast.error("રિપોર્ટ મોકલવામાં ક્ષતિ આવી");
    }
  };

  if (!u) return <div className="skeleton h-40 rounded-3xl" />;
  const mine = uid === user?.id;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4" data-testid="user-profile-card">
        <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-extrabold text-2xl overflow-hidden border-2 border-purple-200 shrink-0">
          {u.profilePhoto ? (
            <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            (u.name?.[0] || "?").toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-lg text-slate-900 truncate">{u.name}</div>
          {u.bio && <div className="text-sm text-slate-600 truncate">{u.bio}</div>}
          <div className="text-xs text-slate-500 mt-1.5 flex gap-4 flex-wrap items-center">
            <span>
              <b>{posts.length}</b> {t("post")}
            </span>
            <button
              type="button"
              data-testid="followers-list-btn"
              onClick={() => openList("followers")}
              className="hover:text-purple-700 transition"
            >
              <span data-testid="followers-count">
                <b>{u.followersCount || 0}</b> {t("followers")}
              </span>
            </button>
            <button
              type="button"
              data-testid="following-list-btn"
              onClick={() => openList("following")}
              className="hover:text-purple-700 transition"
            >
              <span data-testid="following-count">
                <b>{u.followingCount || 0}</b> {t("following")}
              </span>
            </button>
          </div>

          {!mine && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                data-testid={u.followedByMe ? "following-btn" : "follow-btn"}
                onClick={follow}
                disabled={followLoading}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full transition ${
                  u.followedByMe
                    ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200"
                    : "bg-purple-900 hover:bg-purple-950 text-white shadow-xs"
                }`}
              >
                {followLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : u.followedByMe ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t("following")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t("follow")}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                data-testid="message-btn"
                onClick={chat}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-300 text-purple-800 hover:bg-purple-50 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" /> {t("messages")}
              </button>
              <button
                type="button"
                data-testid="block-btn"
                onClick={block}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <Ban className="w-3.5 h-3.5" /> {u.blockedByMe ? t("unblock") : t("block")}
              </button>
              <button
                type="button"
                data-testid="report-user-btn"
                onClick={reportUser}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <Flag className="w-3.5 h-3.5" /> {t("report")}
              </button>
            </div>
          )}
        </div>
      </div>

      {posts.map((p) => (
        <PostCard
          key={p.id}
          p={p}
          onChange={(np) => setPosts((a) => a.map((x) => (x.id === np.id ? { ...x, ...np } : x)))}
          onRemove={(id) => setPosts((a) => a.filter((x) => x.id !== id))}
        />
      ))}
      {!posts.length && (
        <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-100">
          {t("no_data")}
        </div>
      )}

      {userListOpen && (
        <UserListModal
          open={userListOpen}
          onOpenChange={setUserListOpen}
          userId={uid}
          type={userListType}
        />
      )}
    </div>
  );
}
