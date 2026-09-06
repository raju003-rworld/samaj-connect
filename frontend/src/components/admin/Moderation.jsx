import React, { useEffect, useState } from "react";
import { Check, X, EyeOff, Eye, Trash2, Ban, ShieldCheck, Globe } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilityBadge } from "@/components/Visibility";

const ROLES = ["super_admin", "samaj_admin", "moderator", "member", "business_user", "event_manager"];
const Btn = ({ onClick, children, cls = "bg-slate-100 text-slate-700", testId }) => (
  <button data-testid={testId} onClick={onClick} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>{children}</button>
);

export function PostsModeration() {
  const { t } = useApp();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/posts", { params: { status } }).then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, [status]);
  const act = async (p, action) => { await api.post(`/admin/posts/${p.id}/moderate`, { action }); toast.success(action); load(); };
  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">{[["pending", t("pending_posts")], ["active", "Active"], ["hidden", "Hidden"], ["wide", "All-Samaj/Public"]].map(([k, l]) => <button key={k} data-testid={`mod-posts-tab-${k}`} onClick={() => setStatus(k)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status === k ? "bg-purple-900 text-white" : "bg-white border border-slate-200"}`}>{l}</button>)}</div>
      {items.map((p) => (
        <div key={p.id} data-testid={`mod-post-${p.id}`} className="bg-white rounded-2xl border border-slate-100 p-3 flex gap-3">
          {p.mediaUrls?.[0] && <img src={p.mediaUrls[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 flex gap-2 items-center">{p.authorName} <VisibilityBadge value={p.visibility} /> <span className="uppercase">{p.status}{!p.approved ? " · pending" : ""}</span></div>
            <div className="text-sm text-slate-800 line-clamp-2">{p.caption}</div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {!p.approved && <Btn testId={`mod-approve-${p.id}`} cls="bg-emerald-50 text-emerald-700" onClick={() => act(p, "approve")}><Check className="w-3 h-3" /> {t("approve")}</Btn>}
              {!p.approved && <Btn testId={`mod-reject-${p.id}`} cls="bg-rose-50 text-rose-700" onClick={() => act(p, "reject")}><X className="w-3 h-3" /> {t("reject")}</Btn>}
              {p.status === "active" ? <Btn testId={`mod-hide-${p.id}`} onClick={() => act(p, "hide")}><EyeOff className="w-3 h-3" /> {t("hide")}</Btn> : <Btn testId={`mod-unhide-${p.id}`} onClick={() => act(p, "unhide")}><Eye className="w-3 h-3" /> Unhide</Btn>}
              <Btn testId={`mod-delete-${p.id}`} cls="bg-rose-50 text-rose-700" onClick={() => act(p, "delete")}><Trash2 className="w-3 h-3" /> {t("delete")}</Btn>
            </div>
          </div>
        </div>
      ))}
      {!items.length && <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
    </div>
  );
}

export function Reports() {
  const { t } = useApp();
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/reports", { params: { status: "open" } }).then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, []);
  const resolve = async (r, status) => { await api.patch(`/admin/reports/${r.id}`, { status }); load(); };
  const removeTarget = async (r) => {
    if (r.targetType === "post") await api.post(`/admin/posts/${r.targetId}/moderate`, { action: "delete" });
    else if (r.targetType === "comment") await api.post(`/admin/comments/${r.targetId}/moderate`, { action: "remove" });
    else if (r.targetType === "live") await api.post(`/live/${r.targetId}/moderate`, { action: "remove" });
    else if (r.targetType === "user") await api.patch(`/admin/users/${r.targetId}/suspend`);
    await resolve(r, "resolved"); toast.success("Removed");
  };
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} data-testid={`report-${r.id}`} className="bg-white rounded-2xl border border-slate-100 p-3">
          <div className="text-xs text-slate-500"><b className="uppercase text-purple-800">{r.targetType}</b> · {r.reporterName} · {new Date(r.createdAt).toLocaleString("en-IN")}</div>
          <div className="text-sm text-slate-800 mt-0.5">{r.reason}</div>
          <div className="flex gap-1.5 mt-2"><Btn testId={`report-remove-${r.id}`} cls="bg-rose-50 text-rose-700" onClick={() => removeTarget(r)}><Trash2 className="w-3 h-3" /> Remove target</Btn><Btn testId={`report-dismiss-${r.id}`} onClick={() => resolve(r, "dismissed")}>Dismiss</Btn></div>
        </div>
      ))}
      {!items.length && <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
    </div>
  );
}

