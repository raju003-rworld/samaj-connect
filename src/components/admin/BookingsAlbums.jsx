import React, { useEffect, useState } from "react";
import { Check, X, Trash2, RotateCcw, Building2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilityBadge } from "@/components/Visibility";
import { StatusBadge } from "@/pages/HallBooking";

const Btn = ({ onClick, children, cls = "bg-slate-100 text-slate-700", testId }) => (
  <button data-testid={testId} onClick={onClick} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>{children}</button>
);

export function BookingsAdmin() {
  const { t } = useApp();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/bookings", { params: { status } }).then(({ data }) => setItems(data.items)).catch((e) => toast.error(e?.response?.data?.detail || "Error"));
  useEffect(() => { load(); }, [status]);
  const decide = async (b, action) => {
    const note = action === "reject" ? (window.prompt("કારણ (વૈકલ્પિક):") ?? "") : "";
    try { await api.post(`/admin/bookings/${b.id}/decision`, { action, note }); toast.success(action); load(); } catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">{["pending", "approved", "rejected", "cancelled", "all"].map((k) => <button key={k} data-testid={`bookings-tab-${k}`} onClick={() => setStatus(k)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status === k ? "bg-purple-900 text-white" : "bg-white border border-slate-200"}`}>{k}</button>)}</div>
      {items.map((b) => (
        <div key={b.id} data-testid={`admin-booking-${b.id}`} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 grid place-items-center text-amber-700"><Building2 className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900">{b.hallName} · {b.date} · {b.startTime}-{b.endTime}</div>
            <div className="text-[11px] text-slate-500">{b.userName} · {b.userPhone || b.contactPhone} · {b.guests} મહેમાનો · {b.purpose}</div>
          </div>
          <StatusBadge s={b.status} />
          {b.status === "pending" && <><Btn testId={`booking-approve-${b.id}`} cls="bg-emerald-50 text-emerald-700" onClick={() => decide(b, "approve")}><Check className="w-3 h-3" /> {t("approve")}</Btn><Btn testId={`booking-reject-${b.id}`} cls="bg-rose-50 text-rose-700" onClick={() => decide(b, "reject")}><X className="w-3 h-3" /> {t("reject")}</Btn></>}
        </div>
      ))}
      {!items.length && <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
    </div>
  );
}

export function AlbumsModeration() {
  const { t } = useApp();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/albums", { params: { status } }).then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, [status]);
  const act = async (a, action) => { await api.post(`/admin/albums/${a.id}/moderate`, { action }); toast.success(action); load(); };
  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">{[["pending", t("pending_posts")], ["active", "Active"], ["removed", "Removed"]].map(([k, l]) => <button key={k} data-testid={`mod-albums-tab-${k}`} onClick={() => setStatus(k)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status === k ? "bg-purple-900 text-white" : "bg-white border border-slate-200"}`}>{l}</button>)}</div>
      {items.map((a) => (
        <div key={a.id} data-testid={`mod-album-${a.id}`} className="bg-white rounded-2xl border border-slate-100 p-3 flex gap-3 items-center">
          <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">{a.coverUrl && <img src={a.coverUrl} alt="" className="w-full h-full object-cover" />}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{a.title}</div><div className="text-[11px] text-slate-500 flex gap-2 items-center">{a.authorName} · {a.photoCount || 0} ફોટો <VisibilityBadge value={a.visibility} /></div></div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {!a.approved && a.status === "active" && <><Btn testId={`album-approve-${a.id}`} cls="bg-emerald-50 text-emerald-700" onClick={() => act(a, "approve")}><Check className="w-3 h-3" /> {t("approve")}</Btn><Btn testId={`album-reject-${a.id}`} cls="bg-rose-50 text-rose-700" onClick={() => act(a, "reject")}><X className="w-3 h-3" /> {t("reject")}</Btn></>}
            {a.status === "active" ? <Btn testId={`album-remove-${a.id}`} cls="bg-rose-50 text-rose-700" onClick={() => act(a, "delete")}><Trash2 className="w-3 h-3" /> {t("delete")}</Btn> : <Btn testId={`album-restore-${a.id}`} onClick={() => act(a, "restore")}><RotateCcw className="w-3 h-3" /> Restore</Btn>}
          </div>
        </div>
      ))}
      {!items.length && <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
    </div>
  );
}
