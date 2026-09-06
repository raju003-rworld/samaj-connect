import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { VisibilitySelect, VisibilityBadge } from "@/components/Visibility";

const EMPTY = { title: "", description: "", location: "", date: "", startTime: "", endTime: "", eventImage: "", visibility: "samaj" };

const fmt = (d) => {
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

export default function Events() {
  const { t } = useApp();
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [params] = useSearchParams();
  const focusEvent = params.get("event");
  useEffect(() => {
    if (!focusEvent || !items.length) return;
    const el = document.querySelector(`[data-testid="event-card-${focusEvent}"]`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("ring-2", "ring-purple-500"); }
    else api.get(`/events/${focusEvent}`).then(({ data }) => setItems((x) => x.some((e) => e.id === data.id) ? x : [data, ...x])).catch(() => {});
  }, [focusEvent, items.length]);

  const load = async () => {
    const { data } = await api.get("/events", { params: { filter: tab } });
    setItems(data.items);
  };
  useEffect(() => { load(); }, [tab]);

  const submit = async () => {
    if (!f.title || !f.date) return toast.error("Title અને Date જરૂરી છે");
    setSaving(true);
    try {
      await api.post("/events", f);
      toast.success("ઈવેન્ટ બન્યો");
      setOpen(false);
      setF(EMPTY);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || t("saved_fail")); }
    finally { setSaving(false); }
  };

  const register = async (e) => {
    await api.post(`/events/${e.id}/register`);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("events")}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button data-testid={IDS.eventCreateBtn} className="inline-flex items-center gap-1 bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold px-3.5 py-2 rounded-full shadow">
              <Plus className="w-4 h-4" /> {t("create_event")}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader><DialogTitle>{t("create_event")}</DialogTitle><DialogDescription className="sr-only">Event form</DialogDescription></DialogHeader>
            <div className="space-y-3 mt-2">
              {[
                { k: "title", label: "Title", type: "text" },
                { k: "description", label: "Description", type: "text" },
                { k: "location", label: t("village"), type: "text" },
                { k: "date", label: "Date", type: "date" },
                { k: "startTime", label: "Start Time", type: "time" },
                { k: "endTime", label: "End Time", type: "time" },
                { k: "eventImage", label: "Image URL", type: "text" },
              ].map((fi) => (
                <label key={fi.k} className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1 block">{fi.label}</span>
                  <input
                    data-testid={`event-${fi.k}`}
                    type={fi.type}
                    value={f[fi.k]}
                    onChange={(e) => setF({ ...f, [fi.k]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 mb-1 block">{t("visibility")}</span>
                <VisibilitySelect testId="event-visibility" value={f.visibility} onChange={(v) => setF({ ...f, visibility: v })} className="w-full" />
              </label>
              <button data-testid={IDS.eventSubmit} onClick={submit} disabled={saving} className="w-full py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold disabled:opacity-60">
                {saving ? "..." : t("save")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm inline-flex">
        {["upcoming", "past", "mine"].map((k) => (
          <button
            key={k}
            data-testid={`event-tab-${k}`}
            onClick={() => setTab(k)}
            className={`text-sm font-semibold px-4 py-1.5 rounded-xl transition ${tab === k ? "bg-purple-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {k === "upcoming" ? t("upcoming") : k === "past" ? t("past") : t("my_events")}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{t("no_data")}</div>}
        {items.map((e) => (
          <div key={e.id} data-testid={`event-card-${e.id}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-40 h-40 sm:h-auto bg-gradient-to-br from-purple-100 to-indigo-100 shrink-0 overflow-hidden">
              {e.eventImage
                ? <img src={e.eventImage} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full grid place-items-center text-purple-500"><Calendar className="w-10 h-10" /></div>}
            </div>
            <div className="p-4 flex-1 min-w-0">
              <div className="font-heading font-bold text-slate-900 text-lg flex items-center gap-2 flex-wrap">{e.title} <VisibilityBadge value={e.visibility} /></div>
              <div className="text-xs text-slate-500 flex flex-wrap gap-3 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {fmt(e.date)}</span>
                {e.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>}
                {e.startTime && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {e.startTime}{e.endTime ? ` – ${e.endTime}` : ""}</span>}
              </div>
              {e.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{e.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                {tab !== "past" && (
                  <button
                    data-testid={`event-register-${e.id}`}
                    onClick={() => register(e)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full ${e.registeredByMe ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : "bg-purple-900 text-white hover:bg-purple-950"}`}
                  >
                    {e.registeredByMe ? t("registered") : t("register")}
                  </button>
                )}
                <span className="text-xs text-slate-500">{e.registrationCount || 0} રજિસ્ટર્ડ</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
