import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  Share2,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisibilitySelect, VisibilityBadge } from "@/components/Visibility";
import { MediaUploader } from "@/components/MediaUploader";

const EMPTY = {
  title: "",
  description: "",
  location: "",
  date: "",
  startTime: "",
  endTime: "",
  eventImage: "",
  visibility: "samaj",
};

const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    return {
      day: dt.getDate(),
      month: dt.toLocaleDateString("gu-IN", { month: "short" }) || dt.toLocaleDateString("en-IN", { month: "short" }),
      full: dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    };
  } catch {
    return { day: "EV", month: "DATE", full: d };
  }
};

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((it) => {
    if (!it?.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

export default function Events() {
  const { t, activeSamaj } = useApp();
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const [params] = useSearchParams();
  const focusEvent = params.get("event");

  const load = async () => {
    try {
      const { data } = await api.get("/events", { params: { filter: tab } });
      setItems(dedupeById(data.items));
    } catch {
      toast.error("ઈવેન્ટ્સ લોડ કરવામાં ક્ષતિ આવી");
    }
  };

  useEffect(() => {
    load();
  }, [tab, activeSamaj?.id]);

  useEffect(() => {
    if (!focusEvent || !items.length) return;
    const el = document.querySelector(`[data-testid="event-card-${focusEvent}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-purple-500");
    } else {
      api
        .get(`/events/${focusEvent}`)
        .then(({ data }) => setItems((x) => dedupeById(x.some((e) => e.id === data.id) ? x : [data, ...x])))
        .catch(() => {});
    }
  }, [focusEvent, items.length]);

  const openCreate = () => {
    setEditing(null);
    setF(EMPTY);
    setOpen(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setF({
      title: e.title || "",
      description: e.description || "",
      location: e.location || "",
      date: e.date || "",
      startTime: e.startTime || "",
      endTime: e.endTime || "",
      eventImage: e.eventImage || "",
      visibility: e.visibility || "samaj",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!f.title || !f.date) return toast.error("શીર્ષક અને તારીખ જરૂરી છે");
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/events/${editing.id}`, f);
        toast.success("ઈવેન્ટ સફળતાપૂર્વક અપડેટ થયો");
      } else {
        await api.post("/events", f);
        toast.success("ઈવેન્ટ સફળતાપૂર્વક બન્યો");
      }
      setOpen(false);
      setEditing(null);
      setF(EMPTY);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("saved_fail"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e) => {
    if (!window.confirm(`"${e.title}" ઈવેન્ટ રદ કરવો?`)) return;
    try {
      await api.delete(`/events/${e.id}`);
      toast.success("ઈવેન્ટ રદ થયો");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("saved_fail"));
    }
  };

  const register = async (e) => {
    try {
      await api.post(`/events/${e.id}/register`);
      toast.success(e.registeredByMe ? "રજિસ્ટ્રેશન રદ થયું" : "સફળતાપૂર્વક રજિસ્ટર થયું!");
      load();
    } catch {
      toast.error("પ્રક્રિયા પૂર્ણ ન થઈ શકી");
    }
  };

  const shareEvent = (e) => {
    const url = `${window.location.origin}/events?event=${e.id}`;
    if (navigator.share) {
      navigator.share({ title: e.title, text: `${e.title} - ${e.date} at ${e.location}`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("ઈવેન્ટ લિંક કોપી થઈ!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Create Button */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-purple-700" />
            {t("events")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            સમાજના સ્નેહમિલન, સભા, તહેવારો અને કાર્યક્રમો
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditing(null);
              setF(EMPTY);
            }
          }}
        >
          <DialogTrigger asChild>
            <button
              data-testid={IDS.eventCreateBtn}
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs transition active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>{t("create_event")}</span>
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-3xl" data-testid="event-dialog">
            <DialogHeader>
              <DialogTitle className="text-purple-950 font-heading">
                {editing ? "ઈવેન્ટ સંપાદિત કરો" : t("create_event")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                સમાજના સભ્યો માટે નવા કાર્યક્રમની વિગતો ભરો
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 mb-1 block">કાર્યક્રમ શીર્ષક (Title) *</span>
                <input
                  data-testid="event-title"
                  type="text"
                  value={f.title}
                  onChange={(e) => setF({ ...f, title: e.target.value })}
                  placeholder="દા.ત. વાર્ષિક સ્નેહમિલન સમારોહ"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600 mb-1 block">વિગત / વર્ણન</span>
                <textarea
                  data-testid="event-description"
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                  placeholder="કાર્યક્રમ વિશે સંપૂર્ણ વિગત..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1 block">સ્થળ / ગામ (Location)</span>
                  <input
                    data-testid="event-location"
                    type="text"
                    value={f.location}
                    onChange={(e) => setF({ ...f, location: e.target.value })}
                    placeholder="દા.ત. સમાજ વાડી, અમદાવાદ"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1 block">તારીખ (Date) *</span>
                  <input
                    data-testid="event-date"
                    type="date"
                    value={f.date}
                    onChange={(e) => setF({ ...f, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1 block">શરૂ સમય (Start Time)</span>
                  <input
                    data-testid="event-startTime"
                    type="time"
                    value={f.startTime}
                    onChange={(e) => setF({ ...f, startTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1 block">પૂર્ણ સમય (End Time)</span>
                  <input
                    data-testid="event-endTime"
                    type="time"
                    value={f.endTime}
                    onChange={(e) => setF({ ...f, endTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                </label>
              </div>

              {/* Event Image Uploader */}
              <div>
                <span className="text-xs font-semibold text-slate-600 mb-1 block">ઈવેન્ટ બેનર / ફોટો</span>
                <div className="flex items-center gap-3">
                  <MediaUploader
                    multiple={false}
                    accept="image/*"
                    kind="events"
                    onDone={(urls) => setF({ ...f, eventImage: urls[0] })}
                    label="ફોટો અપલોડ કરો"
                    testId="event-image-upload"
                  />
                  {f.eventImage && (
                    <img src={f.eventImage} alt="" className="w-16 h-12 rounded-xl object-cover border" />
                  )}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600 mb-1 block">{t("visibility")}</span>
                <VisibilitySelect
                  testId="event-visibility"
                  value={f.visibility}
                  onChange={(v) => setF({ ...f, visibility: v })}
                  className="w-full"
                />
              </label>

              <button
                data-testid={IDS.eventSubmit}
                onClick={submit}
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow transition disabled:opacity-60"
              >
                {saving ? "સેવ થઈ રહ્યું છે..." : t("save")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: Upcoming | Past | My Events */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        {[
          { k: "upcoming", label: t("upcoming") },
          { k: "past", label: t("past") },
          { k: "mine", label: t("my_events") },
        ].map((it) => (
          <button
            key={it.k}
            data-testid={`event-tab-${it.k}`}
            onClick={() => setTab(it.k)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              tab === it.k
                ? "bg-purple-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3.5">
        {items.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-12 bg-white rounded-3xl border border-slate-100 shadow-xs">
            <CalendarCheck className="w-12 h-12 mx-auto text-purple-300 mb-2" />
            <p className="font-semibold text-slate-700">{t("no_data")}</p>
            <p className="text-xs text-slate-400 mt-1">
              {tab === "upcoming" ? "હાલમાં કોઈ આગામી ઈવેન્ટ નથી" : "કોઈ ઈવેન્ટ્સ મળ્યા નથી"}
            </p>
          </div>
        ) : (
          dedupeById(items).map((e) => {
            const dt = fmtDate(e.date);
            return (
              <article
                key={e.id}
                data-testid={`event-card-${e.id}`}
                className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Event Image Banner */}
                <div className="relative sm:w-48 h-44 sm:h-auto bg-gradient-to-br from-purple-100 to-indigo-100 shrink-0 overflow-hidden">
                  {e.eventImage ? (
                    <img src={e.eventImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-purple-400">
                      <CalendarIcon className="w-12 h-12" />
                    </div>
                  )}

                  {/* High-contrast Date Badge Overlay */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-2xl p-2 text-center shadow-md border border-purple-100 min-w-[50px]">
                    <span className="block text-base font-extrabold text-purple-900 leading-none">
                      {dt.day}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-600 uppercase mt-0.5">
                      {dt.month}
                    </span>
                  </div>
                </div>

                {/* Event Details Content */}
                <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-heading font-bold text-slate-900 text-lg leading-snug truncate">
                        {e.title}
                      </h3>
                      <VisibilityBadge value={e.visibility} />
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-y-1 gap-x-3 mt-1.5">
                      <span className="flex items-center gap-1 text-purple-900 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-purple-700" /> {dt.full}
                      </span>
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {e.location}
                        </span>
                      )}
                      {e.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {e.startTime}
                          {e.endTime ? ` – ${e.endTime}` : ""}
                        </span>
                      )}
                    </div>

                    {e.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {e.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & RSVP Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {tab !== "past" && (
                        <button
                          data-testid={`event-register-${e.id}`}
                          onClick={() => register(e)}
                          className={`px-4 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 ${
                            e.registeredByMe
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : "bg-purple-900 hover:bg-purple-950 text-white shadow-xs"
                          }`}
                        >
                          {e.registeredByMe ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t("registered")}
                            </>
                          ) : (
                            t("register")
                          )}
                        </button>
                      )}

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <b>{e.registrationCount || 0}</b> રજિસ્ટર્ડ
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => shareEvent(e)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                        title="Share Event"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {e.canManage && (
                        <span className="flex items-center gap-1" data-testid={`event-manage-${e.id}`}>
                          <button
                            data-testid={`event-edit-${e.id}`}
                            onClick={() => openEdit(e)}
                            className="p-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-800"
                            title={t("edit")}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            data-testid={`event-delete-${e.id}`}
                            onClick={() => remove(e)}
                            className="p-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100"
                            title={t("delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
