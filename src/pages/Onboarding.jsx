import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Users, 
  Check, 
  Search, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  PlusCircle
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { 
  initialMainSamaj, 
  initialDistricts, 
  initialTalukas, 
  initialVillages, 
  initialSamaj 
} from "@/data/gujaratMasterData";

export default function Onboarding() {
  const nav = useNavigate();
  const { user, refreshUser, logout } = useApp();

  // Master Data Lists (pre-seeded with initial data so it NEVER loads empty!)
  const [mainSamajList, setMainSamajList] = useState(initialMainSamaj);
  const [districtList, setDistrictList] = useState(initialDistricts);
  const [talukaList, setTalukaList] = useState(initialTalukas);
  const [villageList, setVillageList] = useState(initialVillages);
  const [samajList, setSamajList] = useState(initialSamaj);

  // Selected values across the 5 hierarchy levels
  const [selectedMainSamajId, setSelectedMainSamajId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedTalukaId, setSelectedTalukaId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");
  const [customVillageName, setCustomVillageName] = useState("");
  const [selectedSamajId, setSelectedSamajId] = useState("");

  // Search filters for each section on the single page
  const [mainSearch, setMainSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [talukaSearch, setTalukaSearch] = useState("");
  const [villageSearch, setVillageSearch] = useState("");
  const [samajSearch, setSamajSearch] = useState("");

  // Loading & Saving states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customVillageMode, setCustomVillageMode] = useState(false);

  // Load from backend in background to sync any server-side additions or existing user progress
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        // Parallel sync of master data
        const [msRes, distRes, statusRes] = await Promise.all([
          api.get("/main-samaj").catch(() => null),
          api.get("/location/districts").catch(() => null),
          api.get("/onboarding/status").catch(() => null)
        ]);

        if (!isMounted) return;

        if (msRes?.data?.items?.length) {
          setMainSamajList(msRes.data.items);
        }
        if (distRes?.data?.items?.length) {
          setDistrictList(distRes.data.items);
        }

        const status = statusRes?.data;
        const urlParams = new URLSearchParams(window.location.search);
        const allowChange = urlParams.get("change") === "1" || urlParams.get("force") === "1";

        if (status?.onboardingCompleted && !allowChange) {
          toast.success("તમારું સમાજ રજીસ્ટ્રેશન પહેલેથી પૂર્ણ થયેલ છે!");
          nav("/reels", { replace: true });
          return;
        }

        // Restore previously selected values if any
        if (status?.mainSamajId) {
          setSelectedMainSamajId(status.mainSamajId);
        }
        if (status?.districtId) {
          setSelectedDistrictId(status.districtId);
          // Fetch talukas for this district
          const talRes = await api.get(`/location/talukas?districtId=${status.districtId}`).catch(() => null);
          if (talRes?.data?.items?.length && isMounted) {
            setTalukaList(talRes.data.items);
          }
        }
        if (status?.talukaId) {
          setSelectedTalukaId(status.talukaId);
          const vilRes = await api.get(`/location/villages?districtId=${status.districtId}&talukaId=${status.talukaId}`).catch(() => null);
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
        console.warn("Background master data sync note:", err);
      }
    }

    syncBackendData();
    return () => { isMounted = false; };
  }, [nav]);

  // Handle district selection change: fetch its talukas & clear child selections
  const handleDistrictChange = async (dId) => {
    setSelectedDistrictId(dId);
    setSelectedTalukaId("");
    setSelectedVillageId("");
    setCustomVillageName("");
    setSelectedSamajId("");
    setCustomVillageMode(false);

    if (!dId) return;
    try {
      const res = await api.get(`/location/talukas?districtId=${dId}`);
      if (res.data?.items?.length) {
        setTalukaList(res.data.items);
      } else {
        setTalukaList(initialTalukas.filter((t) => t.districtId === dId));
      }
    } catch {
      setTalukaList(initialTalukas.filter((t) => t.districtId === dId));
    }
  };

  // Handle taluka selection change: fetch its villages & clear child selections
  const handleTalukaChange = async (tId) => {
    setSelectedTalukaId(tId);
    setSelectedVillageId("");
    setCustomVillageName("");
    setSelectedSamajId("");
    setCustomVillageMode(false);

    if (!tId) return;
    try {
      const res = await api.get(`/location/villages?districtId=${selectedDistrictId}&talukaId=${tId}`);
      if (res.data?.items?.length) {
        setVillageList(res.data.items);
      } else {
        setVillageList(initialVillages.filter((v) => v.talukaId === tId));
      }
    } catch {
      setVillageList(initialVillages.filter((v) => v.talukaId === tId));
    }
  };

  // Handle village selection change: auto-fetch/resolve matching Samaj chapters
  const handleVillageChange = async (vId) => {
    setSelectedVillageId(vId);
    setCustomVillageMode(false);

    if (!vId) return;
    try {
      const res = await api.get(`/samaj?mainSamajId=${selectedMainSamajId}&districtId=${selectedDistrictId}&talukaId=${selectedTalukaId}&villageId=${vId}`);
      if (res.data?.items?.length) {
        setSamajList(res.data.items);
        // Automatically select the best matching chapter if none selected
        if (!selectedSamajId || !res.data.items.some(s => s.id === selectedSamajId)) {
          setSelectedSamajId(res.data.items[0].id);
        }
      }
    } catch {
      // Fallback local resolve
      const matching = initialSamaj.filter((s) => 
        (!s.mainSamajId || s.mainSamajId === selectedMainSamajId) &&
        (s.villageId === vId || s.talukaId === selectedTalukaId || s.districtId === selectedDistrictId || s.id === "default")
      );
      if (matching.length) {
        setSamajList(matching);
        if (!selectedSamajId) setSelectedSamajId(matching[0].id);
      }
    }
  };

  // When custom village name is entered
  const handleCustomVillageConfirm = () => {
    if (!customVillageName.trim()) {
      toast.error("કૃપા કરીને ગામનું નામ લખો.");
      return;
    }
    const tempId = `vil_custom_${Date.now()}`;
    const newVillage = {
      id: tempId,
      districtId: selectedDistrictId,
      talukaId: selectedTalukaId,
      name: customVillageName.trim(),
      nameGujarati: customVillageName.trim(),
      isActive: true,
    };
    setVillageList((prev) => [newVillage, ...prev]);
    setSelectedVillageId(tempId);
    setCustomVillageMode(false);
    toast.success(`"${customVillageName.trim()}" ગામ પસંદ કર્યું.`);
    handleVillageChange(tempId);
  };

  // When main samaj or location changes, update available Samaj options
  useEffect(() => {
    if (!selectedMainSamajId) return;
    let matching = initialSamaj.filter((s) => !s.mainSamajId || s.mainSamajId === selectedMainSamajId);
    
    if (selectedDistrictId) {
      const distMatches = matching.filter(s => s.districtId === selectedDistrictId);
      if (distMatches.length > 0) matching = distMatches;
    }
    if (selectedVillageId) {
      const vilMatches = matching.filter(s => s.villageId === selectedVillageId || s.gamIds?.includes(selectedVillageId));
      if (vilMatches.length > 0) {
        matching = vilMatches;
      }
    }
    setSamajList(matching.length > 0 ? matching : initialSamaj.filter(s => !s.mainSamajId || s.mainSamajId === selectedMainSamajId));
    if (matching.length > 0 && (!selectedSamajId || !matching.some(m => m.id === selectedSamajId))) {
      setSelectedSamajId(matching[0].id);
    }
  }, [selectedMainSamajId, selectedDistrictId, selectedTalukaId, selectedVillageId]);

  // Filtered Main Samaj list with comprehensive alias & bilingual search
  const filteredMainSamaj = useMemo(() => {
    if (!mainSearch.trim()) return mainSamajList;
    const q = mainSearch.toLowerCase().trim();
    return mainSamajList.filter((m) => {
      const nameMatch = m.name?.toLowerCase().includes(q) || false;
      const gujMatch = m.nameGujarati?.toLowerCase().includes(q) || false;
      const enMatch = m.nameEn?.toLowerCase().includes(q) || false;
      const codeMatch = m.code?.toLowerCase().includes(q) || false;
      const aliasMatch = Array.isArray(m.aliases) && m.aliases.some((a) => a?.toLowerCase().includes(q));
      return nameMatch || gujMatch || enMatch || codeMatch || aliasMatch;
    });
  }, [mainSamajList, mainSearch]);

  // Filtered Districts
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return districtList;
    const q = districtSearch.toLowerCase().trim();
    return districtList.filter((d) => 
      d.name?.toLowerCase().includes(q) || 
      d.nameGujarati?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q)
    );
  }, [districtList, districtSearch]);

  // Filtered Talukas (only for selected district)
  const filteredTalukas = useMemo(() => {
    const list = selectedDistrictId 
      ? talukaList.filter((t) => t.districtId === selectedDistrictId)
      : talukaList;
    if (!talukaSearch.trim()) return list;
    const q = talukaSearch.toLowerCase().trim();
    return list.filter((t) => 
      t.name?.toLowerCase().includes(q) || 
      t.nameGujarati?.toLowerCase().includes(q)
    );
  }, [talukaList, selectedDistrictId, talukaSearch]);

  // Filtered Villages (only for selected taluka)
  const filteredVillages = useMemo(() => {
    const list = selectedTalukaId 
      ? villageList.filter((v) => v.talukaId === selectedTalukaId)
      : villageList;
    if (!villageSearch.trim()) return list;
    const q = villageSearch.toLowerCase().trim();
    return list.filter((v) => 
      v.name?.toLowerCase().includes(q) || 
      v.nameGujarati?.toLowerCase().includes(q)
    );
  }, [villageList, selectedTalukaId, villageSearch]);

  // Filtered Samaj chapters
  const filteredSamajChapters = useMemo(() => {
    let source = samajList;
    if (selectedMainSamajId) {
      const matched = source.filter(s => !s.mainSamajId || s.mainSamajId === selectedMainSamajId);
      if (matched.length > 0) source = matched;
    }
    if (!samajSearch.trim()) return source;
    const q = samajSearch.toLowerCase().trim();
    return source.filter((s) => 
      s.name?.toLowerCase().includes(q) || 
      s.nameGujarati?.toLowerCase().includes(q) ||
      s.nameEn?.toLowerCase().includes(q)
    );
  }, [samajList, selectedMainSamajId, samajSearch]);

  // Find active items for UI display
  const activeMainSamaj = mainSamajList.find((m) => m.id === selectedMainSamajId);
  const activeDistrict = districtList.find((d) => d.id === selectedDistrictId);
  const activeTaluka = talukaList.find((t) => t.id === selectedTalukaId);
  const activeVillage = villageList.find((v) => v.id === selectedVillageId);
  const activeSamaj = samajList.find((s) => s.id === selectedSamajId);

  // Check if all 5 selections are completed
  const isFormComplete = Boolean(
    selectedMainSamajId && 
    selectedDistrictId && 
    selectedTalukaId && 
    selectedVillageId && 
    selectedSamajId
  );

  // Save All Selections and Complete Onboarding in 1 Click
  const handleCompleteOnboarding = async () => {
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
      toast.error("કૃપા કરીને ૫. સમાજ શાખા પસંદ કરો.");
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
        toast.success("તમારું સમાજ રજીસ્ટ્રેશન સફળતાપૂર્વક પૂર્ણ થયું છે!");
        await refreshUser();
        // Redirect directly to Reels (default landing)
        nav("/reels", { replace: true });
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-purple-500/30 font-sans pb-12">
      {/* Top Application Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 backdrop-blur shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 grid place-items-center shadow-md shadow-purple-900/40 text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                સમાજ કનેક્ટ
                <span className="text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  સભ્ય નોંધણી
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                તમારો સમાજ અને વતન પસંદ કરો (બધી વિગતો એક જ પેજ પર)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            title="લોગઆઉટ"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/60"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">લોગઆઉટ</span>
          </button>
        </div>
      </header>

      {/* Main Container: Single Vertical Flow (ઉપરથી નીચે) */}
      <main className="max-w-3xl w-full mx-auto px-4 py-6 space-y-6">

        {/* Status Tracker Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
            <span>નોંધણી પ્રગતિ (Onboarding Checklist)</span>
            <span className="text-purple-400 font-bold">
              {[selectedMainSamajId, selectedDistrictId, selectedTalukaId, selectedVillageId, selectedSamajId].filter(Boolean).length} / ૫ પૂર્ણ
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 ${selectedMainSamajId ? "bg-purple-500" : "bg-transparent"}`} />
            <div className={`h-full transition-all duration-300 ${selectedDistrictId ? "bg-purple-500" : "bg-transparent"}`} />
            <div className={`h-full transition-all duration-300 ${selectedTalukaId ? "bg-purple-500" : "bg-transparent"}`} />
            <div className={`h-full transition-all duration-300 ${selectedVillageId ? "bg-purple-500" : "bg-transparent"}`} />
            <div className={`h-full transition-all duration-300 ${selectedSamajId ? "bg-purple-500" : "bg-transparent"}`} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ૧. મુખ્ય સમાજ (MAIN SAMAJ SELECTION) */}
        {/* ========================================================================= */}
        <section className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold grid place-items-center">
                  ૧
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  મુખ્ય સમાજ પસંદ કરો <span className="text-red-400">*</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-8">
                તમારી મુખ્ય જ્ઞાતિ/સમાજ પસંદ કરો (જેમ કે પટેલ, લુહાર, સોની વગેરે)
              </p>
            </div>
            {selectedMainSamajId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                <Check className="w-3.5 h-3.5" /> પસંદ થયેલ
              </span>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
            <button
              onClick={() => setMainSearch("")}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition border ${
                !mainSearch 
                  ? "bg-purple-600 text-white border-purple-500" 
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              બધા સમાજ ({mainSamajList.length})
            </button>
            {["Patel", "Luhar", "Soni", "Brahmin", "Rajput", "Jain"].map((term) => (
              <button
                key={term}
                onClick={() => setMainSearch(term)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition border ${
                  mainSearch.toLowerCase() === term.toLowerCase()
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={mainSearch}
              onChange={(e) => setMainSearch(e.target.value)}
              placeholder="મુખ્ય સમાજ શોધો (દા.ત. Patel, Luhar, Soni, પટેલ, લુહાર, સોની...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            {mainSearch && (
              <button
                onClick={() => setMainSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                સાફ કરો
              </button>
            )}
          </div>

          {/* Main Samaj Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredMainSamaj.map((ms) => {
              const isSelected = selectedMainSamajId === ms.id;
              return (
                <div
                  key={ms.id}
                  onClick={() => setSelectedMainSamajId(ms.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30"
                      : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl grid place-items-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSelected ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"
                    }`}>
                      {ms.code?.slice(0, 3) || "SAM"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white leading-tight">
                        {ms.nameGujarati || ms.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {ms.nameEn || ms.name}
                      </div>
                      {ms.description && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {ms.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border grid place-items-center shrink-0 mt-1 transition ${
                    isSelected 
                      ? "bg-purple-600 border-purple-500 text-white" 
                      : "border-slate-700 bg-slate-800"
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ૨. જિલ્લો (DISTRICT SELECTION) */}
        {/* ========================================================================= */}
        <section className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold grid place-items-center">
                  ૨
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  જિલ્લો પસંદ કરો <span className="text-red-400">*</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-8">
                ગુજરાતના ૩૩ જિલ્લામાંથી તમારો વતન જિલ્લો પસંદ કરો
              </p>
            </div>
            {selectedDistrictId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                <Check className="w-3.5 h-3.5" /> {activeDistrict?.nameGujarati || activeDistrict?.name}
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              placeholder="જિલ્લો શોધો (દા.ત. કચ્છ, અમદાવાદ, સુરત, મહેસાણા, રાજકોટ...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* District Grid Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredDistricts.map((d) => {
              const isSelected = selectedDistrictId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDistrictChange(d.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition text-xs font-medium flex items-center justify-between ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span className="truncate">{d.nameGujarati || d.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ૩. તાલુકો (TALUKA SELECTION) */}
        {/* ========================================================================= */}
        <section className={`bg-slate-950 border rounded-3xl p-5 sm:p-6 shadow-xl transition-all ${
          !selectedDistrictId ? "border-slate-850 opacity-60" : "border-slate-800"
        }`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold grid place-items-center">
                  ૩
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  તાલુકો પસંદ કરો <span className="text-red-400">*</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-8">
                {selectedDistrictId 
                  ? `${activeDistrict?.nameGujarati || activeDistrict?.name} જિલ્લાના તાલુકા`
                  : "કૃપા કરીને પહેલા ઉપરથી જિલ્લો પસંદ કરો"}
              </p>
            </div>
            {selectedTalukaId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                <Check className="w-3.5 h-3.5" /> {activeTaluka?.nameGujarati || activeTaluka?.name}
              </span>
            )}
          </div>

          {!selectedDistrictId ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
              જિલ્લો પસંદ કર્યા બાદ તાલુકાની યાદી અહીં ખૂલશે.
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={talukaSearch}
                  onChange={(e) => setTalukaSearch(e.target.value)}
                  placeholder="તાલુકો શોધો (દા.ત. અબડાસા, ભુજ, માંડવી, દસ્ક્રોઈ...)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Taluka Grid Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredTalukas.map((t) => {
                  const isSelected = selectedTalukaId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTalukaChange(t.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition text-xs font-medium flex items-center justify-between ${
                        isSelected
                          ? "bg-sky-950/60 border-sky-500 text-sky-200 ring-1 ring-sky-500"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{t.nameGujarati || t.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ૪. ગામ / વતન (GAM / VILLAGE SELECTION) */}
        {/* ========================================================================= */}
        <section className={`bg-slate-950 border rounded-3xl p-5 sm:p-6 shadow-xl transition-all ${
          !selectedTalukaId ? "border-slate-850 opacity-60" : "border-slate-800"
        }`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold grid place-items-center">
                  ૪
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  ગામ / વતન પસંદ કરો <span className="text-red-400">*</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-8">
                {selectedTalukaId 
                  ? `${activeTaluka?.nameGujarati || activeTaluka?.name} તાલુકાના ગામો`
                  : "કૃપા કરીને પહેલા તાલુકો પસંદ કરો"}
              </p>
            </div>
            {selectedVillageId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                <Check className="w-3.5 h-3.5" /> {activeVillage?.nameGujarati || activeVillage?.name || customVillageName}
              </span>
            )}
          </div>

          {!selectedTalukaId ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
              તાલુકો પસંદ કર્યા બાદ ગામોની યાદી અહીં ખૂલશે.
            </div>
          ) : (
            <>
              {/* Search & Custom Village Row */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={villageSearch}
                    onChange={(e) => setVillageSearch(e.target.value)}
                    placeholder="ગામ શોધો (દા.ત. ગઢશીશા, કોઠારા, નલિયા...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setCustomVillageMode(!customVillageMode)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  નવું ગામ ઉમેરો
                </button>
              </div>

              {/* Custom Village Input Form (if toggled) */}
              {customVillageMode && (
                <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-3 mb-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customVillageName}
                    onChange={(e) => setCustomVillageName(e.target.value)}
                    placeholder="તમારા ગામનું નામ અહીં લખો..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleCustomVillageConfirm}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                  >
                    ઉમેરો & પસંદ કરો
                  </button>
                </div>
              )}

              {/* Village Grid Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredVillages.map((v) => {
                  const isSelected = selectedVillageId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVillageChange(v.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition text-xs font-medium flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{v.nameGujarati || v.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ૫. સમાજ શાખા / મંડળ (SAMAJ CHAPTER SELECTION) */}
        {/* ========================================================================= */}
        <section className={`bg-slate-950 border rounded-3xl p-5 sm:p-6 shadow-xl transition-all ${
          !selectedMainSamajId ? "border-slate-850 opacity-60" : "border-slate-800"
        }`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold grid place-items-center">
                  ૫
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  સમાજ શાખા / મંડળ પસંદ કરો <span className="text-red-400">*</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-8">
                તમારા ગામ/વિસ્તાર સાથે જોડાયેલ માન્ય સમાજ શાખા
              </p>
            </div>
            {selectedSamajId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                <Check className="w-3.5 h-3.5" /> {activeSamaj?.nameGujarati || activeSamaj?.name}
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={samajSearch}
              onChange={(e) => setSamajSearch(e.target.value)}
              placeholder="સમાજ શાખા શોધો (દા.ત. કડવા પાટીદાર, અમદાવાદ, સુરત, પંચાલ...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Samaj Cards List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {filteredSamajChapters.map((s) => {
              const isSelected = selectedSamajId === s.id;
              const isExactVillageMatch = selectedVillageId && s.villageId === selectedVillageId;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSamajId(s.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl grid place-items-center text-xs font-bold shrink-0 ${
                      isSelected ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400"
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {s.nameGujarati || s.name}
                        {isExactVillageMatch && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-normal">
                            વતન શાખા
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.district ? `જિલ્લો: ${s.district}` : "કેન્દ્રીય શાખા"} · કોડ: {s.code || "SAMAJ"}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border grid place-items-center shrink-0 ${
                    isSelected 
                      ? "bg-amber-600 border-amber-500 text-white" 
                      : "border-slate-700 bg-slate-800"
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SUMMARY & SUBMISSION BUTTON (BOTTOM OF PAGE) */}
        {/* ========================================================================= */}
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/50 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-white">
              તમારી પસંદ કરેલ વિગતોની સમીક્ષા (Summary)
            </h3>
          </div>

          {/* Review Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">૧. મુખ્ય સમાજ</span>
              <span className="font-semibold text-purple-300 truncate block">
                {activeMainSamaj?.nameGujarati || activeMainSamaj?.name || "— પસંદ કરો —"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">૨. જિલ્લો</span>
              <span className="font-semibold text-indigo-300 truncate block">
                {activeDistrict?.nameGujarati || activeDistrict?.name || "— પસંદ કરો —"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">૩. તાલુકો</span>
              <span className="font-semibold text-sky-300 truncate block">
                {activeTaluka?.nameGujarati || activeTaluka?.name || "— પસંદ કરો —"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">૪. ગામ / વતન</span>
              <span className="font-semibold text-emerald-300 truncate block">
                {activeVillage?.nameGujarati || activeVillage?.name || customVillageName || "— પસંદ કરો —"}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 block">૫. સમાજ શાખા</span>
              <span className="font-semibold text-amber-300 truncate block">
                {activeSamaj?.nameGujarati || activeSamaj?.name || "— પસંદ કરો —"}
              </span>
            </div>
          </div>

          {/* Validation Alert if incomplete */}
          {!isFormComplete && (
            <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                નોંધણી પૂર્ણ કરવા માટે કૃપા કરીને ઉપરના બધા ૫ વિકલ્પો પસંદ કરો.
              </span>
            </div>
          )}

          {/* Complete Registration Action Button */}
          <button
            type="button"
            onClick={handleCompleteOnboarding}
            disabled={!isFormComplete || isSubmitting}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isFormComplete && !isSubmitting
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white hover:opacity-95 shadow-purple-900/40 hover:scale-[1.01]"
                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <span>સાચવી રહ્યા છીએ...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>નોંધણી પૂર્ણ કરો અને સમાજ કનેક્ટ શરૂ કરો</span>
              </>
            )}
          </button>
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 text-center text-xs text-slate-500 mt-4">
        તમારી સમાજ પસંદગી તમારા પ્રોફાઇલ સાથે સુરક્ષિત રીતે જોડાયેલ રહેશે · SAMAJ CONNECT © 2026
      </footer>
    </div>
  );
}
