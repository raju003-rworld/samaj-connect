import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  Check,
  LogOut,
  Sparkles,
  Landmark,
  Home,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import SearchableCombobox from "@/components/onboarding/SearchableCombobox";
import {
  initialMainSamaj,
  initialDistricts,
  initialTalukas,
  initialVillages,
  initialSamaj,
} from "@/data/gujaratMasterData";

export default function Onboarding() {
  const nav = useNavigate();
  const { user, refreshUser, logout } = useApp();

  // Master Data Lists (pre-seeded with real master data so it NEVER loads empty)
  const [mainSamajList, setMainSamajList] = useState(initialMainSamaj);
  const [districtList, setDistrictList] = useState(initialDistricts);
  const [talukaList, setTalukaList] = useState(initialTalukas);
  const [villageList, setVillageList] = useState(initialVillages);
  const [samajList, setSamajList] = useState(initialSamaj);

  // Selected values across the 5 hierarchy levels on ONE screen
  const [selectedMainSamajId, setSelectedMainSamajId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedTalukaId, setSelectedTalukaId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");
  const [customVillageName, setCustomVillageName] = useState("");
  const [selectedSamajId, setSelectedSamajId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing user guard: If onboarding is already completed, go directly to /reels
  useEffect(() => {
    const isAdmin =
      ["super_admin", "admin", "main_samaj_admin", "samaj_admin"].includes(user?.role) ||
      Boolean(user?.adminRole);
    if (user?.onboardingCompleted && !isAdmin) {
      nav("/reels", { replace: true });
    }
  }, [user, nav]);

  // Load from backend in background to sync any server-side additions or existing user progress
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        const [msRes, distRes, statusRes] = await Promise.all([
          api.get("/main-samaj").catch(() => null),
          api.get("/location/districts").catch(() => null),
          api.get("/onboarding/status").catch(() => null),
        ]);

        if (!isMounted) return;

        if (msRes?.data?.items?.length) {
          setMainSamajList(msRes.data.items);
        }
        if (distRes?.data?.items?.length) {
          setDistrictList(distRes.data.items);
        }

        const status = statusRes?.data;
        const isAdmin =
          ["super_admin", "admin", "main_samaj_admin", "samaj_admin"].includes(user?.role) ||
          Boolean(user?.adminRole);

        if (status?.onboardingCompleted && !isAdmin) {
          nav("/reels", { replace: true });
          return;
        }

        // Restore previously selected values if partially completed
        if (status?.mainSamajId) {
          setSelectedMainSamajId(status.mainSamajId);
        }
        if (status?.districtId) {
          setSelectedDistrictId(status.districtId);
          const talRes = await api
            .get(`/location/talukas?districtId=${status.districtId}`)
            .catch(() => null);
          if (talRes?.data?.items?.length && isMounted) {
            setTalukaList(talRes.data.items);
          }
        }
        if (status?.talukaId) {
          setSelectedTalukaId(status.talukaId);
          const vilRes = await api
            .get(`/location/villages?districtId=${status.districtId}&talukaId=${status.talukaId}`)
            .catch(() => null);
          if (vilRes?.data?.items?.length && isMounted) {
            setVillageList(vilRes.data.items);
          }
        }
        const vId = status?.villageId || status?.gamId;
        if (vId) {
          setSelectedVillageId(vId);
        }
        if (status?.samajId || status?.activeSamajId) {
          setSelectedSamajId(status.samajId || status.activeSamajId);
        }
      } catch (err) {
        console.warn("Background master data sync:", err);
      }
    }

    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, [nav, user]);

  // Derived active items for display
  const activeMainSamaj = useMemo(() => {
    return mainSamajList.find((m) => m.id === selectedMainSamajId) || null;
  }, [mainSamajList, selectedMainSamajId]);

  const activeDistrict = useMemo(() => {
    return districtList.find((d) => d.id === selectedDistrictId) || null;
  }, [districtList, selectedDistrictId]);

  const activeTaluka = useMemo(() => {
    return talukaList.find((t) => t.id === selectedTalukaId) || null;
  }, [talukaList, selectedTalukaId]);

  const activeVillage = useMemo(() => {
    if (!selectedVillageId) return null;
    return (
      villageList.find((v) => v.id === selectedVillageId || v.name === selectedVillageId) || {
        id: selectedVillageId,
        name: customVillageName || selectedVillageId,
        nameGujarati: customVillageName || selectedVillageId,
      }
    );
  }, [villageList, selectedVillageId, customVillageName]);

  const activeSamaj = useMemo(() => {
    return samajList.find((s) => s.id === selectedSamajId) || null;
  }, [samajList, selectedSamajId]);

  // Dynamic filter for talukas based on selected district
  const availableTalukas = useMemo(() => {
    if (!selectedDistrictId) return [];
    return talukaList.filter((t) => !t.districtId || t.districtId === selectedDistrictId);
  }, [talukaList, selectedDistrictId]);

  // Dynamic filter for villages based on selected taluka
  const availableVillages = useMemo(() => {
    if (!selectedTalukaId) return [];
    return villageList.filter((v) => !v.talukaId || v.talukaId === selectedTalukaId);
  }, [villageList, selectedTalukaId]);

  // Dynamic filter for Samaj units based on main samaj, district, taluka, village
  const availableSamajChapters = useMemo(() => {
    let list = samajList.filter((s) => s.isActive !== false);

    if (selectedMainSamajId) {
      list = list.filter((s) => !s.mainSamajId || s.mainSamajId === selectedMainSamajId);
    }

    // Sort matching chapters so that chapters in the selected village/district appear at the top
    return [...list].sort((a, b) => {
      const aMatchesVillage = selectedVillageId && a.villageId === selectedVillageId;
      const bMatchesVillage = selectedVillageId && b.villageId === selectedVillageId;
      if (aMatchesVillage && !bMatchesVillage) return -1;
      if (!aMatchesVillage && bMatchesVillage) return 1;

      const aMatchesDistrict = selectedDistrictId && a.districtId === selectedDistrictId;
      const bMatchesDistrict = selectedDistrictId && b.districtId === selectedDistrictId;
      if (aMatchesDistrict && !bMatchesDistrict) return -1;
      if (!aMatchesDistrict && bMatchesDistrict) return 1;

      return 0;
    });
  }, [samajList, selectedMainSamajId, selectedDistrictId, selectedVillageId]);

  // Filter Chips for Main Samaj
  const mainSamajChips = useMemo(
    () => [
      {
        id: "patel",
        label: "પાટીદાર (Patel)",
        filterFn: (m) =>
          m.nameGujarati?.includes("પાટીદાર") ||
          m.name?.toLowerCase().includes("patel") ||
          m.name?.toLowerCase().includes("patidar"),
      },
      {
        id: "luhar",
        label: "લુહાર / પંચાલ",
        filterFn: (m) =>
          m.nameGujarati?.includes("લુહાર") ||
          m.nameGujarati?.includes("પંચાલ") ||
          m.name?.toLowerCase().includes("luhar") ||
          m.name?.toLowerCase().includes("panchal"),
      },
      {
        id: "soni",
        label: "સોની (Soni)",
        filterFn: (m) =>
          m.nameGujarati?.includes("સોની") || m.name?.toLowerCase().includes("soni"),
      },
      {
        id: "rajput",
        label: "રાજપૂત / ક્ષત્રિય",
        filterFn: (m) =>
          m.nameGujarati?.includes("રાજપૂત") ||
          m.nameGujarati?.includes("ક્ષત્રિય") ||
          m.name?.toLowerCase().includes("rajput"),
      },
      {
        id: "brahmin",
        label: "બ્રાહ્મણ (Brahmin)",
        filterFn: (m) =>
          m.nameGujarati?.includes("બ્રાહ્મણ") || m.name?.toLowerCase().includes("brahmin"),
      },
      {
        id: "jain",
        label: "જૈન (Jain)",
        filterFn: (m) =>
          m.nameGujarati?.includes("જૈન") || m.name?.toLowerCase().includes("jain"),
      },
      {
        id: "prajapati",
        label: "પ્રજાપતિ (Prajapati)",
        filterFn: (m) =>
          m.nameGujarati?.includes("પ્રજાપતિ") || m.name?.toLowerCase().includes("prajapati"),
      },
    ],
    []
  );

  // Filter Chips for Districts
  const districtChips = useMemo(
    () => [
      {
        id: "saurashtra",
        label: "સૌરાષ્ટ્ર",
        filterFn: (d) =>
          [
            "dist_rajkot",
            "dist_jamnagar",
            "dist_bhavnagar",
            "dist_junagadh",
            "dist_amreli",
            "dist_morbi",
            "dist_surendranagar",
            "dist_porbandar",
            "dist_botad",
            "dist_gir_somnath",
            "dist_devbhumi_dwarka",
          ].includes(d.id),
      },
      {
        id: "north",
        label: "ઉત્તર ગુજરાત",
        filterFn: (d) =>
          [
            "dist_mehsana",
            "dist_patan",
            "dist_banaskantha",
            "dist_sabarkantha",
            "dist_arvalli",
          ].includes(d.id),
      },
      {
        id: "central",
        label: "મધ્ય ગુજરાત",
        filterFn: (d) =>
          [
            "dist_ahmedabad",
            "dist_gandhinagar",
            "dist_vadodara",
            "dist_anand",
            "dist_kheda",
            "dist_panchmahal",
            "dist_dahod",
            "dist_mahisagar",
            "dist_chhota_udepur",
          ].includes(d.id),
      },
      {
        id: "south",
        label: "દક્ષિણ ગુજરાત",
        filterFn: (d) =>
          [
            "dist_surat",
            "dist_bharuch",
            "dist_navsari",
            "dist_valsad",
            "dist_narmada",
            "dist_tapi",
            "dist_dang",
          ].includes(d.id),
      },
      { id: "kachchh", label: "કચ્છ", filterFn: (d) => d.id === "dist_kachchh" },
    ],
    []
  );

  // =========================================================================
  // DEPENDENCY SELECTION HANDLERS:
  // Main Samaj -> District -> Taluka -> Gam/Village -> Local Samaj
  // When a parent changes, clear invalid dependent selections only.
  // =========================================================================

  const handleMainSamajChange = (item) => {
    if (item.id === selectedMainSamajId) return;
    setSelectedMainSamajId(item.id);
    // Clear dependent selections
    setSelectedDistrictId("");
    setSelectedTalukaId("");
    setSelectedVillageId("");
    setCustomVillageName("");
    setSelectedSamajId("");
  };

  const handleDistrictChange = async (item) => {
    if (item.id === selectedDistrictId) return;
    setSelectedDistrictId(item.id);
    // Clear dependent selections
    setSelectedTalukaId("");
    setSelectedVillageId("");
    setCustomVillageName("");
    setSelectedSamajId("");

    // Fetch talukas for selected district
    try {
      const res = await api.get(`/location/talukas?districtId=${item.id}`);
      if (res?.data?.items?.length) {
        setTalukaList(res.data.items);
      }
    } catch {
      // pre-seeded fallback
    }
  };

  const handleTalukaChange = async (item) => {
    if (item.id === selectedTalukaId) return;
    setSelectedTalukaId(item.id);
    // Clear dependent selections
    setSelectedVillageId("");
    setCustomVillageName("");
    setSelectedSamajId("");

    // Fetch villages for selected taluka
    try {
      const res = await api.get(
        `/location/villages?districtId=${selectedDistrictId}&talukaId=${item.id}`
      );
      if (res?.data?.items?.length) {
        setVillageList(res.data.items);
      }
    } catch {
      // pre-seeded fallback
    }
  };

  const handleVillageChange = (item) => {
    if (item.id === selectedVillageId) return;
    setSelectedVillageId(item.id);
    setCustomVillageName("");
    // Clear dependent local samaj
    setSelectedSamajId("");
  };

  const handleCustomVillageAdd = (name) => {
    const customId = `vil_custom_${Date.now()}`;
    const newVillage = {
      id: customId,
      districtId: selectedDistrictId,
      talukaId: selectedTalukaId,
      name: name,
      nameGujarati: name,
      isActive: true,
    };
    setVillageList((prev) => [newVillage, ...prev]);
    setSelectedVillageId(customId);
    setCustomVillageName(name);
    setSelectedSamajId("");
    toast.success(`નવું ગામ "${name}" સફળતાપૂર્વક ઉમેરાયું!`);
  };

  const handleSamajChange = (item) => {
    setSelectedSamajId(item.id);
  };

  // Completion calculation
  const completedCount = [
    Boolean(selectedMainSamajId),
    Boolean(selectedDistrictId),
    Boolean(selectedTalukaId),
    Boolean(selectedVillageId),
    Boolean(selectedSamajId),
  ].filter(Boolean).length;

  const isFormComplete = completedCount === 5;
  const progressPercent = Math.round((completedCount / 5) * 100);

  // Submit and complete onboarding
  const handleContinue = async () => {
    if (!selectedMainSamajId) {
      toast.error("કૃપા કરીને ૧. મુખ્ય સમાજ પસંદ કરો.");
      return;
    }
    if (!selectedDistrictId) {
      toast.error("કૃપા કરીને ૨. જિલ્લો પસંદ કરો.");
      return;
    }
    if (!selectedTalukaId) {
      toast.error("કૃપા કરીને ૩. તાલુકો પસંદ કરો.");
      return;
    }
    if (!selectedVillageId) {
      toast.error("કૃપા કરીને ૪. ગામ / વતન પસંદ કરો.");
      return;
    }
    if (!selectedSamajId) {
      toast.error("કૃપા કરીને ૫. સ્થાનિક સમાજ શાખા પસંદ કરો.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        mainSamajId: selectedMainSamajId,
        districtId: selectedDistrictId,
        talukaId: selectedTalukaId,
        villageId: selectedVillageId,
        customVillageName: customVillageName.trim() || undefined,
        samajId: selectedSamajId,
      };

      const res = await api.post("/onboarding/step", payload);

      if (res.data?.ok || res.data?.onboardingCompleted) {
        toast.success("સમાજ અને વતનની નોંધણી સફળ થઈ!");
        const updatedUser = await refreshUser();

        // Check if verified existing user or new user needing profile completion/verification
        const isVerified = updatedUser?.verificationStatus === "verified";
        if (isVerified) {
          nav("/reels", { replace: true });
        } else {
          toast.info("હવે તમારી પ્રોફાઇલ વિગતો પૂર્ણ કરી વેરિફિકેશન સબમિટ કરો.");
          nav("/profile?complete=1", { replace: true });
        }
      } else {
        toast.error(res.data?.detail || "રજીસ્ટ્રેશન સાચવવામાં સમસ્યા આવી.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "સમાજ પસંદગી સાચવવામાં ક્ષતિ આવી.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-purple-500/20 font-sans pb-safe pt-safe overflow-y-auto">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 grid place-items-center shadow-md shadow-purple-900/20 text-white font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-slate-900 tracking-tight">
                  સમાજ કનેક્ટ
                </h1>
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                  સભ્ય નોંધણી
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                સમાજ અને વતનની પસંદગી (Community Selection)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.phone && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>+91 {user.phone}</span>
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="લૉગઆઉટ"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">લૉગઆઉટ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Vertically Scrollable & Mobile Optimized */}
      <main className="max-w-2xl mx-auto px-4 pt-5 pb-10 w-full space-y-5">
        {/* Compact Hero & Progress Header */}
        <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-purple-950/15 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>સમાજ કનેક્ટ પરિવારમાં આપનું હાર્દિક સ્વાગત છે</span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug">
              સમાજ અને વતનની પસંદગી
            </h2>

            <p className="text-xs text-purple-200/90 leading-relaxed">
              નીચે દર્શાવેલ ૫ વિગતો પસંદ કરો. એક વિગત પસંદ થતાં તેની આગળની વિગત આપોઆપ સક્રિય થશે.
            </p>

            {/* Stepper Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-200 mb-1.5">
                <span>પ્રગતિ (Progress): {completedCount} / ૫ પૂર્ણ</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ONE COMPACT SCREEN WITH ALL 5 DEPENDENT SELECTORS */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
          {/* 1. મુખ્ય સમાજ (Main Samaj) */}
          <SearchableCombobox
            id="main-samaj"
            label="૧. મુખ્ય સમાજ"
            sublabel="Main Samaj"
            placeholder="મુખ્ય સમાજ પસંદ કરો (Select Main Samaj)..."
            value={selectedMainSamajId}
            selectedItem={activeMainSamaj}
            options={mainSamajList}
            onChange={handleMainSamajChange}
            icon={Users}
            chips={mainSamajChips}
          />

          {/* 2. જિલ્લો (District) - Dependent on Main Samaj */}
          <SearchableCombobox
            id="district"
            label="૨. જિલ્લો"
            sublabel="District"
            placeholder="જિલ્લો પસંદ કરો (Select District)..."
            value={selectedDistrictId}
            selectedItem={activeDistrict}
            options={districtList}
            onChange={handleDistrictChange}
            disabled={!selectedMainSamajId}
            disabledHint="પહેલા ૧. મુખ્ય સમાજ પસંદ કરો (Select Main Samaj first)"
            icon={MapPin}
            chips={districtChips}
          />

          {/* 3. તાલુકો (Taluka) - Dependent on District */}
          <SearchableCombobox
            id="taluka"
            label="૩. તાલુકો"
            sublabel="Taluka"
            placeholder="તાલુકો પસંદ કરો (Select Taluka)..."
            value={selectedTalukaId}
            selectedItem={activeTaluka}
            options={availableTalukas}
            onChange={handleTalukaChange}
            disabled={!selectedDistrictId}
            disabledHint="પહેલા ૨. જિલ્લો પસંદ કરો (Select District first)"
            icon={Landmark}
          />

          {/* 4. ગામ / વતન (Gam / Village) - Dependent on Taluka */}
          <SearchableCombobox
            id="village"
            label="૪. ગામ / વતન"
            sublabel="Gam / Village"
            placeholder="ગામ પસંદ કરો (Select Gam / Village)..."
            value={selectedVillageId}
            selectedItem={activeVillage}
            options={availableVillages}
            onChange={handleVillageChange}
            disabled={!selectedTalukaId}
            disabledHint="પહેલા ૩. તાલુકો પસંદ કરો (Select Taluka first)"
            icon={Home}
            allowCustom={true}
            customLabel="+ નવું ગામ ઉમેરો (Add New Village)"
            onAddCustom={handleCustomVillageAdd}
          />

          {/* 5. સ્થાનિક સમાજ શાખા (Local Samaj) - Dependent on Village */}
          <SearchableCombobox
            id="samaj"
            label="૫. સ્થાનિક સમાજ શાખા"
            sublabel="Local Samaj Chapter"
            placeholder="સ્થાનિક સમાજ પસંદ કરો (Select Local Samaj)..."
            value={selectedSamajId}
            selectedItem={activeSamaj}
            options={availableSamajChapters}
            onChange={handleSamajChange}
            disabled={!selectedVillageId}
            disabledHint="પહેલા ૪. ગામ / વતન પસંદ કરો (Select Village first)"
            icon={Building2}
          />

          {/* Selected Summary Quick Badges */}
          {completedCount > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                પસંદ કરેલી વિગતો (Selected Community Hierarchy):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeMainSamaj && (
                  <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>{activeMainSamaj.nameGujarati || activeMainSamaj.name}</span>
                  </span>
                )}
                {activeDistrict && (
                  <span className="text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>જી. {activeDistrict.nameGujarati || activeDistrict.name}</span>
                  </span>
                )}
                {activeTaluka && (
                  <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>તા. {activeTaluka.nameGujarati || activeTaluka.name}</span>
                  </span>
                )}
                {activeVillage && (
                  <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ગામ: {activeVillage.nameGujarati || activeVillage.name}</span>
                  </span>
                )}
                {activeSamaj && (
                  <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>સમાજ: {activeSamaj.nameGujarati || activeSamaj.name}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ONE CONTINUE BUTTON AT THE BOTTOM */}
          <div className="pt-2">
            <button
              id="continue-onboarding-btn"
              type="button"
              disabled={!isFormComplete || isSubmitting}
              onClick={handleContinue}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isFormComplete
                  ? "bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white hover:from-purple-800 hover:to-indigo-900 shadow-purple-900/20 active:scale-[0.99]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>નોંધણી સાચવી રહ્યું છે...</span>
                </>
              ) : isFormComplete ? (
                <>
                  <span>આગળ વધો: પ્રોફાઇલ પૂર્ણ કરો (Continue)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>આગળ વધવા માટે બધી ૫ વિગતો પસંદ કરો ({completedCount}/૫)</span>
                </>
              )}
            </button>

            {!isFormComplete && (
              <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>મુખ્ય સમાજ, જિલ્લો, તાલુકો, ગામ અને સ્થાનિક સમાજ પસંદ કરવા જરૂરી છે.</span>
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
