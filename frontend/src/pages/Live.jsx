import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Radio, CalendarClock, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { VisibilitySelect, VisibilityBadge } from "@/components/Visibility";
import { MediaUploader } from "@/components/MediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function GoLiveDialog({ open, onOpenChange }) {
  const { t } = useApp();
  const nav = useNavigate();
  const [cfg, setCfg] = useState({ provider: "embed", requiresStreamUrl: true });
  const [f, setF] = useState({ title: "", description: "", thumbnail: "", streamUrl: "", scheduledAt: "", visibility: "samaj" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) api.get("/live/config").then(({ data }) => setCfg(data)).catch(() => {}); }, [open]);

  const submit = async (startNow) => {
    if (!f.title.trim()) return toast.error("Title જરૂરી છે");
    if (startNow && cfg.requiresStreamUrl && !f.streamUrl.trim()) return toast.error("Stream URL (YouTube/Facebook/HLS) જરૂરી છે");
    setBusy(true);
    try {
      const body = { ...f, scheduledAt: startNow ? null : (f.scheduledAt ? new Date(f.scheduledAt).toISOString() : null) };
      const { data } = await api.post("/live", body);
      if (startNow) await api.post(`/live/${data.id}/start`, { streamUrl: f.streamUrl });
      onOpenChange(false); nav(`/live/${data.id}`);
    } catch (e) { toast.error(e?.response?.data?.detail || t("saved_fail")); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="go-live-dialog">
        <DialogHeader><DialogTitle>{t("go_live")}</DialogTitle><DialogDescription className="text-xs">Provider: <b>{cfg.provider}</b>{cfg.requiresStreamUrl ? " — YouTube / Facebook / HLS લિંક પેસ્ટ કરો" : ""}</DialogDescription></DialogHeader>
        <div className="space-y-3">
          {[["title", "Title"], ["description", "Description"], ["streamUrl", "Stream URL (YouTube/Facebook/HLS)"]].map(([k, l]) => (
            <label key={k} className="block"><span className="text-xs font-semibold text-slate-600 mb-1 block">{l}</span>
              <input data-testid={`live-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" /></label>
          ))}
          <div className="flex items-center gap-2 flex-wrap">
            <MediaUploader multiple={false} accept="image/*" kind="live" onDone={(u) => setF({ ...f, thumbnail: u[0] })} label="Thumbnail" testId="live-thumb-upload" />
            {f.thumbnail && <img src={f.thumbnail} alt="" className="w-14 h-9 rounded-lg object-cover" />}
            <VisibilitySelect testId="live-visibility" value={f.visibility} onChange={(v) => setF({ ...f, visibility: v })} />
          </div>
          <label className="block"><span className="text-xs font-semibold text-slate-600 mb-1 block">{t("schedule_live")}</span>
            <input data-testid="live-scheduledAt" type="datetime-local" value={f.scheduledAt} onChange={(e) => setF({ ...f, scheduledAt: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" /></label>
          <div className="flex gap-2">
            <button data-testid="live-schedule-btn" onClick={() => submit(false)} disabled={busy} className="flex-1 py-2.5 rounded-2xl border border-purple-300 text-purple-800 text-sm font-semibold disabled:opacity-60"><CalendarClock className="w-4 h-4 inline mr-1" />{t("schedule_live")}</button>
            <button data-testid="live-start-btn" onClick={() => submit(true)} disabled={busy} className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-sm font-semibold disabled:opacity-60"><Radio className="w-4 h-4 inline mr-1" />{t("go_live")}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Live() {
  const { t } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(!!params.get("go"));
  useEffect(() => { api.get("/live").then(({ data }) => setItems(data.items)); }, [open]);

  const Section = ({ title, list, testId }) => list.length ? (
    <div>
      <h3 className="font-heading font-bold text-slate-900 text-base mb-2">{title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((l) => (
          <button key={l.id} data-testid={`${testId}-${l.id}`} onClick={() => nav(`/live/${l.id}`)} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left hover:shadow-md transition">
            <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-indigo-900">
              {l.thumbnail && <img src={l.thumbnail} alt="" className="w-full h-full object-cover" />}
              {l.status === "live" && <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE</span>}
              {l.status === "live" && <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> {l.viewerCount || 0}</span>}
              {l.status === "scheduled" && <span className="absolute bottom-2 left-2 bg-white/90 text-purple-900 text-[10px] font-semibold px-2 py-0.5 rounded-full">{new Date(l.scheduledAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-slate-900 truncate">{l.title}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">{l.hostName} <VisibilityBadge value={l.visibility} /></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("live")}</h2>
        <button data-testid="go-live-btn" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-3.5 py-2 rounded-full shadow"><Plus className="w-4 h-4" /> {t("go_live")}</button>
      </div>
      <Section title={t("live_now")} list={items.filter((l) => l.status === "live")} testId="live-card" />
      <Section title={t("upcoming_live")} list={items.filter((l) => ["scheduled", "created"].includes(l.status))} testId="live-upcoming" />
      <Section title={t("past_live")} list={items.filter((l) => l.status === "ended")} testId="live-past" />
      {!items.length && <div className="text-center text-sm text-slate-500 py-12 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
      <GoLiveDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
