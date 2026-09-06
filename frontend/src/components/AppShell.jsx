import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Plus, Calendar, Menu as MenuIcon, Bell, Languages, LogOut, Newspaper, LayoutDashboard, X, UserCircle2, Radio, MessageCircle, Building2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { SamajSwitcher } from "@/components/SamajSwitcher";
import { IDS } from "@/constants/testIds";

const NavItem = ({ to, icon: Icon, label, testId }) => (
  <NavLink
    to={to}
    data-testid={testId}
    className={({ isActive }) =>
      `flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
        isActive ? "text-purple-800" : "text-slate-500 hover:text-purple-700"
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </NavLink>
);

const SideMenu = ({ open, onOpenChange }) => {
  const { user, t, toggleLang, logout, lang, isAdmin, isMod } = useApp();
  const nav = useNavigate();
  const items = [
    { to: "/home", icon: Home, label: t("home") },
    { to: "/members", icon: Users, label: t("members") },
    { to: "/social", icon: Newspaper, label: t("social") },
    { to: "/live", icon: Radio, label: t("live") },
    { to: "/messages", icon: MessageCircle, label: t("messages") },
    { to: "/events", icon: Calendar, label: t("events") },
    { to: "/profile", icon: UserCircle2, label: t("profile") },
  ];
  if (isMod) {
    items.push({ to: "/admin", icon: LayoutDashboard, label: t("admin") });
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85%] sm:w-80 p-0 bg-gradient-to-b from-purple-950 to-indigo-900 text-white border-none">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigation</SheetDescription>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <div className="font-heading font-extrabold tracking-tight text-lg">SAMAJ CONNECT</div>
            <div className="text-xs text-purple-200/80 mt-0.5">{t("tagline_short")}</div>
          </div>
          <button data-testid="side-menu-close" onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((it) => (
            <button
              key={it.to}
              data-testid={`side-nav-${it.to.slice(1)}`}
              onClick={() => { nav(it.to); onOpenChange(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <it.icon className="w-5 h-5 text-purple-200" />
              <span>{it.label}</span>
            </button>
          ))}
          <div className="my-2 h-px bg-white/10" />
          <button
            data-testid={IDS.langToggle}
            onClick={toggleLang}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 text-sm"
          >
            <Languages className="w-5 h-5 text-purple-200" />
            <span>{lang === "gu" ? "English" : "ગુજરાતી"}</span>
          </button>
          <button
            data-testid={IDS.logoutBtn}
            onClick={async () => { await logout(); nav("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 text-sm text-rose-200"
          >
            <LogOut className="w-5 h-5" />
            <span>{t("logout")}</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default function AppShell({ children }) {
  const { user, t, unread, activeSamaj, isAdmin, lang } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [samajOpen, setSamajOpen] = React.useState(false);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <button data-testid="header-logo" onClick={() => nav("/home")} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 grid place-items-center text-white font-extrabold shadow-sm">SC</div>
            <div className="hidden sm:block">
              <div className="font-heading font-extrabold text-sm tracking-tight text-slate-900">SAMAJ CONNECT</div>
              <div className="text-[10px] text-slate-500 -mt-0.5">{t("tagline_short")}</div>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button data-testid="header-samaj-chip" onClick={() => setSamajOpen(true)} className="flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full max-w-[130px] truncate">
              <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{(lang === "en" && activeSamaj?.nameEn) || activeSamaj?.name || "સમાજ"}</span>
            </button>
            <button data-testid="header-notifications" onClick={() => nav("/notifications")} className="p-2 rounded-full hover:bg-slate-100 relative">
              <Bell className="w-5 h-5 text-slate-700" />
              {unread > 0 && <span data-testid="notif-badge" className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full grid place-items-center">{unread > 99 ? "99+" : unread}</span>}
            </button>
            <button
              data-testid="header-avatar"
              onClick={() => nav("/profile")}
              className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold border border-purple-200 overflow-hidden"
            >
              {user?.profilePhoto
                ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                : <span>{initial}</span>}
            </button>
            <button data-testid="header-menu" onClick={() => setMenuOpen(true)} className="p-2 rounded-full hover:bg-slate-100 md:hidden">
              <MenuIcon className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-28">
        {children}
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_-8px_rgba(91,33,182,0.15)]">
          <NavItem to="/home" icon={Home} label={t("home")} testId={IDS.navHome} />
          <NavItem to="/social" icon={Newspaper} label={t("social")} testId="nav-item-social" />
          <button
            data-testid={IDS.navFab}
            onClick={() => nav(location.pathname.startsWith("/social") ? "/social?compose=1" : location.pathname.startsWith("/live") ? "/live?go=1" : location.pathname.startsWith("/messages") ? "/messages?new=1" : "/members/add")}
            className="relative -top-4 w-14 h-14 bg-gradient-to-tr from-purple-700 to-indigo-600 text-white rounded-full grid place-items-center shadow-lg shadow-purple-900/30 border-4 border-slate-50 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
          <NavItem to="/live" icon={Radio} label={t("live")} testId="nav-item-live" />
          <NavItem to="/messages" icon={MessageCircle} label={t("messages")} testId="nav-item-messages" />
        </div>
      </nav>

      {/* Desktop sidebar-like top links */}
      <div className="hidden md:flex fixed top-16 right-6 z-20 gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
        {[
          { to: "/home", label: t("home") },
          { to: "/members", label: t("members") },
          { to: "/social", label: t("social") },
          { to: "/live", label: t("live") },
          { to: "/messages", label: t("messages") },
          { to: "/events", label: t("events") },
          ...(isAdmin || user?.role === "moderator" ? [{ to: "/admin", label: t("admin") }] : []),
        ].map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            data-testid={`desk-nav-${l.to.slice(1)}`}
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm rounded-xl font-medium ${isActive ? "bg-purple-900 text-white" : "text-slate-700 hover:bg-slate-100"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>

      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <SamajSwitcher open={samajOpen} onOpenChange={setSamajOpen} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
