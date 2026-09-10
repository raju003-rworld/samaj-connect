import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function UserListModal({ open, onOpenChange, userId, type = "followers", title }) {
  const { user, lang } = useApp();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    const endpoint = type === "followers" ? `/users/${userId}/followers` : `/users/${userId}/following`;
    api
      .get(endpoint)
      .then(({ data }) => {
        setList(data.items || []);
      })
      .catch(() => {
        toast.error("યાદી લોડ કરવામાં ક્ષતિ આવી");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, userId, type]);

  const toggleFollow = async (targetId, currentFollowing) => {
    try {
      const { data } = await api.post(`/users/${targetId}/follow`);
      setList((prev) =>
        prev.map((item) =>
          item.id === targetId ? { ...item, followedByMe: data.following } : item
        )
      );
      toast.success(data.following ? "ફોલો કરવામાં આવ્યા" : "અનફોલો કરવામાં આવ્યા");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "ક્ષતિ આવી");
    }
  };

  const defaultTitle =
    type === "followers"
      ? lang === "en"
        ? "Followers"
        : "ફોલોઅર્સ (Followers)"
      : lang === "en"
      ? "Following"
      : "ફોલોઇંગ (Following)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-5" data-testid="user-list-modal">
        <DialogHeader className="mb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Users className="w-4 h-4 text-purple-700" />
            {title || defaultTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-purple-700 mb-2" />
            <span className="text-xs">{lang === "en" ? "Loading users..." : "લોડ થઈ રહ્યું છે..."}</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {type === "followers"
              ? lang === "en"
                ? "No followers yet."
                : "હજી સુધી કોઈ ફોલોઅર્સ નથી."
              : lang === "en"
              ? "Not following anyone yet."
              : "હજી સુધી કોઈને ફોલો કર્યા નથી."}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 pr-1">
            {list.map((u) => {
              const isSelf = u.id === user?.id || u.isSelf;
              return (
                <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                  <Link
                    to={`/users/${u.id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold text-sm overflow-hidden shrink-0 border border-purple-200">
                      {u.profilePhoto ? (
                        <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (u.name?.[0] || "?").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 truncate">
                        {u.name}
                      </div>
                      {u.village && (
                        <div className="text-[11px] text-slate-500 truncate">
                          {u.village}
                        </div>
                      )}
                    </div>
                  </Link>

                  {!isSelf && (
                    <button
                      type="button"
                      data-testid={`user-list-follow-btn-${u.id}`}
                      onClick={() => toggleFollow(u.id, u.followedByMe)}
                      className={`text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1 shrink-0 ${
                        u.followedByMe
                          ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200"
                          : "bg-purple-900 hover:bg-purple-950 text-white shadow-xs"
                      }`}
                    >
                      {u.followedByMe ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{lang === "en" ? "Following" : "ફોલોઇંગ"}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>{lang === "en" ? "Follow" : "ફોલો"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
