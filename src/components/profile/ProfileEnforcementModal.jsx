import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserCheck, Clock, AlertTriangle, ShieldCheck, MapPin, Building, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { initialDistricts } from "@/data/gujaratMasterData";

export default function ProfileEnforcementModal() {
  const { user, refreshUser } = useApp();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postponing, setPostponing] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");

  const status = user?.profileStatus;
  const isMandatory = Boolean(status?.isProfileMandatory);
  const needsReminder = Boolean(status?.needsProfileReminder);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      return;
    }
    // Prefill form if empty
    if (user.name && !user.name.startsWith("Member ") && !user.name.startsWith("સભ્ય (")) {
      setName(user.name);
    }
    if (user.village || user.gam) {
      setVillage(user.village || user.gam);
    }
    if (user.district) {
      setDistrict(user.district);
    }
    if (user.bio) {
      setBio(user.bio);
    }

    // Determine if modal should pop up
    if (isMandatory || needsReminder) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user, isMandatory, needsReminder]);

  const handlePostponeLater = async () => {
    setPostponing(true);
    try {
      await api.post("/profile/reminder-later");
      toast.info("પ્રોફાઇલ રિમાઇન્ડર મુલતવી રાખવામાં આવ્યું છે. (આ વિકલ્પ હવે ફરી નહીં મળે)");
      await refreshUser();
      setOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.detail || "પછીથી વિકલ્પ સ્વીકારવામાં ભૂલ આવી.";
      toast.error(msg);
    } finally {
      setPostponing(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("કૃપા કરીને તમારું પૂરું નામ દાખલ કરો.");
      return;
    }
    if (!village.trim()) {
      toast.error("કૃપા કરીને તમારું ગામ અથવા નગર દાખલ કરો.");
      return;
    }
    if (!district.trim()) {
      toast.error("કૃપા કરીને તમારો જિલ્લો પસંદ કરો.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/profile/complete", {
        name: name.trim(),
        village: village.trim(),
        gam: village.trim(),
        district: district.trim(),
        bio: bio.trim(),
      });
      toast.success("તમારી પ્રોફાઇલ સફળતાપૂર્વક પૂર્ણ થઈ ગઈ છે! સ્વાગત છે.");
      await refreshUser();
      setOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.detail || "પ્રોફાઇલ સાચવવામાં ક્ષતિ આવી.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // If mandatory, prevent closing without saving
        if (isMandatory) return;
        setOpen(next);
      }}
    >
      <DialogContent
        className="max-w-md w-[92vw] p-0 overflow-hidden rounded-3xl border border-purple-100 shadow-2xl bg-white"
        onPointerDownOutside={(e) => {
          if (isMandatory) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isMandatory) e.preventDefault();
        }}
      >
        {/* Top Header Banner */}
        <div className={`p-6 text-white ${isMandatory ? "bg-gradient-to-br from-amber-700 via-orange-800 to-purple-950" : "bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950"}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
              {isMandatory ? (
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              ) : (
                <UserCheck className="w-5 h-5 text-purple-200" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                {isMandatory ? "ફરજિયાત પ્રોફાઇલ પૂર્ણતા (Mandatory)" : "પ્રોફાઇલ પૂર્ણ કરો (Complete Profile)"}
              </span>
              <DialogTitle className="text-lg sm:text-xl font-bold font-heading text-white">
                {isMandatory ? "પ્રોફાઇલ પૂર્ણ કરવી જરૂરી છે" : "તમારી પ્રોફાઇલ વિગતો ઉમેરો"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-purple-100/90 leading-relaxed mt-1">
            {isMandatory
              ? "તમે 'પછીથી' વિકલ્પ વાપરી ચૂક્યા છો. સમાજ કનેક્ટના તમામ ફીચર્સ (રીલ્સ, ચેટ, પોસ્ટ્સ) વાપરવા માટે મૂળભૂત પ્રોફાઇલ પૂર્ણ કરવી ફરજિયાત છે."
              : "સમાજ કનેક્ટમાં જોડાયાને ૨ દિવસ પૂરા થયા છે. સમાજના અન્ય સભ્યો તમને ઓળખી શકે તે માટે તમારી મૂળભૂત વિગતો ભરો."}
          </DialogDescription>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitProfile} className="p-6 space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              પૂરું નામ (Full Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="દા.ત. રમેશભાઈ મોહનભાઈ પટેલ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                મૂળ ગામ / નગર <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="દા.ત. ઊંઝા / વિસનગર"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                જિલ્લો (District) <span className="text-rose-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 focus:bg-white text-slate-900"
              >
                <option value="">જિલ્લો પસંદ કરો...</option>
                {initialDistricts.map((d) => (
                  <option key={d.id} value={d.nameGujarati}>
                    {d.nameGujarati} ({d.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              વ્યવસાય / ટૂંકો પરિચય (Bio - વૈકલ્પિક)
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="દા.ત. શિક્ષક, વેપારી, સેવાભાવી"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-semibold text-sm shadow-md shadow-purple-900/20 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {submitting ? "સાચવી રહ્યું છે..." : "પ્રોફાઇલ સાચવો (Complete Now)"}
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isMandatory && (
              <button
                type="button"
                onClick={handlePostponeLater}
                disabled={postponing}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition whitespace-nowrap"
                title="આ વિકલ્પ માત્ર એક જ વાર વાપરી શકાય છે"
              >
                {postponing ? "..." : "પછીથી (Later - 1x)"}
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>તમારી વિગતો તમારા સમાજના પ્રમાણિત સભ્યો સાથે જ શેર થાય છે.</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
