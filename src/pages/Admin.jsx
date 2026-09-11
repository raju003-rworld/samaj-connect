import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Globe,
  MapPin,
  Building2,
  UserCheck,
  FileText,
  Film,
  Flag,
  ShieldOff,
  Key,
  History,
  Search,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Menu,
  ChevronRight,
  Shield,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAdmin } from "@/components/admin/AdminProtected";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { admin, role, scope, isSuperAdmin, isMainSamajAdmin, isSamajAdmin, logoutAdmin } = useAdmin();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab data states
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  const [mainSamajList, setMainSamajList] = useState([]);
  const [gamList, setGamList] = useState([]);
  const [gamQuery, setGamQuery] = useState("");

  const [samajList, setSamajList] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);

  const [postsList, setPostsList] = useState([]);
  const [postFilter, setPostFilter] = useState("all");

  const [reelsList, setReelsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [rolesData, setRolesData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditQuery, setAuditQuery] = useState("");

  // Fetch Stats
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      toast.error("આંકડા લોડ કરવામાં ત્રુટિ આવી.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Tab Loaders
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/admin/users", { params: { q: userQuery } });
      setUsersList(res.data.items || []);
    } catch {
      toast.error("યુઝર્સ લોડ કરવામાં ત્રુટિ.");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadMainSamaj = async () => {
    try {
      const res = await api.get("/admin/main-samaj");
      setMainSamajList(res.data.items || []);
    } catch {}
  };

  const loadGam = async () => {
    try {
      const res = await api.get("/admin/gam");
      setGamList(res.data.items || []);
    } catch {}
  };

  const loadSamaj = async () => {
    try {
      const res = await api.get("/admin/samaj");
      setSamajList(res.data.items || []);
    } catch {}
  };

  const loadVerification = async () => {
    try {
      const res = await api.get("/admin/verification");
      setVerificationQueue(res.data.items || []);
    } catch {}
  };

  const approveVerification = async (uid) => {
    try {
      await api.post(`/admin/verification/${uid}/approve`);
      await loadVerification();
      loadStats?.();
    } catch (e) {
      alert(e?.response?.data?.detail || "Approve failed");
    }
  };

  const rejectVerification = async (uid) => {
    const reason = window.prompt("Rejection reason (required):", "");
    if (reason === null) return;
    if (!reason.trim()) { alert("Rejection reason is required"); return; }
    try {
      await api.post(`/admin/verification/${uid}/reject`, { reason: reason.trim() });
      await loadVerification();
      loadStats?.();
    } catch (e) {
      alert(e?.response?.data?.detail || "Reject failed");
    }
  };

  const loadPosts = async () => {
    try {
      const res = await api.get("/admin/posts");
      setPostsList(res.data.items || []);
    } catch {}
  };

  const loadReels = async () => {
    try {
      const res = await api.get("/admin/reels");
      setReelsList(res.data.items || []);
    } catch {}
  };

  const loadReports = async () => {
    try {
      const res = await api.get("/admin/reports");
      setReportsList(res.data.items || []);
    } catch {}
  };

  const loadBlocks = async () => {
    try {
      const res = await api.get("/admin/blocks");
      setBlocksList(res.data.items || []);
    } catch {}
  };

  const loadRoles = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await api.get("/admin/roles");
      setRolesData(res.data);
    } catch {}
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.get("/admin/audit-logs");
      setAuditLogs(res.data.items || []);
    } catch {}
  };

  useEffect(() => {
    if (currentTab === "users") loadUsers();
    if (currentTab === "main_samaj") loadMainSamaj();
    if (currentTab === "gam") loadGam();
    if (currentTab === "samaj") loadSamaj();
    if (currentTab === "verification") loadVerification();
    if (currentTab === "posts") loadPosts();
    if (currentTab === "reels") loadReels();
    if (currentTab === "reports") loadReports();
    if (currentTab === "blocks") loadBlocks();
    if (currentTab === "roles") loadRoles();
    if (currentTab === "audit_logs") loadAuditLogs();
  }, [currentTab]);

  // Actions
  const handleToggleSuspend = async (u) => {
    try {
      const res = await api.patch(`/admin/users/${u.id}/suspend`);
      toast.success(res.data.isSuspended ? "યુઝરને સસ્પેન્ડ કરવામાં આવ્યા છે." : "યુઝરનું એકાઉન્ટ સક્રિય કરવામાં આવ્યું છે.");
      loadUsers();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "ક્રિયા અસફળ રહી.");
    }
  };

  const handleToggleSamajApproval = async (s) => {
    try {
      const nextVal = !s.requirePostApproval;
      await api.patch(`/admin/samaj/${s.id}`, { requirePostApproval: nextVal });
      toast.success(`પોસ્ટ મંજૂરી સેટિંગ અપડેટ થઈ ગયું: ${nextVal ? "જરૂરી છે (Enabled)" : "સીધી પોસ્ટ થશે (Direct)"}`);
      loadSamaj();
    } catch {
      toast.error("સેટિંગ્સ બદલવામાં ત્રુટિ આવી.");
    }
  };

  const handleModeratePost = async (pid, approved, status) => {
    try {
      await api.patch(`/admin/posts/${pid}`, { approved, status });
      toast.success(approved ? "પોસ્ટ મંજૂર કરવામાં આવી." : "પોસ્ટ છુપાવવામાં આવી.");
      loadPosts();
      loadStats();
    } catch {
      toast.error("પોસ્ટ મોડરેશન અસફળ રહ્યું.");
    }
  };

  const handleResolveReport = async (rid) => {
    try {
      await api.patch(`/admin/reports/${rid}/resolve`);
      toast.success("ફરિયાદનો નિકાલ કરવામાં આવ્યો.");
      loadReports();
      loadStats();
    } catch {
      toast.error("ફરિયાદ અપડેટ અસફળ રહી.");
    }
  };

  // Nav Items definition
  const navItems = [
    { id: "dashboard", label: "Dashboard", guLabel: "ડેશબોર્ડ", icon: LayoutDashboard },
    { id: "users", label: "Users", guLabel: "યુઝર્સ", icon: Users, badge: stats.users },
    { id: "main_samaj", label: "Main Samaj", guLabel: "મુખ્ય સમાજ", icon: Globe, badge: stats.mainSamaj },
    { id: "gam", label: "Gam (Villages)", guLabel: "ગામ", icon: MapPin, badge: stats.gam },
    { id: "samaj", label: "Samaj Chapters", guLabel: "સમાજ શાખાઓ", icon: Building2, badge: stats.samaj },
    { id: "verification", label: "Verification", guLabel: "વેરિફિકેશન", icon: UserCheck, badge: stats.pendingVerification, alert: stats.pendingVerification > 0 },
    { id: "posts", label: "Posts", guLabel: "પોસ્ટ્સ", icon: FileText, badge: stats.posts },
    { id: "reels", label: "Reels", guLabel: "રીલ્સ", icon: Film, badge: stats.reels },
    { id: "reports", label: "Reports", guLabel: "ફરિયાદો", icon: Flag, badge: stats.reports, alert: stats.reports > 0 },
    { id: "blocks", label: "Blocks & Suspensions", guLabel: "બ્લોક / સસ્પેન્ડ", icon: ShieldOff, badge: stats.blocks },
    ...(isSuperAdmin
      ? [{ id: "roles", label: "Admin Roles", guLabel: "એડમિન રોલ્સ", icon: Key, badge: stats.adminRoles }]
      : []),
    { id: "audit_logs", label: "Audit Logs", guLabel: "ઓડિટ લોગ્સ", icon: History, badge: stats.auditLogs },
  ];

  const getRoleBadge = (r) => {
    if (r === "SUPER_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          સુપર એડમિન (Super Admin)
        </span>
      );
    }
    if (r === "MAIN_SAMAJ_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          મુખ્ય સમાજ સંચાલક
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
        <Building2 className="w-3.5 h-3.5 text-sky-400" />
        સમાજ શાખા સંચાલક
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
                SAMAJ CONNECT
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 hidden sm:inline-block">
                  Control Center
                </span>
              </div>
              <div className="text-[11px] text-slate-400">વહીવટી અને સંચાલન કન્સોલ</div>
            </div>
          </div>
        </div>

        {/* Admin user info and role badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2">
            {getRoleBadge(role)}
            {scope?.mainSamajId && (
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                મુખ્ય: {scope.mainSamajId === "main_patidar" ? "પાટીદાર સમાજ" : scope.mainSamajId}
              </span>
            )}
            {scope?.samajId && (
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                શાખા: {scope.samajId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <img
              src={admin?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
              alt={admin?.name}
              className="w-8 h-8 rounded-full border border-purple-500/40 object-cover"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{admin?.name}</div>
              <div className="text-[10px] font-mono text-slate-400">{admin?.phone}</div>
            </div>
          </div>

          <button
            onClick={() => navigate("/home")}
            title="મુખ્ય સોશિયલ ફીડ પર જાઓ"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={logoutAdmin}
            title="સુરક્ષિત એડમિન લૉગઆઉટ"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">લૉગઆઉટ</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 pt-16 md:pt-0 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col justify-between ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              સંચાલન મેનુ (Management)
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30 font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.guLabel}</span>
                    <span className="text-[10px] opacity-60">({item.label})</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        item.alert
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : isActive
                          ? "bg-purple-800 text-purple-100"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scope indicator card in sidebar bottom */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">તમારો અધિકાર વ્યાપ (Scope)</div>
            <div className="text-xs text-slate-200 font-medium">
              {role === "SUPER_ADMIN" && "સંપૂર્ણ વૈશ્વિક નિયંત્રણ (Global Authority)"}
              {role === "MAIN_SAMAJ_ADMIN" && "મુખ્ય પાટીદાર સમાજ શાખાઓ અને ગામો"}
              {role === "SAMAJ_ADMIN" && "સ્થાનિક સમાજ શાખા સંચાલન"}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              સર્વર કનેક્ટેડ · સુરક્ષિત RBAC સક્રિય
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 custom-scrollbar">
          {/* Top Breadcrumb & Quick Refresh */}
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Admin Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-purple-400 font-medium capitalize">{currentTab.replace("_", " ")}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {navItems.find((n) => n.id === currentTab)?.guLabel}
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({navItems.find((n) => n.id === currentTab)?.label})
                </span>
              </h2>
            </div>

            <button
              onClick={() => {
                loadStats();
                if (currentTab === "users") loadUsers();
                if (currentTab === "posts") loadPosts();
                if (currentTab === "audit_logs") loadAuditLogs();
                toast.success("ડેટા તાજો કરવામાં આવ્યો.");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin text-purple-400" : ""}`} />
              <span className="hidden sm:inline">રીફ્રેશ</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD */}
          {/* ========================================================= */}
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">કુલ સભ્યો (Users)</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.users ?? "..."}</div>
                  <div className="text-[11px] text-slate-500 mt-1">નોંધાયેલા યુઝર્સ અને વસ્તીગણતરી</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">મુખ્ય સમાજ (Main Samaj)</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.mainSamaj ?? "..."}</div>
                  <div className="text-[11px] text-slate-500 mt-1">કેન્દ્રીય સમુદાય એકમો</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">સમાજ શાખાઓ (Chapters)</span>
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.samaj ?? "..."}</div>
                  <div className="text-[11px] text-slate-500 mt-1">સ્થાનિક મંડળો અને શાખાઓ</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">ગામ (Gam / Villages)</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.gam ?? "..."}</div>
                  <div className="text-[11px] text-slate-500 mt-1">સંલગ્ન વતન અને ગામો</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">કુલ પોસ્ટ્સ (Posts)</span>
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.posts ?? "..."}</div>
                  <div className="text-[11px] text-slate-500 mt-1">સમાચાર, ઘોષણા અને ફીડ</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">રીલ્સ (Reels)</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <Film className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.reels ?? "..."}</div>
                  <div className="text-[11px] text-slate-500 mt-1">ટૂંકી વીડિયો ક્લિપ્સ</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">ફરિયાદો (Open Reports)</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Flag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.reports ?? "0"}</div>
                  <div className="text-[11px] text-amber-400/80 mt-1">મોડરેશન જરૂરી આઈટમ્સ</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">બ્લોક / સસ્પેન્ડ (Blocks)</span>
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                      <ShieldOff className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{stats.blocks ?? "0"}</div>
                  <div className="text-[11px] text-slate-500 mt-1">પ્રતિબંધિત એકાઉન્ટ્સ</div>
                </div>
              </div>

              {/* Quick Actions & Foundation Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    ઝડપી વહીવટી ક્રિયાઓ (Quick Administration Actions)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setCurrentTab("users")}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-600/50 text-left transition-all hover:translate-y-[-1px] group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center justify-between">
                        <span>સભ્યોનું સંચાલન કરો</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">યુઝર્સ સસ્પેન્શન, વિગતો અને રોલ સુધારણા</p>
                    </button>

                    <button
                      onClick={() => setCurrentTab("posts")}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-pink-600/50 text-left transition-all hover:translate-y-[-1px] group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-pink-300 flex items-center justify-between">
                        <span>પોસ્ટ મોડરેશન કતાર</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">નવી પોસ્ટ્સ મંજૂર અથવા અસ્વીકાર કરો</p>
                    </button>

                    <button
                      onClick={() => setCurrentTab("samaj")}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-sky-600/50 text-left transition-all hover:translate-y-[-1px] group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center justify-between">
                        <span>શાખા સેટિંગ્સ & મંજૂરી નિયમ</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">પોસ્ટ એપ્રુવલ જરૂરી છે કે નહીં તે નિયંત્રિત કરો</p>
                    </button>

                    <button
                      onClick={() => setCurrentTab("audit_logs")}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-600/50 text-left transition-all hover:translate-y-[-1px] group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center justify-between">
                        <span>સુરક્ષા ઓડિટ લોગ્સ</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">કોણે ક્યારે કઈ ક્રિયા કરી તેની વિગત</p>
                    </button>
                  </div>
                </div>

                {/* System & Step 1 Scope Note */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      સ્ટેપ ૧ પૂર્ણતા સ્થિતિ
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      આ પેનલ ફક્ત સ્ટેપ ૧ ના આદેશ અનુસાર સમર્પિત, સુરક્ષિત એડમિન પોર્ટલ તરીકે તૈયાર કરવામાં આવી છે.
                    </p>

                    <ul className="text-[11px] text-slate-400 space-y-2 mt-4">
                      <li className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>સર્વર આધારિત RBAC સુરક્ષા (Server-Enforced)</span>
                      </li>
                      <li className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>અલગ /admin-login સુરક્ષિત રૂટ</span>
                      </li>
                      <li className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>૩ સ્તરીય એડમિન રોલ માળખું</span>
                      </li>
                      <li className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>ઓડિટ લોગિંગ ફાઉન્ડેશન સક્રિય</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400">
                    આગામી સ્ટેપ્સ: પ્રોફાઇલ વેરિફિકેશન વર્કફ્લો અને સમાજ સિલેક્શન આગામી સ્ટેપમાં સક્રિય થશે.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: USERS */}
          {/* ========================================================= */}
          {currentTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                    placeholder="નામ, મોબાઈલ અથવા ગામથી શોધો..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  શોધો (Search)
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">સભ્યનું નામ (Member)</th>
                        <th className="py-3 px-4">મોબાઈલ</th>
                        <th className="py-3 px-4">ગામ / જિલ્લો</th>
                        <th className="py-3 px-4">એડમિન રોલ</th>
                        <th className="py-3 px-4">સ્થિતિ (Status)</th>
                        <th className="py-3 px-4 text-right">ક્રિયા (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            {usersLoading ? "યુઝર્સ લોડ થઈ રહ્યા છે..." : "કોઈ યુઝર મળ્યા નથી."}
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                />
                                <div>
                                  <div className="font-semibold text-white">{u.name}</div>
                                  <div className="text-[10px] text-slate-400">{u.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">{u.phone}</td>
                            <td className="py-3 px-4 text-slate-300">
                              {u.village || "—"}
                              {u.district && <span className="text-slate-400 text-[10px]"> · {u.district}</span>}
                            </td>
                            <td className="py-3 px-4">
                              {u.adminRole ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {u.adminRole}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">સામાન્ય સભ્ય</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {u.isSuspended ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                                  સસ્પેન્ડેડ (Blocked)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  સક્રિય (Active)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleSuspend(u)}
                                disabled={u.role === "super_admin" || u.adminRole === "SUPER_ADMIN"}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                  u.isSuspended
                                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
                                    : "bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900"
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                              >
                                {u.isSuspended ? "અન-બ્લોક કરો" : "સસ્પેન્ડ કરો"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MAIN SAMAJ */}
          {/* ========================================================= */}
          {currentTab === "main_samaj" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainSamajList.map((m) => (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {m.code}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{m.name}</h3>
                        <p className="text-xs text-slate-400">{m.englishName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        સક્રિય (Active)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <div className="text-base font-bold text-white">{m.totalSamaj}</div>
                        <div className="text-[10px] text-slate-400">શાખાઓ (Chapters)</div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <div className="text-base font-bold text-white">{m.totalGam}</div>
                        <div className="text-[10px] text-slate-400">ગામ (Villages)</div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <div className="text-base font-bold text-white">{m.population?.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">કુલ વસ્તી</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: GAM (VILLAGES) */}
          {/* ========================================================= */}
          {currentTab === "gam" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={gamQuery}
                  onChange={(e) => setGamQuery(e.target.value)}
                  placeholder="ગામ અથવા જિલ્લાથી શોધો..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {gamList
                  .filter((g) => !gamQuery || g.name.includes(gamQuery) || g.district.includes(gamQuery))
                  .map((g) => (
                    <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm">{g.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{g.pincode}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">જિલ્લો: {g.district}</div>
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>સભ્યો: {g.memberCount}</span>
                        <span>પરિવારો: {g.familiesCount}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SAMAJ CHAPTERS */}
          {/* ========================================================= */}
          {currentTab === "samaj" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {samajList.map((s) => (
                  <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">{s.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.location?.city}, {s.location?.district}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {s.code || "CHAPTER"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 mt-3 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div>પ્રમુખ: <span className="font-medium text-white">{s.president || "સમાજ પ્રમુખશ્રી"}</span></div>
                      <div>સંપર્ક: <span className="font-mono text-slate-400">{s.phone || "+91 98765 00000"}</span></div>
                    </div>

                    {/* Post Approval Toggle */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">પોસ્ટ મંજૂરી આવશ્યકતા (Post Approval)</div>
                        <div className="text-[11px] text-slate-400">
                          {s.requirePostApproval ? "એડમિન મંજૂરી બાદ જ પોસ્ટ દેખાશે" : "સભ્યો સીધી પોસ્ટ કરી શકે છે"}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSamajApproval(s)}
                        className="cursor-pointer text-purple-400 hover:text-purple-300"
                      >
                        {s.requirePostApproval ? (
                          <ToggleRight className="w-8 h-8 text-purple-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: VERIFICATION QUEUE */}
          {/* ========================================================= */}
          {currentTab === "verification" && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-amber-800/40 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">પ્રોફાઇલ વેરિફિકેશન સિસ્ટમ</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      પેન્ડિંગ વિનંતીઓની સમીક્ષા કરો — મંજૂર (Approve) અથવા નકારો (Reject with reason).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {verificationQueue.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    હાલમાં કોઈ પેન્ડિંગ વેરિફિકેશન વિનંતીઓ નથી.
                  </div>
                ) : (
                  verificationQueue.map((u) => (
                    <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.village || "-"} · {u.district || "-"} · {u.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveVerification(u.id)}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          મંજૂર (Approve)
                        </button>
                        <button
                          onClick={() => rejectVerification(u.id)}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white"
                        >
                          નકારો (Reject)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: POSTS MODERATION */}
          {/* ========================================================= */}
          {currentTab === "posts" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postsList.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-slate-400 text-xs">કોઈ પોસ્ટ્સ નથી.</div>
                ) : (
                  postsList.map((p) => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{p.userName}</div>
                            <div className="text-[10px] text-slate-400">{p.samajName || "સમાજ"}</div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            p.approved
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {p.approved ? "મંજૂર (Approved)" : "પેન્ડિંગ"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 line-clamp-3">{p.text}</p>

                      {p.mediaUrl && (
                        <div className="rounded-xl overflow-hidden max-h-48 bg-slate-950">
                          <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <div className="text-[11px] text-slate-400 font-mono">Likes: {p.likesCount || 0}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleModeratePost(p.id, false, "hidden")}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
                          >
                            છુપાવો (Hide)
                          </button>
                          <button
                            onClick={() => handleModeratePost(p.id, true, "active")}
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            મંજૂર કરો
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: REELS */}
          {/* ========================================================= */}
          {currentTab === "reels" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {reelsList.length === 0 ? (
                  <div className="col-span-4 text-center py-10 text-slate-400 text-xs">કોઈ રીલ્સ ઉપલબ્ધ નથી.</div>
                ) : (
                  reelsList.map((r) => (
                    <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="aspect-[9/16] bg-slate-950 relative">
                        <video src={r.mediaUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                          <div className="text-xs font-bold text-white truncate">{r.userName}</div>
                          <div className="text-[10px] text-slate-300 line-clamp-1">{r.text}</div>
                        </div>
                      </div>
                      <div className="p-2.5 flex items-center justify-between text-xs">
                        <button
                          onClick={() => handleModeratePost(r.id, false, "hidden")}
                          className="w-full py-1 text-[11px] text-center font-medium bg-red-950/60 text-red-300 rounded border border-red-800 cursor-pointer"
                        >
                          છુપાવો (Hide Reel)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: REPORTS */}
          {/* ========================================================= */}
          {currentTab === "reports" && (
            <div className="space-y-4">
              {reportsList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                  કોઈ સક્રિય ફરિયાદો નથી.
                </div>
              ) : (
                reportsList.map((rep) => (
                  <div key={rep.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">પ્રકાર: {rep.targetType}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">કારણ: {rep.reason}</p>
                      <div className="text-[10px] text-slate-400 mt-1">ફરિયાદી: {rep.reporterName}</div>
                    </div>

                    {rep.status !== "resolved" && (
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shrink-0"
                      >
                        નિકાલ કરો (Resolve)
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: BLOCKS */}
          {/* ========================================================= */}
          {currentTab === "blocks" && (
            <div className="space-y-4">
              {blocksList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                  કોઈ યુઝર્સ બ્લોક કે સસ્પેન્ડ થયેલ નથી.
                </div>
              ) : (
                blocksList.map((b) => (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{b.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{b.phone}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSuspend(b)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      અન-સસ્પેન્ડ કરો (Unblock)
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 11: ADMIN ROLES MATRIX (Super Admin Only) */}
          {/* ========================================================= */}
          {currentTab === "roles" && isSuperAdmin && (
            <div className="space-y-6">
              {/* Role Hierarchy Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-white mb-3">એડમિન રોલ માળખું અને અધિકારો (RBAC Matrix)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rolesData?.roles?.map((r) => (
                    <div key={r.role} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div className="text-xs font-bold text-purple-400 mb-1">{r.role}</div>
                      <div className="text-sm font-bold text-white mb-2">{r.title}</div>
                      <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                      <div className="mt-3 text-[10px] font-mono uppercase bg-slate-900 px-2 py-1 rounded text-slate-300 inline-block">
                        Scope: {r.scopeType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Administrators */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-white mb-3">સક્રિય એડમિનિસ્ટ્રેટર્સ (Current Administrators)</h3>
                <div className="divide-y divide-slate-800">
                  {rolesData?.administrators?.map((adm) => (
                    <div key={adm.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={adm.profilePhoto}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-purple-500/40"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{adm.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{adm.phone}</div>
                        </div>
                      </div>

                      {getRoleBadge(adm.adminRole || adm.role?.toUpperCase())}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 12: AUDIT LOGS */}
          {/* ========================================================= */}
          {currentTab === "audit_logs" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  placeholder="ક્રિયા, એડમિન નામ અથવા ટાર્ગેટથી ફિલ્ટર કરો..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">સમય (Timestamp)</th>
                        <th className="py-3 px-4">એડમિન (Admin)</th>
                        <th className="py-3 px-4">રોલ</th>
                        <th className="py-3 px-4">ક્રિયા (Action)</th>
                        <th className="py-3 px-4">વિગતો (Details)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {auditLogs
                        .filter(
                          (l) =>
                            !auditQuery ||
                            l.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
                            l.adminName.toLowerCase().includes(auditQuery.toLowerCase())
                        )
                        .map((l) => (
                          <tr key={l.id} className="hover:bg-slate-850/50">
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3 px-4 font-sans font-medium text-white">{l.adminName}</td>
                            <td className="py-3 px-4 text-purple-300">{l.role}</td>
                            <td className="py-3 px-4 font-bold text-amber-300">{l.action}</td>
                            <td className="py-3 px-4 text-slate-400 font-sans truncate max-w-xs">
                              {JSON.stringify(l.details || {})}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
