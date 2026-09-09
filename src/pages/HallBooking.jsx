import React, { useEffect, useState } from "react";
import { Building2, Users, MapPin, Plus, Clock, XCircle, CheckCircle2, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { MediaUploader } from "@/components/MediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STATUS = { pending: ["bg-amber-50 text-amber-700", Hourglass, "બાકી"], approved: ["bg-emerald-50 text-emerald-700", CheckCircle2, "મંજૂર"], rejected: ["bg-rose-50 text-rose-700", XCircle, "નામંજૂર"], cancelled: ["bg-slate-100 text-slate-600", XCircle, "રદ"] };
export const StatusBadge = ({ s }) => { const [cls, Icon, l] = STATUS[s] || STATUS.pending; return <span data-testid={`booking-status-${s}`} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}><Icon className="w-3 h-3" /> {l}</span>; };

function HallDialog({ open, onOpenChange, onSaved }) {
  const [f, setF] = useState({ name: "", description: "", location: "", capacity: 100, imageUrl: "", pricePerDay: "" });
  const save = async () => {
    if (!f.name.trim()) return toast.error("હોલ નામ જરૂરી છે");
    try { const { data } = await api.post("/halls", { ...f, capacity: Number(f.capacity) || 0, pricePerDay: f.pricePerDay ? Number(f.pricePerDay) : null }); onSaved(data); onOpenChange(false); toast.success("હોલ ઉમેરાયો"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="hall-dialog">
        <DialogHeader><DialogTitle>નવો હોલ</DialogTitle><DialogDescription className="sr-only">Hall form</DialogDescription></DialogHeader>
        <div className="space-y-2">
          {[["name", "હોલ નામ"], ["location", "સ્થળ"], ["description", "વર્ણન"], ["capacity", "ક્ષમતા (વ્યક્તિ)"], ["pricePerDay", "ભાડું / દિવસ (₹, વૈકલ્પિક)"]].map(([k, l]) => (
            <input key={k} data-testid={`hall-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={l} type={["capacity", "pricePerDay"].includes(k) ? "number" : "text"} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
          ))}
          <div className="flex items-center gap-2"><MediaUploader multiple={false} accept="image/*" kind="halls" onDone={(u) => setF({ ...f, imageUrl: u[0] })} label="હોલ ફોટો" testId="hall-image-upload" />{f.imageUrl && <img src={f.imageUrl} alt="" className="w-14 h-10 rounded-lg object-cover" />}</div>
          <button data-testid="hall-save" onClick={save} className="w-full py-2.5 rounded-2xl bg-purple-900 text-white text-sm font-semibold">સેવ</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookDialog({ hall, onOpenChange, onBooked }) {
  const [f, setF] = useState({ date: "", startTime: "10:00", endTime: "14:00", purpose: "", guests: "", contactPhone: "" });
  const [busy, setBusy] = useState([]);
  useEffect(() => { if (hall && f.date) api.get(`/halls/${hall.id}`, { params: { date: f.date } }).then(({ data }) => setBusy(data.busySlots)); }, [hall, f.date]);
  const submit = async () => {
    try { const { data } = await api.post("/bookings", { ...f, hallId: hall.id, guests: Number(f.guests) || 0 }); toast.success("બુકિંગ વિનંતી મોકલાઈ"); onBooked(data); onOpenChange(false); }
    catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
  };
  return (
    <Dialog open={!!hall} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl" data-testid="booking-dialog">
        <DialogHeader><DialogTitle>{hall?.name} બુક કરો</DialogTitle><DialogDescription className="text-xs">ક્ષમતા {hall?.capacity} · {hall?.location}</DialogDescription></DialogHeader>
        <div className="space-y-2">
          <input data-testid="booking-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
          <div className="flex gap-2"><input data-testid="booking-start" type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" /><input data-testid="booking-end" type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
          {busy.length > 0 && <div className="text-[11px] text-amber-700 bg-amber-50 rounded-xl p-2" data-testid="busy-slots">બુક થયેલ સમય: {busy.map((b) => `${b.startTime}-${b.endTime}`).join(", ")}</div>}
          <input data-testid="booking-purpose" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} placeholder="હેતુ (લગ્ન, સભા...)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          <div className="flex gap-2"><input data-testid="booking-guests" type="number" value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} placeholder="મહેમાનો" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" /><input data-testid="booking-phone" value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} placeholder="સંપર્ક નંબર" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
          <button data-testid="booking-submit" onClick={submit} className="w-full py-2.5 rounded-2xl bg-purple-900 text-white text-sm font-semibold">બુકિંગ વિનંતી</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HallBooking() {
  const { t } = useApp();
  const [halls, setHalls] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [mine, setMine] = useState([]);
  const [book, setBook] = useState(null);
  const [newHall, setNewHall] = useState(false);
  const load = () => Promise.all([api.get("/halls"), api.get("/bookings")]).then(([h, b]) => { setHalls(h.data.items); setCanManage(h.data.canManage); setMine(b.data.items); });
  useEffect(() => { load(); }, []);
  const cancel = async (b) => { if (!window.confirm("બુકિંગ રદ કરવી?")) return; await api.post(`/bookings/${b.id}/cancel`); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("hall_booking")}</h2>
        {canManage && <button data-testid="new-hall-btn" onClick={() => setNewHall(true)} className="inline-flex items-center gap-1 bg-purple-900 text-white text-sm font-semibold px-3.5 py-2 rounded-full"><Plus className="w-4 h-4" /> હોલ ઉમેરો</button>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="halls-grid">
        {halls.map((h) => (
          <div key={h.id} data-testid={`hall-card-${h.id}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="aspect-[16/9] bg-gradient-to-br from-amber-50 to-orange-100 grid place-items-center">{h.imageUrl ? <img src={h.imageUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10 text-amber-500" />}</div>
            <div className="p-4">
              <div className="font-heading font-bold text-slate-900">{h.name}</div>
              <div className="text-xs text-slate-500 flex gap-3 mt-1 flex-wrap"><span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {h.capacity}</span>{h.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {h.location}</span>}{h.pricePerDay && <span>₹{h.pricePerDay}/દિવસ</span>}</div>
              {h.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{h.description}</p>}
              <button data-testid={`book-hall-${h.id}`} onClick={() => setBook(h)} className="mt-3 w-full py-2 rounded-2xl bg-purple-900 text-white text-sm font-semibold">બુક કરો</button>
            </div>
          </div>
        ))}
      </div>
      {!halls.length && <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">{canManage ? "પહેલો હોલ ઉમેરો" : "કોઈ હોલ ઉપલબ્ધ નથી"}</div>}

      <div>
        <h3 className="font-heading font-bold text-slate-900 text-base mb-2">{t("my_bookings")}</h3>
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100" data-testid="my-bookings">
          {mine.map((b) => (
            <div key={b.id} data-testid={`booking-${b.id}`} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 grid place-items-center text-amber-700"><Clock className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-900 truncate">{b.hallName} · {b.date}</div><div className="text-[11px] text-slate-500">{b.startTime}-{b.endTime} · {b.purpose}{b.adminNote ? ` · ${b.adminNote}` : ""}</div></div>
              <StatusBadge s={b.status} />
              {["pending", "approved"].includes(b.status) && <button data-testid={`booking-cancel-${b.id}`} onClick={() => cancel(b)} className="text-xs text-rose-600 font-semibold">રદ</button>}
            </div>
          ))}
          {!mine.length && <div className="text-center text-sm text-slate-500 py-6">{t("no_data")}</div>}
        </div>
      </div>
      <BookDialog hall={book} onOpenChange={() => setBook(null)} onBooked={load} />
      <HallDialog open={newHall} onOpenChange={setNewHall} onSaved={load} />
    </div>
  );
}
