import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Pencil,
  LogOut,
  Newspaper,
  Calendar,
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronRight,
  Save,
  Grid,
  Film,
  Bookmark,
  Building2,
  TreeDeciduous,
  FileText,
  ShoppingBag,
  Store,
  Share2,
  Users,
  Sparkles,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { MediaUploader, isVideoUrl } from "@/components/MediaUploader";
import { PostCard } from "@/components/social/PostCard";
import { UserListModal } from "@/components/social/UserListModal";

export default function Profile() {
  const { user, updateUser, logout, t, isMod, activeSamaj } = useApp();
  const nav = useNavigate();

  // Active Tab: "posts" | "reels" | "events" | "saved" | "modules"
  const [tab, setTab] = useState("posts");
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({
    name: user?.name || "",
    village: user?.village || "",
    district: user?.district || "",
    bio: user?.bio || "",
    profilePhoto: user?.profilePhoto || "",
  });

  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userListOpen, setUserListOpen] = useState(false);
  const [userListType, setUserListType] = useState("followers");

  // Sync profile data
  useEffect(() => {
    if (user) {
      setF({
        name: user?.name || "",
        village: user?.village || "",
        district: user?.district || "",
        bio: user?.bio || "",
        profilePhoto: user?.profilePhoto || "",
      });
    }
  }, [user]);

  // Load user content: posts, saved, events
  const loadUserContent = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [postsRes, savedRes, eventsRes, userRes] = await Promise.all([
        api.get("/posts", { params: { authorId: user.id } }).catch(() => ({ data: { items: [] } })),
        api.get("/posts", { params: { saved: true } }).catch(() => ({ data: { items: [] } })),
        api.get("/events", { params: { filter: "mine" } }).catch(() => ({ data: { items: [] } })),
        api.get(`/users/${user.id}`).catch(() => null),
      ]);
      setMyPosts(postsRes.data.items || []);
      setSavedPosts(savedRes.data.items || []);
      setMyEvents(eventsRes.data.items || []);
      if (userRes?.data) {
        updateUser(userRes.data);
      }
    } catch {
      // silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserContent();
  }, [user?.id]);

  const save = async () => {
    try {
      const { data } = await api.patch("/auth/me", f);
      updateUser(data);
      toast.success(t("saved_ok"));
      setEdit(false);
      loadVerif();
    } catch {
      toast.error(t("saved_fail"));
    }
  };

  // ---- Profile Verification (Task 4) ----
  const [verif, setVerif] = useState(null);
  const loadVerif = async () => {
    try {
      const { data } = await api.get("/verification/status");
      setVerif(data);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    loadVerif();
  }, [user?.id]);
  const submitVerification = async () => {
    try {
      const { data } = await api.post("/verification/submit");
      setVerif(data);
      toast.success("વેરિફિકેશન માટે સબમિટ થયું (Submitted for review)");
    } catch (e) {
      const d = e?.response?.data;
      if (d?.missingFields?.length) {
        toast.error("અધૂરી પ્રોફાઇલ: " + d.missingFields.join(", "));
        setEdit(true);
      } else {
        toast.error(d?.detail || "Submit failed");
      }
      if (d?.verificationState) setVerif(d);
    }
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/users/${user?.id}`;
    if (navigator.share) {
      navigator.share({ title: user?.name, text: `${user?.name} on SAMAJ CONNECT`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("પ્રોફાઇલ લિંક કોપી થઈ!");
    }
  };

  const myReels = myPosts.filter((p) => p.mediaType === "reel" || (p.mediaUrls && p.mediaUrls.some(isVideoUrl)));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. INSTAGRAM-STYLE PROFILE HEADER */}
      <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar with Story-style Gradient Border */}
          <div className="relative mx-auto sm:mx-0">
            <div className="w-22 h-22 rounded-full p-[3px] bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-amber-400 shadow-md">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-purple-100 text-purple-900 grid place-items-center font-extrabold text-3xl overflow-hidden">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user?.name?.[0] || "?").toUpperCase()
                  )}
                </div>
              </div>
            </div>
            <button
              data-testid="profile-edit-toggle"
              onClick={() => setEdit(!edit)}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-900 text-white shadow hover:bg-purple-950 transition"
              title="Edit Profile"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Details & Stats Bar */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-extrabold text-slate-900 text-xl tracking-tight truncate">
                  {user?.name || "સમાજ સભ્ય"}
                </h2>
                <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {user?.phone}
                  </span>
                  {(user?.village || user?.district) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {[user?.village, user?.district].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Samaj Badge */}
              <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold self-center sm:self-auto">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span className="truncate max-w-[140px]">{activeSamaj?.name || "સમાજ"}</span>
              </div>
            </div>

            {/* Bio */}
            {user?.bio && (
              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed font-medium">
                {user?.bio}
              </p>
            )}

            {/* Social Stats Counters */}
            <div className="flex items-center justify-around sm:justify-start sm:gap-8 mt-4 pt-3 border-t border-slate-100">
              <div className="text-center sm:text-left">
                <span className="block font-heading font-extrabold text-base text-slate-900 leading-none">
                  {myPosts.length}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">{t("my_posts")}</span>
              </div>
              <button
                type="button"
                data-testid="my-followers-btn"
                onClick={() => {
                  setUserListType("followers");
                  setUserListOpen(true);
                }}
                className="text-center sm:text-left group cursor-pointer"
              >
                <span className="block font-heading font-extrabold text-base text-slate-900 leading-none group-hover:text-purple-700 transition">
                  {user?.followersCount || 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block group-hover:text-purple-700 transition">
                  {t("followers")}
                </span>
              </button>
              <button
                type="button"
                data-testid="my-following-btn"
                onClick={() => {
                  setUserListType("following");
                  setUserListOpen(true);
                }}
                className="text-center sm:text-left group cursor-pointer"
              >
                <span className="block font-heading font-extrabold text-base text-slate-900 leading-none group-hover:text-purple-700 transition">
                  {user?.followingCount || 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block group-hover:text-purple-700 transition">
                  {t("following")}
                </span>
              </button>
            </div>

            {/* Action Buttons: Edit Profile & Share */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setEdit(!edit)}
                className="flex-1 py-1.5 px-3 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition border border-purple-200"
              >
                {t("edit_profile")}
              </button>
              <button
                onClick={handleShareProfile}
                className="py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                title="Share Profile"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>શેર</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Verification (Task 4) */}
        {verif && (
          <div data-testid="verification-card" className="mt-4 rounded-2xl border border-slate-200 p-3.5">
            {verif.verificationState === "VERIFIED" && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>ચકાસાયેલ પ્રોફાઇલ (Verified)</span>
              </div>
            )}
            {verif.verificationState === "VERIFICATION_PENDING" && (
              <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>વેરિફિકેશન સમીક્ષા હેઠળ છે (Pending review)</span>
              </div>
            )}
            {verif.verificationState === "REJECTED" && (
              <div className="space-y-2">
                <div className="text-red-600 text-sm font-semibold">વેરિફિકેશન નકારાયું (Rejected)</div>
                {verif.rejectionReason && (
                  <div data-testid="rejection-reason" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                    કારણ: {verif.rejectionReason}
                  </div>
                )}
                <button
                  data-testid="resubmit-verification-btn"
                  onClick={submitVerification}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                >
                  પ્રોફાઇલ સુધારીને ફરી સબમિટ કરો (Resubmit)
                </button>
              </div>
            )}
            {verif.verificationState === "PROFILE_INCOMPLETE" && (
              <div className="space-y-2">
                <div className="text-slate-700 text-sm font-semibold">પ્રોફાઇલ ચકાસણી (Not verified)</div>
                {verif.profileComplete ? (
                  <button
                    data-testid="submit-verification-btn"
                    onClick={submitVerification}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    વેરિફિકેશન માટે સબમિટ કરો (Submit for verification)
                  </button>
                ) : (
                  <div className="text-xs text-slate-500">
                    સબમિટ કરતાં પહેલાં જરૂરી માહિતી પૂર્ણ કરો{verif.missingFields?.length ? `: ${verif.missingFields.join(", ")}` : ""}.{" "}
                    <button onClick={() => setEdit(true)} className="text-purple-600 font-semibold underline">પ્રોફાઇલ સુધારો</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* Edit Profile Drawer / Form */}
        {edit && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">પ્રોફાઇલ વિગતો સુધારો:</span>
              <button onClick={() => setEdit(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                data-testid="profile-name"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                placeholder={t("name") || "નામ"}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
              <input
                data-testid="profile-village"
                value={f.village}
                onChange={(e) => setF({ ...f, village: e.target.value })}
                placeholder={t("village") || "ગામ"}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
              <input
                data-testid="profile-district"
                value={f.district}
                onChange={(e) => setF({ ...f, district: e.target.value })}
                placeholder={t("district") || "જિલ્લો"}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
              <input
                data-testid="profile-bio"
                value={f.bio}
                onChange={(e) => setF({ ...f, bio: e.target.value })}
                placeholder="બાયો (Bio / વ્યવસાય)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
            </div>

            {/* Profile Photo Uploader */}
            <div className="flex items-center gap-3 pt-1">
              <MediaUploader
                multiple={false}
                accept="image/*"
                kind="profile"
                onDone={(u) => setF({ ...f, profilePhoto: u[0] })}
                label={t("profile_photo_url") || "પ્રોફાઇલ ફોટો બદલો"}
                testId="profile-photo-upload"
              />
              {f.profilePhoto && (
                <img src={f.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border" />
              )}
            </div>

            <button
              data-testid="profile-save"
              onClick={save}
              className="w-full py-2.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold flex items-center justify-center gap-2 text-sm shadow transition"
            >
              <Save className="w-4 h-4" /> {t("save")}
            </button>
          </div>
        )}
      </section>

      {/* 2. PROFILE TABS (Instagram Style): Posts | Reels | Events | Saved | Community Modules */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white rounded-2xl px-2 py-1 shadow-xs overflow-x-auto scrollbar-none">
        {[
          { k: "posts", label: t("my_posts"), icon: Grid },
          { k: "reels", label: t("reels"), icon: Film },
          { k: "events", label: t("my_events"), icon: Calendar },
          { k: "saved", label: t("saved"), icon: Bookmark },
          { k: "modules", label: "સમાજ સુવિધાઓ", icon: Building2 },
        ].map((it) => {
          const isActive = tab === it.k;
          return (
            <button
              key={it.k}
              onClick={() => setTab(it.k)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? "bg-purple-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-purple-900 hover:bg-purple-50"
              }`}
            >
              <it.icon className="w-3.5 h-3.5" />
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}
      {tab === "posts" && (
        <div className="space-y-3">
          {myPosts.length > 0 ? (
            myPosts.map((p) => (
              <PostCard
                key={p.id}
                p={p}
                onChange={(np) => setMyPosts((prev) => prev.map((x) => (x.id === np.id ? { ...x, ...np } : x)))}
                onRemove={(id) => setMyPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          ) : (
            <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-3xl border border-slate-100">
              <Newspaper className="w-10 h-10 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-700">હજી કોઈ પોસ્ટ નથી</p>
              <button
                onClick={() => nav("/home?compose=1")}
                className="mt-2 text-xs font-bold text-purple-900 underline"
              >
                + નવી પોસ્ટ બનાવો
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "reels" && (
        <div>
          {myReels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {myReels.map((r) => (
                <div
                  key={r.id}
                  onClick={() => nav(`/social?post=${r.id}`)}
                  className="aspect-[9/16] rounded-2xl overflow-hidden bg-black relative group cursor-pointer shadow-xs"
                >
                  {r.mediaUrls?.[0] && isVideoUrl(r.mediaUrls[0]) ? (
                    <video src={r.mediaUrls[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-950 to-indigo-950 p-3 text-white text-xs flex items-center justify-center">
                      {r.caption}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-[11px] text-white font-bold drop-shadow flex items-center gap-1">
                    ❤️ {r.likesCount || 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-3xl border border-slate-100">
              <Film className="w-10 h-10 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-700">હજી કોઈ રીલ્સ નથી</p>
              <button
                onClick={() => nav("/reels")}
                className="mt-2 text-xs font-bold text-purple-900 underline"
              >
                + રીલ્સ એક્સપ્લોર કરો
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-3">
          {myEvents.length > 0 ? (
            myEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => nav(`/events?event=${ev.id}`)}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-purple-50/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 grid place-items-center font-bold text-sm shrink-0">
                    {ev.date ? new Date(ev.date).getDate() : "EV"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                    <p className="text-xs text-slate-500">
                      {ev.date} · {ev.location || "સમાજ"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-3xl border border-slate-100">
              <Calendar className="w-10 h-10 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-700">કોઈ ઈવેન્ટ્સ રજિસ્ટર નથી</p>
              <button
                onClick={() => nav("/events")}
                className="mt-2 text-xs font-bold text-purple-900 underline"
              >
                ઈવેન્ટ્સ જુઓ
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="space-y-3">
          {savedPosts.length > 0 ? (
            savedPosts.map((p) => (
              <PostCard
                key={p.id}
                p={p}
                onChange={(np) => setSavedPosts((prev) => prev.map((x) => (x.id === np.id ? { ...x, ...np } : x)))}
                onRemove={(id) => setSavedPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          ) : (
            <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-3xl border border-slate-100">
              <Bookmark className="w-10 h-10 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-700">કોઈ સેવ કરેલ પોસ્ટ્સ નથી</p>
            </div>
          )}
        </div>
      )}

      {tab === "modules" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
          <button
            onClick={() => nav("/coming-soon?m=family")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <TreeDeciduous className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">ફેમિલી ટ્રી (Family Tree)</div>
                <div className="text-[11px] text-slate-500">તમારા પરિવારની ડિજિટલ વંશાવલિ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => nav("/hall")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">હોલ બુકિંગ (Hall Booking)</div>
                <div className="text-[11px] text-slate-500">વાર્ષિક અને શુભ પ્રસંગો માટે બુકિંગ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => nav("/coming-soon?m=docs")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">સમાજ દસ્તાવેજો (Documents)</div>
                <div className="text-[11px] text-slate-500">બંધારણ, નિયમાવલી અને ફોર્મ્સ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => nav("/coming-soon?m=orders")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">મીઠાઈ & પ્રસાદ ઓર્ડર (Orders)</div>
                <div className="text-[11px] text-slate-500">તહેવાર પ્રસાદ વિતરણ ઓર્ડર</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => nav("/coming-soon?m=business")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">બિઝનેસ & ક્લાસિફાઇડ્સ</div>
                <div className="text-[11px] text-slate-500">સમાજ સભ્યોના વ્યવસાય અને જાહેરાતો</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {isMod && (
            <button
              data-testid={IDS.adminPanelBtn}
              onClick={() => nav("/admin")}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t("admin")}</div>
                  <div className="text-[11px] text-purple-700 font-medium">સમાજ વહીવટી નિયંત્રણ</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          <button
            data-testid="profile-settings"
            onClick={() => toast.info("સેટિંગ્સ ટૂંક સમયમાં")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium text-slate-800">{t("settings")}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            data-testid="profile-help"
            onClick={() => nav("/coming-soon?m=help")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 grid place-items-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium text-slate-800">{t("help")}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            data-testid="profile-logout"
            onClick={async () => {
              await logout();
              nav("/login");
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-rose-50 text-rose-600 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 grid place-items-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold">{t("logout")}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      )}

      {userListOpen && (
        <UserListModal
          open={userListOpen}
          onOpenChange={setUserListOpen}
          userId={user?.id}
          type={userListType}
        />
      )}
    </div>
  );
}
