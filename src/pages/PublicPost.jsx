import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
  ArrowLeft,
  Bookmark,
  Globe,
  Users,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { API, api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Media, Caption, EventCard, timeAgo } from "@/components/social/PostCard";
import { Comments } from "@/components/social/Comments";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Modern full-width post detail page with real actions and mobile bottom-sheet comments
export default function PublicPost() {
  const { pid } = useParams();
  const nav = useNavigate();
  const { user } = useApp();
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);
  const [showComments, setShowComments] = useState(true);
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);

  useEffect(() => {
    // Try fetching through authenticated API first if user is logged in, else public endpoint
    const fetchPost = async () => {
      try {
        if (user) {
          const { data } = await api.get(`/posts/${pid}`);
          setP(data);
        } else {
          const { data } = await axios.get(`${API}/public/posts/${pid}`);
          setP(data);
        }
      } catch (e) {
        setErr(e?.response?.status || 500);
      }
    };
    fetchPost();
  }, [pid, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("લાઈક કરવા માટે લોગિન જરૂરી છે");
      return nav("/login");
    }
    const currentlyLiked = !!p.likedByMe;
    setP((prev) => ({
      ...prev,
      likedByMe: !currentlyLiked,
      likesCount: (prev.likesCount || 0) + (currentlyLiked ? -1 : 1),
    }));
    try {
      const { data } = await api.post(`/posts/${p.id}/like`);
      setP(data);
    } catch {
      // Revert if error
      setP((prev) => ({
        ...prev,
        likedByMe: currentlyLiked,
        likesCount: (prev.likesCount || 0) + (currentlyLiked ? 1 : -1),
      }));
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("સેવ કરવા માટે લોગિન જરૂરી છે");
      return nav("/login");
    }
    try {
      const { data } = await api.post(`/posts/${p.id}/save`);
      setP((prev) => ({ ...prev, savedByMe: data.saved }));
      toast.success(data.saved ? "પોસ્ટ સેવ થઈ ગઈ" : "સેવમાંથી દૂર થઈ ગઈ");
    } catch {
      toast.error("સેવ કરવામાં ક્ષતિ આવી");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SAMAJ CONNECT",
          text: p?.caption?.slice(0, 100) || "સમાજ કનેક્ટ પર પોસ્ટ જુઓ",
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("પોસ્ટ લિંક કૉપિ થઈ ગઈ!");
    } catch {
      toast.error("લિંક કૉપિ થઈ શકી નથી");
    }
  };

  const getVisibilityIcon = (vis) => {
    switch (vis) {
      case "public":
        return <Globe className="w-3 h-3 text-emerald-600" title="જાહેર (Public)" />;
      case "followers":
        return <Heart className="w-3 h-3 text-rose-500" title="Followers" />;
      case "only_me":
        return <Lock className="w-3 h-3 text-slate-500" title="માત્ર હું (Only Me)" />;
      default:
        return <Users className="w-3 h-3 text-purple-700" title="સમાજ (My Samaj)" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-xs">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 grid place-items-center text-white font-black text-sm shadow-md group-hover:scale-105 transition">
              SC
            </div>
            <div>
              <span className="font-heading font-black text-slate-900 text-base block leading-none">
                SAMAJ CONNECT
              </span>
              <span className="text-[10px] text-purple-700 font-semibold">એક સમાજ... એક પરિવાર</span>
            </div>
          </Link>
          <Link
            to="/home"
            className="text-xs font-semibold text-purple-900 hover:text-purple-950 flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-full border border-purple-100 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> હોમ ફીડ
          </Link>
        </div>

        {err && (
          <div
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center"
            data-testid="public-post-locked"
          >
            <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-800 grid place-items-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <div className="font-bold text-slate-900 text-base">આ પોસ્ટ જોવા માટે લોગિન જરૂરી છે</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              આ પોસ્ટ ફક્ત સમાજના સભ્યો માટે અથવા ખાનગી રાખેલ છે. જોવા માટે તમારા એકાઉન્ટમાં લોગિન કરો.
            </p>
            <Link
              to="/login"
              className="inline-block mt-5 bg-gradient-to-r from-purple-800 to-indigo-700 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              લોગિન કરો (Sign In)
            </Link>
          </div>
        )}

        {p && (
          <article
            className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-md space-y-4"
            data-testid="public-post"
          >
            {/* Header */}
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] shrink-0 shadow-xs">
                  <div className="w-full h-full rounded-full bg-white grid place-items-center font-bold text-purple-900 overflow-hidden text-sm">
                    {p.authorPhoto ? (
                      <img src={p.authorPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (p.authorName?.[0] || "?").toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{p.authorName}</span>
                    {p.authorRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 font-semibold border border-purple-100">
                        {p.authorRole}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    {p.samajName && <span>🏛️ {p.samajName}</span>}
                    <span>•</span>
                    <span>{timeAgo(p.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">{getVisibilityIcon(p.visibility)}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Caption & Media */}
            <Caption text={p.caption} />
            <Media urls={p.mediaUrls} />
            <EventCard event={p.event} />

            {/* Counts Display */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <div className="flex items-center gap-3">
                <span>{p.likesCount || 0} લાઈક્સ</span>
                <span>•</span>
                <span>{p.commentsCount || 0} કમેન્ટ્સ</span>
                <span>•</span>
                <span>{p.sharesCount || 0} શેર્સ</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1 text-xs font-semibold text-slate-700">
              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  p.likedByMe
                    ? "text-rose-600 bg-rose-50"
                    : "hover:bg-slate-100 text-slate-700 active:scale-95"
                }`}
                title="લાઈક"
              >
                <Heart className={`w-4 h-4 ${p.likedByMe ? "fill-current" : ""}`} />
                <span>{p.likedByMe ? "લાઈક" : "લાઈક"}</span>
              </button>

              {/* Comment */}
              <button
                onClick={() => {
                  setShowComments(true);
                  setMobileCommentsOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition active:scale-95"
                title="કમેન્ટ"
              >
                <MessageCircle className="w-4 h-4 text-purple-700" />
                <span>કમેન્ટ</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition active:scale-95"
                title="શેર કરો"
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>શેર</span>
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  p.savedByMe
                    ? "text-amber-600 bg-amber-50"
                    : "hover:bg-slate-100 text-slate-700 active:scale-95"
                }`}
                title="સેવ કરો"
              >
                <Bookmark className={`w-4 h-4 ${p.savedByMe ? "fill-current" : ""}`} />
                <span>{p.savedByMe ? "સેવ થયું" : "સેવ"}</span>
              </button>
            </div>

            {/* Desktop Inline Comments */}
            <div className="hidden sm:block pt-3 border-t border-slate-100">
              {showComments && (
                <Comments
                  postId={p.id}
                  onCount={(d) =>
                    setP((prev) => ({ ...prev, commentsCount: (prev.commentsCount || 0) + d }))
                  }
                />
              )}
            </div>

            {/* Mobile Bottom Sheet Comments */}
            <Sheet open={mobileCommentsOpen} onOpenChange={setMobileCommentsOpen}>
              <SheetContent
                side="bottom"
                className="sm:hidden rounded-t-3xl border-t border-slate-200 bg-white p-4 max-h-[80vh] flex flex-col"
              >
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />
                <SheetHeader className="text-left pb-2 border-b border-slate-100 mb-2 shrink-0">
                  <SheetTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>કમેન્ટ્સ ({p.commentsCount || 0})</span>
                  </SheetTitle>
                  <SheetDescription className="text-[11px] text-slate-500">
                    આ પોસ્ટ પર તમારા વિચારો જણાવો
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto pr-1">
                  <Comments
                    postId={p.id}
                    onCount={(d) =>
                      setP((prev) => ({ ...prev, commentsCount: (prev.commentsCount || 0) + d }))
                    }
                  />
                </div>
              </SheetContent>
            </Sheet>
          </article>
        )}
      </div>
    </div>
  );
}