export function UsersAdmin() {
  const { user, t } = useApp();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api.get("/admin/users", { params: q ? { q } : {} }).then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, []);
  const setRole = async (u, role) => { try { await api.patch(`/admin/users/${u.id}/role`, { role }); load(); } catch (e) { toast.error(e?.response?.data?.detail || "Error"); } };
  const suspend = async (u) => { try { await api.patch(`/admin/users/${u.id}/suspend`); load(); } catch (e) { toast.error(e?.response?.data?.detail || "Error"); } };
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-3 space-y-2">
      <input data-testid="admin-user-search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search name/phone" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
      {items.map((u) => (
        <div key={u.id} data-testid={`admin-user-${u.id}`} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-none">
          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 grid place-items-center font-bold overflow-hidden shrink-0">{u.profilePhoto ? <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] || "?").toUpperCase()}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-800 truncate">{u.name} {u.isSuspended && <span className="text-[10px] text-rose-600 font-bold">SUSPENDED</span>}</div><div className="text-[11px] text-slate-500">{u.phone}</div></div>
          <select data-testid={`admin-role-${u.id}`} value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u, e.target.value)} className="text-xs border border-slate-200 rounded-full px-2 py-1 bg-slate-50">{ROLES.map((r) => <option key={r} value={r} disabled={r === "super_admin" && user.role !== "super_admin"}>{r}</option>)}</select>
          {u.id !== user.id && <button data-testid={`admin-suspend-${u.id}`} onClick={() => suspend(u)} className={`p-1.5 rounded-full ${u.isSuspended ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>{u.isSuspended ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>}
        </div>
      ))}
      {!items.length && <div className="text-center text-sm text-slate-500 py-6">{t("no_data")}</div>}
    </div>
  );
}

export function SamajSettings() {
  const { user } = useApp();
  const [list, setList] = useState([]);
  const [settings, setSettings] = useState({});
  const load = () => Promise.all([api.get("/admin/samaj"), api.get("/admin/settings")]).then(([a, b]) => { setList(a.data.items); setSettings(b.data); });
  useEffect(() => { load(); }, []);
  const toggleApproval = async (s) => { await api.patch(`/admin/samaj/${s.id}`, { requirePostApproval: !s.requirePostApproval }); load(); };
  const togglePublic = async () => { await api.patch("/admin/settings", { publicAccessEnabled: !settings.publicAccessEnabled }); load(); };
  return (
    <div className="space-y-3">
      {user.role === "super_admin" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
          <div><div className="text-sm font-semibold flex items-center gap-1"><Globe className="w-4 h-4 text-emerald-600" /> Public Access</div><div className="text-xs text-slate-500">Public content visible without login</div></div>
          <button data-testid="toggle-public-access" onClick={togglePublic} className={`text-xs font-bold px-3 py-1.5 rounded-full ${settings.publicAccessEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>{settings.publicAccessEnabled ? "ON" : "OFF"}</button>
        </div>
      )}
      {list.map((s) => (
        <div key={s.id} data-testid={`admin-samaj-${s.id}`} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
          <div><div className="text-sm font-semibold">{s.name} <span className="text-xs text-slate-400">({s.code})</span></div><div className="text-xs text-slate-500">Post approval required</div></div>
          <button data-testid={`toggle-approval-${s.id}`} onClick={() => toggleApproval(s)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.requirePostApproval ? "bg-purple-900 text-white" : "bg-slate-200 text-slate-700"}`}>{s.requirePostApproval ? "ON" : "OFF"}</button>
        </div>
      ))}
    </div>
  );
}
