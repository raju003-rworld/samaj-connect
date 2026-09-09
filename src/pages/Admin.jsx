import React, { useEffect, useState } from "react";
import { Users, Newspaper, Calendar, MessageSquare, UserCog, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { PostsModeration, Reports, UsersAdmin, SamajSettings } from "@/components/admin/Moderation";
import { BookingsAdmin, AlbumsModeration } from "@/components/admin/BookingsAlbums";

const StatCard = ({ icon: Icon, label, value, color, testId }) => (
  <div data-testid={testId} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: color + "18", color }}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-xl font-extrabold text-slate-900">{value ?? "—"}</div>
    </div>
  </div>
);

export default function Admin() {
  const { user, t, isMod, isAdmin } = useApp();
  const [stats, setStats] = useState({});
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("members");

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => toast.error("Admin access required"));
  }, []);

  const loadMembers = async () => {
    if (!isAdmin) return;
    const { data } = await api.get("/admin/members", { params: q ? { q } : {} });
    setMembers(data.items);
  };
  useEffect(() => { loadMembers(); }, []);

  const toggle = async (m) => {
    await api.patch(`/admin/members/${m.id}/toggle-active`);
    loadMembers();
  };

  if (!isMod) {
    return <div className="text-center text-sm text-slate-500 py-10">Admin only. તમારો role: {user?.role}</div>;
  }

  const tabs = [["members", "Members"], ["posts", t("moderation")], ["albums", `${t("albums")} (${stats.pendingAlbums ?? 0})`], ["bookings", `${t("hall_booking")} (${stats.pendingBookings ?? 0})`], ["reports", `${t("reports")} (${stats.openReports ?? 0})`], ...(isAdmin ? [["users", t("users")], ["samaj", "Samaj"]] : [])];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">Admin Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">સંસ્થા સંચાલન અને આંકડા</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard testId="admin-stat-members" icon={Users} label={t("total_members")} value={stats.members} color="#5B21B6" />
        <StatCard testId="admin-stat-users" icon={UserCog} label={t("total_users")} value={stats.users} color="#4F46E5" />
        <StatCard testId="admin-stat-posts" icon={Newspaper} label={t("total_posts")} value={stats.posts} color="#DB2777" />
        <StatCard testId="admin-stat-events" icon={Calendar} label={t("total_events")} value={stats.events} color="#D97706" />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm inline-flex flex-wrap">
        {tabs.map(([k, l]) => <button key={k} data-testid={`admin-tab-${k}`} onClick={() => setTab(k)} className={`text-sm font-semibold px-4 py-1.5 rounded-xl ${tab === k ? "bg-purple-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{l}</button>)}
      </div>

      {tab === "posts" && <PostsModeration />}
      {tab === "albums" && <AlbumsModeration />}
      {tab === "bookings" && <BookingsAdmin />}
      {tab === "reports" && <Reports />}
      {tab === "users" && <UsersAdmin />}
      {tab === "samaj" && <SamajSettings />}
      {tab === "members" && (
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-heading font-bold text-slate-900">Members Management</h3>
          <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5 border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              data-testid="admin-member-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadMembers()}
              placeholder="Search name/mobile"
              className="bg-transparent outline-none text-sm w-40 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-2 px-4 sm:px-5">Name</th>
                <th className="py-2 px-4">Mobile</th>
                <th className="py-2 px-4 hidden sm:table-cell">Village</th>
                <th className="py-2 px-4 hidden md:table-cell">District</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4 sm:px-5"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-none">
                  <td className="py-2.5 px-4 sm:px-5 font-medium text-slate-800">{m.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{m.mobile}</td>
                  <td className="py-2.5 px-4 hidden sm:table-cell text-slate-600">{m.village || "—"}</td>
                  <td className="py-2.5 px-4 hidden md:table-cell text-slate-600">{m.district || "—"}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${m.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                      {m.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 sm:px-5">
                    <button data-testid={`admin-toggle-${m.id}`} onClick={() => toggle(m)} className="text-slate-600 hover:text-purple-800">
                      {m.isActive ? <ToggleRight className="w-6 h-6 text-purple-800" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-sm text-slate-500">{t("no_data")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
