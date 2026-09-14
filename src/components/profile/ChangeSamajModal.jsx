import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Building2, Globe, MapPin, Send, AlertCircle, Check } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

export default function ChangeSamajModal({ open, onOpenChange, onSuccess, currentPending }) {
  const { activeSamaj } = useApp();
  const [mainSamajList, setMainSamajList] = useState([]);
  const [samajList, setSamajList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedMainSamajId, setSelectedMainSamajId] = useState("");
  const [selectedGam, setSelectedGam] = useState("");
  const [selectedSamajId, setSelectedSamajId] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      api.get("/main-samaj").catch(() => ({ data: { items: [] } })),
      api.get("/samaj").catch(() => ({ data: [] })),
    ])
      .then(([mainRes, samajRes]) => {
        setMainSamajList(mainRes.data.items || []);
        const sList = Array.isArray(samajRes.data)
          ? samajRes.data
          : samajRes.data.items || [];
        setSamajList(sList);
      })
      .finally(() => setLoading(false));
  }, [open]);

  // Derived lists for 3-tier hierarchy: Main Samaj -> Gam -> Samaj Unit
  const filteredSamajByMain = selectedMainSamajId
    ? samajList.filter((s) => !s.mainSamajId || s.mainSamajId === selectedMainSamajId)
    : samajList;

  // Extract unique villages/gams for the selected Main Samaj
  const availableGams = Array.from(
    new Set(
      filteredSamajByMain
        .map((s) => s.village || s.gam || s.city)
        .filter(Boolean)
    )
  ).sort();

  // Filtered samaj units for the chosen gam (or all under main samaj if no gam selected yet)
  const candidateSamajUnits = filteredSamajByMain.filter((s) => {
    if (selectedGam) {
      const g = s.village || s.gam || s.city;
      return g === selectedGam;
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSamajId) {
      toast.error("કૃપા કરીને નવો સમાજ પસંદ કરો (Please select a Samaj)");
      return;
    }
    if (selectedSamajId === activeSamaj?.id) {
      toast.error("આ સમાજ પહેલેથી તમારો સક્રિય સમાજ છે.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/samaj/change-request", {
        requestedSamajId: selectedSamajId,
        reason: reason.trim(),
      });
      toast.success(
        res.data.message ||
          "સમાજ બદલવાની વિનંતી સફળતાપૂર્વક મોકલાઈ ગઈ. સમાજ એડમિનની મંજૂરી બાદ સક્રિય થશે."
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "વિનંતી મોકલવામાં ત્રુટિ આવી."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white rounded-3xl border border-purple-100 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-1">
            <Building2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
            સમાજ બદલો (Change Samaj)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            અન્ય સમાજ શાખામાં જોડાવા માટે વિનંતી મોકલો. સમાજ એડમિન દ્વારા મંજૂર થયા બાદ તમારો સક્રિય સમાજ અપડેટ થશે.
          </DialogDescription>
        </DialogHeader>

        {currentPending && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2 mt-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">પેન્ડિંગ વિનંતી મોજૂદ છે:</span>
              તમારી અગાઉની વિનંતી ({currentPending.requestedSamajName}) હજી એડમિન સમીક્ષા હેઠળ છે.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Current Active Samaj Display (Strictly Informational) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              વર્તમાન સક્રિય સમાજ (Current Active Samaj)
            </span>
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Building2 className="w-4 h-4 text-purple-700" />
              <span>{activeSamaj?.name || "સમાજ"}</span>
            </div>
          </div>

          {/* Step 1: Select Main Samaj */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-700" />
              <span>૧. મુખ્ય સમાજ પસંદ કરો (Select Main Samaj)</span>
            </label>
            <select
              value={selectedMainSamajId}
              onChange={(e) => {
                setSelectedMainSamajId(e.target.value);
                setSelectedGam("");
                setSelectedSamajId("");
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              <option value="">-- મુખ્ય સમાજ પસંદ કરો --</option>
              {mainSamajList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.nameEn || m.id})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Gam / Village */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-700" />
              <span>૨. ગામ / વિસ્તાર પસંદ કરો (Gam / Village)</span>
            </label>
            <select
              value={selectedGam}
              onChange={(e) => {
                setSelectedGam(e.target.value);
                setSelectedSamajId("");
              }}
              disabled={!selectedMainSamajId && availableGams.length === 0}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">-- તમામ ગામ / પસંદ કરો --</option>
              {availableGams.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Samaj Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>૩. નવો સમાજ પસંદ કરો (Target Samaj)</span>
            </label>
            <select
              value={selectedSamajId}
              onChange={(e) => setSelectedSamajId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              <option value="">-- નવો સમાજ પસંદ કરો --</option>
              {candidateSamajUnits.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  disabled={s.id === activeSamaj?.id}
                >
                  {s.name} {s.village ? `(${s.village})` : ""} {s.id === activeSamaj?.id ? "— વર્તમાન" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              સમાજ બદલવાનું કારણ / નોંધ (Reason - Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="દા.ત. વતન બદલાયેલ છે / નવું રહેઠાણ..."
              className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Important Security & Approval Notice */}
          <div className="p-3 bg-purple-50/70 border border-purple-200/70 rounded-2xl text-[11px] text-purple-900 leading-relaxed">
            <span className="font-bold block text-purple-950 mb-0.5">સુરક્ષા અને મંજૂરી નિયમ:</span>
            વિનંતી સબમિટ કરવાથી સક્રિય સમાજ તરત જ બદલાતો નથી. નિયુક્ત સમાજ એડમિન દ્વારા સંપૂર્ણ ચકાસણી અને મંજૂરી બાદ જ તમારો સક્રિય સમાજ બદલાશે.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              રદ કરો (Cancel)
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSamajId || selectedSamajId === activeSamaj?.id}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              {submitting ? (
                <span>મોકલાઈ રહ્યું છે...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>વિનંતી મોકલો (Submit Request)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
