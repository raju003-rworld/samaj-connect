import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Film,
  Images,
  Calendar,
  User,
  Search,
  Bell,
  Menu as MenuIcon,
  X,
  Plus,
  Languages,
  LogOut,
  Building2,
  Radio,
  MessageCircle,
  TreeDeciduous,
  FileText,
  ShoppingBag,
  Store,
  HeartHandshake,
  PhoneCall,
  HelpCircle,
  Settings,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
  Users,
  Grid,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { SamajSwitcher } from "@/components/SamajSwitcher";
import { IDS } from "@/constants/testIds";
import { api } from "@/lib/api";

const MobileNavItem = ({ to, icon: Icon, label, testId, activePrefix, badge }) => {
  const location = useLocation();
  const isActive = activePrefix ? location.pathname.startsWith(activePrefix) : location.pathname === to;
  return (
    <NavLink
      to={to}
      data-testid={testId}
      className={`flex flex-col items-center justify-center py-1 px-2.5 text-[10px] font-medium transition-all relative ${
        isActive ? "text-purple-950 font-bold scale-105" : "text-slate-600 hover:text-purple-800"
      }`}
    >
      <div className={`p-1 rounded-xl transition-colors relative ${isActive ? "bg-purple-100 text-purple-900" : ""}`}>
        <Icon className="w-5 h-5" />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full grid place-items-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="mt-0.5 tracking-tight whitespace-nowrap leading-none">{label}</span>
    </NavLink>
  );
};

