import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Calendar, Radio, Building2, TreeDeciduous, HeartHandshake, Store, Images, Cloud, UserCircle2, Newspaper, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

const Tile = ({ to, icon: Icon, bg, ic, label, badge, testId }) => {
  const nav = useNavigate();
  return (
    <button
      data-testid={testId}
      onClick={() => nav(to)}
      className="group relative bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl grid place-items-center mb-2" style={{ background: bg }}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: ic }} />
      </div>
      <div className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-tight">{label}</div>
      {badge && <div className="text-[10px] text-slate-500 mt-0.5">{badge}</div>}
    </button>
  );
};

export default function Home() {
  const { user, t } = useApp();
  const nav = useNavigate();

  const tiles = [
    { to: "/members", icon: Users, bg: "#F3E8FF", ic: "#7C3AED", label: t("members"), badge: "સભ્યો", testId: "tile-members" },
    { to: "/social", icon: Newspaper, bg: "#E0E7FF", ic: "#4F46E5", label: t("social"), badge: "ફીડ", testId: "tile-social" },
    { to: "/events", icon: Calendar, bg: "#FEF3C7", ic: "#D97706", label: t("events"), badge: "ઈવેન્ટ્સ", testId: "tile-events" },
    { to: "/coming-soon?m=messenger", icon: MessageCircle, bg: "#DBEAFE", ic: "#2563EB", label: "મેસેન્જર", badge: "ચેટ", testId: "tile-messenger" },
    { to: "/coming-soon?m=live", icon: Radio, bg: "#FFE4E6", ic: "#E11D48", label: "લાઈવ", badge: "Live", testId: "tile-live" },
    { to: "/coming-soon?m=hall", icon: Building2, bg: "#FEF3C7", ic: "#B45309", label: "હોલ બુકિંગ", badge: "બુક", testId: "tile-hall" },
    { to: "/coming-soon?m=family", icon: TreeDeciduous, bg: "#DCFCE7", ic: "#16A34A", label: "ફેમિલી ટ્રી", badge: "વૃક્ષ", testId: "tile-family" },
    { to: "/coming-soon?m=maran", icon: HeartHandshake, bg: "#E0F2FE", ic: "#0284C7", label: "મરણ નોંધ", badge: "શ્રદ્ધાંજલિ", testId: "tile-maran" },
    { to: "/coming-soon?m=business", icon: Store, bg: "#FFEDD5", ic: "#EA580C", label: "બિઝનેસ", badge: "ડિરેક્ટરી", testId: "tile-business" },
    { to: "/coming-soon?m=gallery", icon: Images, bg: "#FCE7F3", ic: "#DB2777", label: "ફોટો ગેલેરી", badge: "યાદો", testId: "tile-gallery" },
    { to: "/coming-soon?m=cloud", icon: Cloud, bg: "#EEF2FF", ic: "#4F46E5", label: "ક્લાઉડ ફોટોઝ", badge: "સંગ્રહ", testId: "tile-cloud" },
    { to: "/profile", icon: UserCircle2, bg: "#F5F3FF", ic: "#5B21B6", label: t("profile"), badge: "મારું", testId: "tile-profile" },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-100 border-2 border-purple-200 grid place-items-center text-purple-800 font-extrabold text-lg overflow-hidden">
          {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover"/> : (user?.name?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">{t("hello")},</div>
          <div className="font-heading font-bold text-slate-900 text-lg truncate">{user?.name}</div>
          <div className="text-[11px] text-slate-500 truncate">{user?.phone}</div>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">Active</span>
      </div>

      {/* Banner */}
      <div className="relative bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white rounded-3xl p-5 sm:p-7 overflow-hidden shadow-lg">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-white/5 rounded-full" />
        <div className="relative max-w-md">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl leading-tight">{t("banner_head")}<br/>{t("banner_head2")}</h2>
          <p className="text-purple-200 text-sm mt-2">{t("banner_sub")}</p>
          <button data-testid="banner-cta" onClick={() => nav("/members")} className="mt-4 inline-flex items-center gap-1.5 bg-white text-purple-900 text-sm font-semibold px-4 py-2 rounded-full shadow hover:bg-purple-50 transition">
            {t("members")} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-slate-900 text-base sm:text-lg">{t("quick_access")}</h3>
          <button data-testid="quick-access-view-all" className="text-xs font-semibold text-purple-800">{t("view_all")}</button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {tiles.map((tile) => <Tile key={tile.to + tile.label} {...tile} />)}
        </div>
      </div>
    </div>
  );
}