// "More" Menu Drawer showcasing all secondary community modules
const MoreMenuSheet = ({ open, onOpenChange }) => {
  const { user, t, toggleLang, logout, lang, isMod, activeSamaj, unread } = useApp();
  const nav = useNavigate();

  const sections = [
    {
      title: "સમાજ મુખ્ય સેવાઓ (Community Modules)",
      items: [
        { to: "/members", icon: Users, label: "સભ્યો ડિરેક્ટરી (Members)", badge: "સંપર્ક" },
        { to: "/coming-soon?m=family", icon: TreeDeciduous, label: "ફેમિલી ટ્રી (Family Tree)", badge: "વંશાવલિ" },
        { to: "/events", icon: Calendar, label: "સમાજ ઈવેન્ટ્સ (Events)", badge: "કાર્યક્રમ" },
        { to: "/hall", icon: Building2, label: "હોલ બુકિંગ (Hall Booking)", badge: "બુકિંગ" },
        { to: "/coming-soon?m=finance", icon: HeartHandshake, label: "દાન & ફંડ હિસાબ (Finance & Donations)", badge: "દાન" },
        { to: "/coming-soon?m=docs", icon: FileText, label: "સમાજ દસ્તાવેજો (Documents)", badge: "PDF" },
        { to: "/coming-soon?m=orders", icon: ShoppingBag, label: "મીઠાઈ & પ્રસાદ ઓર્ડર (Orders)", badge: "ઓર્ડર" },
        { to: "/coming-soon?m=business", icon: Store, label: "બિઝનેસ ડિરેક્ટરી (Business Directory)", badge: "વેપાર" },
      ],
    },
    {
      title: "સંચાર & સંપર્ક (Communication & Contacts)",
      items: [
        { to: "/coming-soon?m=contacts", icon: PhoneCall, label: "સમાજ હોદ્દેદારો & સંપર્ક (Contacts)", badge: "સંપર્ક" },
        { to: "/notifications", icon: Bell, label: "સૂચનાઓ (Notifications)", badge: unread > 0 ? `${unread} નવી` : "" },
        { to: "/live", icon: Radio, label: "લાઈવ પ્રસારણ (Live Streaming)", badge: "Live" },
        { to: "/home", icon: Home, label: "હોમ ફીડ (Home Feed)", badge: "મુખ્ય" },
      ],
    },
    {
      title: "સેટિંગ્સ & સહાય (Settings & Support)",
      items: [
        { to: "/profile", icon: Settings, label: "સેટિંગ્સ & પ્રોફાઇલ (Settings)", badge: "" },
        { to: "/coming-soon?m=help", icon: HelpCircle, label: "હેલ્પ & સપોર્ટ (Help & Support)", badge: "સહાય" },
      ],
    },
  ];

  if (isMod) {
    sections.push({
      title: "સંચાલન (Administration)",
      items: [{ to: "/admin", icon: LayoutDashboard, label: "એડમિન કંટ્રોલ પેનલ (Admin Panel)", badge: "Admin" }],
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90%] sm:w-96 p-0 bg-white text-slate-900 border-l border-slate-200 overflow-y-auto"
      >
        <SheetTitle className="sr-only">Community Menu</SheetTitle>
        <SheetDescription className="sr-only">Access community modules</SheetDescription>

        {/* Drawer Header with Purple Gradient */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md grid place-items-center font-extrabold text-lg">
                SC
              </div>
              <div>
                <div className="font-heading font-extrabold text-base tracking-tight">SAMAJ CONNECT</div>
                <div className="text-[11px] text-purple-200">{activeSamaj?.name || "એક સમાજ... એક પરિવાર"}</div>
              </div>
            </div>
            <button
              data-testid="side-menu-close"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body - Categorized Modules */}
        <div className="p-4 space-y-5">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((it) => (
                  <button
                    key={it.to + it.label}
                    data-testid={`more-nav-${it.to.replace(/[^a-zA-Z0-9]/g, "-")}`}
                    onClick={() => {
                      nav(it.to);
                      onOpenChange(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50 transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-900 grid place-items-center group-hover:bg-purple-900 group-hover:text-white transition-colors">
                        <it.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 group-hover:text-purple-950">
                        {it.label}
                      </span>
                    </div>
                    {it.badge ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {it.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Language & Logout Controls */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <button
              data-testid={IDS.langToggle}
              onClick={toggleLang}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition text-left text-sm text-slate-700"
            >
              <Languages className="w-5 h-5 text-purple-800" />
              <span className="font-medium">ભાષા (Language): {lang === "gu" ? "English" : "ગુજરાતી"}</span>
            </button>
            <button
              data-testid={IDS.logoutBtn}
              onClick={async () => {
                await logout();
                onOpenChange(false);
                nav("/login");
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-rose-50 text-rose-600 transition text-left text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Desktop Right Sidebar Widget
const DesktopRightSidebar = () => {
  const { activeSamaj, lang } = useApp();
  const nav = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    api
      .get("/events", { params: { filter: "upcoming" } })
      .then(({ data }) => setUpcomingEvents((data.items || []).slice(0, 3)))
      .catch(() => {});
    api
      .get("/hashtags/trending")
      .then(({ data }) => setTrendingTags((data.items || []).slice(0, 5)))
      .catch(() => {});
  }, [activeSamaj?.id]);

  return (
    <aside className="w-80 shrink-0 space-y-4">
      {/* Samaj Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 text-white grid place-items-center font-bold text-lg shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">સક્રિય સમાજ</div>
            <div className="font-heading font-bold text-slate-900 text-base truncate">
              {(lang === "en" && activeSamaj?.nameEn) || activeSamaj?.name || "સમાજ"}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {activeSamaj?.city || "ગુજરાત, ભારત"}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-700" />
            <span>આગામી ઈવેન્ટ્સ</span>
          </div>
          <button
            onClick={() => nav("/events")}
            className="text-[11px] font-semibold text-purple-800 hover:underline"
          >
            બધા જુઓ
          </button>
        </div>
        <div className="space-y-2.5">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => nav(`/events?event=${ev.id}`)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50/70 border border-slate-100 transition cursor-pointer flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs grid place-items-center shrink-0">
                  {ev.date ? new Date(ev.date).getDate() : "EV"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{ev.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {ev.date} · {ev.location || "સમાજ હોલ"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-2 text-center">કોઈ નવી ઈવેન્ટ નથી</p>
          )}
        </div>
      </div>

      {/* Trending Hashtags */}
      {trendingTags.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-700" />
            <span>ટ્રેન્ડિંગ હૅશટૅગ</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trendingTags.map((h) => (
              <button
                key={h.tag}
                onClick={() => nav(`/search?q=${encodeURIComponent("#" + h.tag)}`)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-100 transition"
              >
                #{h.tag} <span className="text-slate-400 font-normal">({h.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Community Services Links */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="font-heading font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
          ઝડપી સેવાઓ
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => nav("/hall")}
            className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100 text-purple-900 font-semibold text-left transition"
          >
            🏢 હોલ બુકિંગ
          </button>
          <button
            onClick={() => nav("/members")}
            className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100 text-purple-900 font-semibold text-left transition"
          >
            👥 સભ્ય યાદી
          </button>
          <button
            onClick={() => nav("/coming-soon?m=family")}
            className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100 text-purple-900 font-semibold text-left transition"
          >
            🌳 ફેમિલી ટ્રી
          </button>
          <button
            onClick={() => nav("/coming-soon?m=orders")}
            className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100 text-purple-900 font-semibold text-left transition"
          >
            🛍️ મીઠાઈ ઓર્ડર
          </button>
        </div>
      </div>
    </aside>
  );
};

export default function AppShell({ children }) {
  const { user, t, unread, activeSamaj, lang } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [samajOpen, setSamajOpen] = useState(false);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  // Desktop Left Nav Items
  const desktopNavItems = [
    { to: "/home", icon: Home, label: "હોમ (Home)", matchExact: true },
    { to: "/reels", icon: Film, label: "રીલ્સ (Reels)" },
    { to: "/messages", icon: MessageCircle, label: "સંદેશા (Messages)" },
    { to: "/photos", icon: Images, label: "ફોટોઝ (Photos)" },
    { to: "/events", icon: Calendar, label: "ઈવેન્ટ્સ (Events)" },
    { to: "/members", icon: Users, label: "સભ્યો (Members)" },
    { to: "/profile", icon: User, label: "પ્રોફાઇલ (Profile)" },
  ];

  // Open existing post composer
  const handleAddPost = () => {
    if (location.pathname === "/home") {
      window.dispatchEvent(new CustomEvent("samaj-open-compose"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      nav("/home?compose=1");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 h-15">
          {/* Logo & Brand */}
          <button
            data-testid="header-logo"
            onClick={() => nav("/home")}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 grid place-items-center text-white font-extrabold shadow-md shadow-purple-900/20 group-hover:scale-105 transition">
              SC
            </div>
            <div>
              <div className="font-heading font-extrabold text-base tracking-tight text-slate-900 leading-none">
                SAMAJ CONNECT
              </div>
              <div className="text-[10px] font-semibold text-purple-700 tracking-wide mt-0.5">
                {t("tagline_short")}
              </div>
            </div>
          </button>

          {/* Center / Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Current Samaj Selector Chip */}
            <button
              data-testid="header-samaj-chip"
              onClick={() => setSamajOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-3 py-1.5 rounded-full max-w-[150px] sm:max-w-[200px] truncate transition shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="truncate">
                {(lang === "en" && activeSamaj?.nameEn) || activeSamaj?.name || "સમાજ પસંદ કરો"}
              </span>
            </button>

            {/* Search Icon */}
            <button
              data-testid="header-search"
              onClick={() => nav("/search")}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications Icon with Badge */}
            <button
              data-testid="header-notifications"
              onClick={() => nav("/notifications")}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-700 relative transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span
                  data-testid="notif-badge"
                  className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full grid place-items-center shadow-xs"
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {/* User Profile Avatar */}
            <button
              data-testid="header-avatar"
              onClick={() => nav("/profile")}
              className="w-9 h-9 rounded-full bg-purple-100 text-purple-900 grid place-items-center font-bold border-2 border-purple-200 overflow-hidden shadow-xs hover:ring-2 hover:ring-purple-400 transition"
              title="Profile"
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </button>

            {/* More Menu Trigger Button */}
            <button
              data-testid={IDS.navMenu || "header-menu"}
              onClick={() => setMoreOpen(true)}
              className="p-2 rounded-full hover:bg-purple-50 text-slate-700 hover:text-purple-900 transition flex items-center justify-center"
              title="More Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER: DESKTOP SIDEBARS + CENTER CONTENT */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 flex gap-6 justify-center">
        {/* DESKTOP LEFT SIDEBAR (STICKY) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-5 sticky top-20 self-start">
          {/* Main Navigation links */}
          <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm space-y-1">
            {desktopNavItems.map((it) => {
              const isActive = it.matchExact
                ? location.pathname === it.to
                : location.pathname.startsWith(it.to);
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-purple-900 text-white shadow-md shadow-purple-900/20"
                      : "text-slate-700 hover:bg-purple-50 hover:text-purple-950"
                  }`}
                >
                  <it.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-purple-700"}`} />
                  <span>{it.label}</span>
                </NavLink>
              );
            })}

            {/* More Modules Trigger */}
            <button
              onClick={() => setMoreOpen(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-950 transition"
            >
              <Grid className="w-5 h-5 text-purple-700" />
              <span>વધુ સુવિધાઓ (More)</span>
            </button>
          </div>

          {/* Quick Post Action Card */}
          <button
            onClick={handleAddPost}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 text-white font-semibold text-sm shadow-md shadow-purple-900/25 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>નવી પોસ્ટ બનાવો</span>
          </button>

          {/* Current User Mini Badge */}
          <div
            onClick={() => nav("/profile")}
            className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-purple-50/50 transition"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-900 grid place-items-center font-extrabold overflow-hidden border border-purple-200 shrink-0">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-sm text-slate-900 truncate">
                {user?.name || "સભ્ય"}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user?.phone}</div>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT */}
        <main className="flex-1 max-w-2xl min-w-0 pb-24 md:pb-12">{children}</main>

        {/* DESKTOP RIGHT SIDEBAR (STICKY ON XL SCREENS) */}
        <div className="hidden xl:block">
          <DesktopRightSidebar />
        </div>
      </div>

      {/* BOTTOM MOBILE NAVIGATION: Reels | Messages | + Add Post (Center) | Photos | More */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-xl border-t border-purple-100/90 px-3 pt-1.5 pb-2 flex items-center justify-between shadow-[0_-6px_25px_-5px_rgba(91,33,182,0.14)] relative">
          {/* 1. Reels */}
          <MobileNavItem
            to="/reels"
            icon={Film}
            label="રીલ્સ"
            testId="nav-item-reels"
            activePrefix="/reels"
          />

          {/* 2. Messages */}
          <MobileNavItem
            to="/messages"
            icon={MessageCircle}
            label="સંદેશા"
            testId="nav-item-messages"
            activePrefix="/messages"
          />

          {/* 4. Large prominent "+ Add Post" button in the center */}
          <div className="relative -mt-6 flex flex-col items-center">
            <button
              type="button"
              data-testid={IDS.navFab}
              onClick={handleAddPost}
              aria-label="નવી પોસ્ટ બનાવો (+ Add Post)"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-900 via-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-900/40 ring-4 ring-white hover:scale-105 active:scale-95 transition-all duration-150 group cursor-pointer"
            >
              <Plus className="w-7 h-7 stroke-[2.75] group-hover:rotate-90 transition-transform duration-200" />
            </button>
            <span className="mt-1 text-[10px] font-extrabold text-purple-950 tracking-tight leading-none">
              + પોસ્ટ
            </span>
          </div>

          {/* 3. Photos */}
          <MobileNavItem
            to="/photos"
            icon={Images}
            label="ફોટોઝ"
            testId="nav-item-photos"
            activePrefix="/photos"
          />

          {/* 5. More */}
          <button
            type="button"
            data-testid={IDS.navMenu}
            onClick={() => setMoreOpen(true)}
            aria-label="વધુ સેવાઓ (More Menu)"
            className="flex flex-col items-center justify-center py-1 px-2.5 text-[10px] font-medium text-slate-600 hover:text-purple-800 transition-all cursor-pointer"
          >
            <div className="p-1 rounded-xl hover:bg-purple-50 transition-colors">
              <Grid className="w-5 h-5 text-slate-700" />
            </div>
            <span className="mt-0.5 tracking-tight font-medium leading-none">વધુ</span>
          </button>
        </div>
      </nav>

      {/* Side / More Menu Sheet */}
      <MoreMenuSheet open={moreOpen} onOpenChange={setMoreOpen} />

      {/* Samaj Switcher Modal */}
      <SamajSwitcher open={samajOpen} onOpenChange={setSamajOpen} />

      <Toaster position="top-center" richColors />
    </div>
  );
}
