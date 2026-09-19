import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Flame,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Share2,
  Send,
  Sparkles,
  X,
  MessageSquare,
  Users,
  Upload,
  Camera,
  Film,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function MaranNodh() {
  const nav = useNavigate();
  const { user } = useApp();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "upcoming"
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formDeathDate, setFormDeathDate] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formBesnuDate, setFormBesnuDate] = useState("");
  const [formBesnuTime, setFormBesnuTime] = useState("સાંજે ૪:૦૦ થી ૬:૦૦");
  const [formBesnuVenue, setFormBesnuVenue] = useState("");
  const [formFamilyMembers, setFormFamilyMembers] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Tributes state: expanded condolence box for card id
  const [expandedCondolenceId, setExpandedCondolenceId] = useState(null);
  const [condolenceText, setCondolenceText] = useState("");

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/maran-nodh");
      const raw = data?.records || data?.items || [];
      const normalized = raw.map((r) => ({
        ...r,
        id: r.id,
        name: r.name || r.deceasedName || "સ્વર્ગસ્થ સભ્ય",
        deceasedName: r.deceasedName || r.name || "સ્વર્ગસ્થ સભ્ય",
        age: r.age,
        deathDate: r.deathDate || r.passedDate || "",
        passedDate: r.passedDate || r.deathDate || "",
        village: r.village || "",
        currentCity: r.currentCity || "",
        photo: r.photo || (r.gender === "female"
          ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80"),
        besnuDate: r.besnuDate || "",
        besnuTime: r.besnuTime || "",
        besnuVenue: r.besnuVenue || "",
        tributes: r.tributes || {
          diya: r.diyaCount || 0,
          flower: r.flowerCount || 0,
        },
        familyMembers: Array.isArray(r.familyMembers)
          ? r.familyMembers
          : (r.grievingFamily ? r.grievingFamily.split(",").map((s) => s.trim()).filter(Boolean) : []),
        contactPhone: r.contactPhone || "",
        notes: r.notes || "",
        condolences: r.condolences || [],
      }));
      setRecords(normalized);
    } catch {
      toast.error("મરણ નોંધ ડેટા લોડ કરવામાં ભૂલ આવી");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("ફોટો સાઈઝ 8MB કરતાં નાની હોવી જોઈએ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormPhoto(reader.result);
      toast.success("ફોટો પસંદ થયો");
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      toast.error("કૃપા કરીને સ્વર્ગસ્થનું નામ દાખલ કરો");
      return;
    }

    const dDate = formDeathDate || new Date().toISOString().split("T")[0];

    const payload = {
      deceasedName: cleanName,
      name: cleanName,
      age: formAge ? Number(formAge) : undefined,
      deathDate: dDate,
      passedDate: dDate,
      village: formVillage.trim(),
      currentCity: formCity.trim(),
      photo: formPhoto.trim(),
      besnuDate: formBesnuDate,
      besnuTime: formBesnuTime.trim(),
      besnuVenue: formBesnuVenue.trim(),
      grievingFamily: formFamilyMembers.trim(),
      familyMembers: formFamilyMembers
        ? formFamilyMembers.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      contactPhone: formContactPhone.trim(),
      notes: formNotes.trim(),
    };

    try {
      await api.post("/maran-nodh", payload);
      toast.success("મરણ નોંધ અને શ્રદ્ધાંજલિ રીલ સફળતાપૂર્વક પ્રસિદ્ધ થઈ! 🕊️");
      setModalOpen(false);
      // Reset
      setFormName("");
      setFormAge("");
      setFormDeathDate("");
      setFormVillage("");
      setFormCity("");
      setFormPhoto("");
      setFormBesnuDate("");
      setFormBesnuVenue("");
      setFormFamilyMembers("");
      setFormContactPhone("");
      setFormNotes("");
      fetchRecords();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || "પ્રસિદ્ધ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.";
      toast.error(msg);
    }
  };

  const handleTribute = async (id, type) => {
    try {
      const { data } = await api.post(`/maran-nodh/${id}/tribute`, { type });
      if (data?.record) {
        setRecords((prev) => prev.map((r) => (r.id === id ? data.record : r)));
        toast.success(type === "diya" ? "દીવો પ્રગટાવવામાં આવ્યો 🪔" : "પુષ્પાંજલિ અર્પણ કરવામાં આવી 🌸");
      }
    } catch {
      toast.error("શ્રદ્ધાંજલિ નોંધવામાં ભૂલ આવી");
    }
  };

  const handleAddCondolence = async (id) => {
    if (!condolenceText.trim()) return;
    try {
      const { data } = await api.post(`/maran-nodh/${id}/condolence`, {
        text: condolenceText.trim(),
      });
      if (data?.record) {
        setRecords((prev) => prev.map((r) => (r.id === id ? data.record : r)));
        setCondolenceText("");
        toast.success("સાંત્વના સંદેશ મોકલવામાં આવ્યો 🕊️");
      }
    } catch {
      toast.error("સંદેશ મોકલવામાં ભૂલ આવી");
    }
  };

  const handleShare = (r) => {
    const text = `🕊️ *મરણ નોંધ અને બેસણું - સમાજ કનેક્ટ* 🕊️\n\nસ્વર્ગસ્થ: ${r.name}\nઉંમર: ${r.age || "-"} વર્ષ\nસ્વર્ગવાસ તારીખ: ${r.deathDate}\nગામ/વતન: ${r.village || ""}\n\n*બેસણું વિગત:*\nતારીખ: ${r.besnuDate || "જાહેર થશે"}\nસમય: ${r.besnuTime || ""}\nસ્થળ: ${r.besnuVenue || ""}\nસંપર્ક: ${r.contactPhone || ""}\n\nઓમ શાંતિ... સદ્ગતના આત્માને પરમકૃપાળુ પરમાત્મા શાંતિ અર્પે તેવી પ્રાર્થના.`;
    if (navigator.share) {
      navigator.share({ title: "મરણ નોંધ", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("બેસણાની વિગત કૉપી થઈ ગઈ છે!");
    }
  };

  const filteredRecords = useMemo(() => {
    let list = records;
    if (activeTab === "upcoming") {
      const today = new Date().toISOString().split("T")[0];
      list = list.filter((r) => r.besnuDate && r.besnuDate >= today);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.village?.toLowerCase().includes(q) ||
        r.currentCity?.toLowerCase().includes(q)
    );
  }, [records, activeTab, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20" data-testid="maran-nodh-page">
      {/* Memorial Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-6 rounded-3xl shadow-lg border border-amber-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6 text-9xl">
          🕊️
        </div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav(-1)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="પાછા જાઓ"
            >
              <ArrowLeft className="w-5 h-5 text-amber-200" />
            </button>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold flex items-center gap-2 text-amber-100">
              <span>🕊️</span>
              મરણ નોંધ અને બેસણું (Obituary & Besnu)
            </h1>
          </div>
          <p className="text-amber-200/80 text-xs sm:text-sm pl-9 max-w-xl">
            સમાજના સ્વર્ગસ્થ વડીલો તથા સ્વજનોને ભાવભીની શ્રદ્ધાંજલિ, બેસણા અને સાંત્વના પાઠવવાનું સત્તાવાર મંચ
          </p>
          <div className="pt-2 pl-9 flex items-center gap-2 flex-wrap">
            <button
              data-testid="add-maran-nodh-btn"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> + નવી મરણ નોંધ / બેસણું ઉમેરો
            </button>
            <button
              onClick={() => nav("/reels")}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-400/40 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Film className="w-4 h-4 text-amber-400" /> 🎥 શ્રદ્ધાંજલિ રીલ્સ જુઓ (Reels)
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            data-testid="tab-all-obituaries"
            onClick={() => setActiveTab("all")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-stone-900 text-amber-300 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            તમામ નોંધ ({records.length})
          </button>
          <button
            data-testid="tab-upcoming-besnu"
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "upcoming"
                ? "bg-stone-900 text-amber-300 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            બેસણું બાકી હોય તેવા
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="સ્વર્ગસ્થનું નામ અથવા ગામ શોધો..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Obituary List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500 border border-slate-100 shadow-xs">
            <p className="text-sm">કોઈ મરણ નોંધ મળી નથી.</p>
          </div>
        ) : (
          filteredRecords.map((r) => (
            <div
              key={r.id}
              data-testid={`maran-nodh-card-${r.id}`}
              className="bg-white rounded-3xl border-2 border-amber-200/70 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              {/* Decorative Peace Border Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-stone-800 to-amber-400" />

              {/* Main Card Content */}
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                {/* Photo in Memorial Frame */}
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-300 bg-amber-50 shadow-inner grid place-items-center">
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-stone-400">
                        <div className="text-3xl mb-1">🕊️</div>
                        <div className="text-[10px] font-bold">ઓમ શાંતિ</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                    ઓમ શાંતિ 🕊️
                  </div>
                </div>

                {/* Information Column */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>સ્વ. {r.name}</span>
                        {r.age && (
                          <span className="text-xs font-normal text-slate-500">
                            (ઉંમર {r.age} વર્ષ)
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-stone-600 flex items-center gap-2 mt-0.5">
                        {r.village && <span>વતન: <strong>{r.village}</strong></span>}
                        {r.currentCity && <span>| હાલ: <strong>{r.currentCity}</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start flex-wrap">
                      <button
                        onClick={() => nav(`/reels?maranId=${r.id}`)}
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="રીલમાં શ્રદ્ધાંજલિ જુઓ"
                      >
                        <Film className="w-3.5 h-3.5 text-purple-700" />
                        <span>રીલમાં જુઓ</span>
                      </button>
                      <button
                        onClick={() => handleShare(r)}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="વોટ્સએપ પર શેર કરો"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>શેર કરો</span>
                      </button>
                    </div>
                  </div>

                  {/* Death Date */}
                  <div className="text-xs text-rose-900 bg-rose-50 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>સ્વર્ગવાસ તારીખ: {r.deathDate}</span>
                  </div>

                  {/* Besnu Box */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-800" />
                      <span>બેસણું (પ્રાર્થના સભા વિગત):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <strong>તારીખ:</strong> {r.besnuDate || "સંપર્ક કરવો"}
                      </div>
                      <div>
                        <strong>સમય:</strong> {r.besnuTime || "સાંજે ૪:૦૦ થી ૬:૦૦"}
                      </div>
                      <div className="sm:col-span-2">
                        <strong>સ્થળ:</strong> {r.besnuVenue || "નિવાસ સ્થાન"}
                      </div>
                    </div>
                  </div>

                  {/* Grieving Family & Contact */}
                  {r.familyMembers && r.familyMembers.length > 0 && (
                    <div className="text-xs text-slate-600">
                      <strong>લિ. શોકગ્રસ્ત પરિવાર:</strong>{" "}
                      {Array.isArray(r.familyMembers)
                        ? r.familyMembers.join(", ")
                        : r.familyMembers}
                    </div>
                  )}

                  {r.contactPhone && (
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-800" />
                      <span>સંપર્ક / સાંત્વના નંબર: </span>
                      <a href={`tel:${r.contactPhone}`} className="font-bold text-purple-900 hover:underline">
                        {r.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Tributes Action Bar: Diya, Flowers, Condolence */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    data-testid={`diya-btn-${r.id}`}
                    onClick={() => handleTribute(r.id, "diya")}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <span>🪔</span>
                    <span>દીવો પ્રગટાવો</span>
                    <span className="bg-white/80 px-1.5 py-0.2 rounded-md text-[10px]">
                      {r.tributes?.diya || 0}
                    </span>
                  </button>

                  <button
                    data-testid={`flower-btn-${r.id}`}
                    onClick={() => handleTribute(r.id, "flower")}
                    className="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <span>🌸</span>
                    <span>પુષ્પાંજલિ</span>
                    <span className="bg-white/80 px-1.5 py-0.2 rounded-md text-[10px]">
                      {r.tributes?.flower || 0}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    setExpandedCondolenceId(expandedCondolenceId === r.id ? null : r.id)
                  }
                  className="text-stone-700 hover:text-stone-950 font-bold flex items-center gap-1.5 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>સાંત્વના સંદેશાઓ ({r.condolences?.length || 0})</span>
                </button>
              </div>

              {/* Condolences Accordion Section */}
              {expandedCondolenceId === r.id && (
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 animate-in fade-in duration-150">
                  <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <span>🕊️</span> સાંત્વના અને શોક સંદેશાઓ
                  </h4>

                  {/* List of condolences */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {r.condolences && r.condolences.length > 0 ? (
                      r.condolences.map((c) => (
                        <div key={c.id} className="bg-white p-2.5 rounded-xl border border-stone-200/80 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 mb-0.5">
                            <span>{c.userName}</span>
                            <span className="text-stone-400 font-normal">
                              {new Date(c.createdAt).toLocaleDateString("gu-IN")}
                            </span>
                          </div>
                          <p className="text-stone-600">{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-400 italic">હજુ કોઈ સંદેશ નથી. પ્રથમ સાંત્વના પાઠવો.</p>
                    )}
                  </div>

                  {/* Input form */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={condolenceText}
                      onChange={(e) => setCondolenceText(e.target.value)}
                      placeholder="ઓમ શાંતિ... તમારો સાંત્વના સંદેશ લખો..."
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleAddCondolence(r.id)}
                    />
                    <button
                      onClick={() => handleAddCondolence(r.id)}
                      className="px-4 py-2 bg-stone-900 text-amber-300 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" /> મોકલો
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Obituary Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-1.5">
                <span>🕊️</span> નવી મરણ નોંધ / બેસણું ઉમેરો
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 text-xs sm:text-sm">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  સ્વર્ગસ્થનું પૂરું નામ *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="દા.ત. રમણિકભાઈ મગનભાઈ પટેલ"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>

              {/* Age & Death Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ઉંમર (Age)</label>
                  <input
                    type="number"
                    min="1"
                    max="130"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="દા.ત. ૭૮"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">સ્વર્ગવાસ તારીખ *</label>
                  <input
                    type="date"
                    required
                    value={formDeathDate}
                    onChange={(e) => setFormDeathDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* Village & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">મૂળ ગામ / વતન</label>
                  <input
                    type="text"
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    placeholder="દા.ત. ઉંઝા"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">હાલ રહેઠાણ શહેર</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="દા.ત. અમદાવાદ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* Photo Upload or URL */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  સ્વર્ગસ્થ ફોટો (ગેલરીમાંથી અથવા લિંક)
                </label>
                <div className="flex items-center gap-3 p-2 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
                  <div className="w-14 h-16 rounded-xl bg-amber-100/70 border-2 border-dashed border-amber-300 grid place-items-center overflow-hidden shrink-0">
                    {formPhoto ? (
                      <img src={formPhoto} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold cursor-pointer transition shadow-xs">
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{formPhoto ? "ફોટો બદલો" : "મોબાઇલ ગેલરી / કેમેરા માંથી લો"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
                    </label>
                    <input
                      type="url"
                      value={formPhoto.startsWith("data:") ? "" : formPhoto}
                      onChange={(e) => setFormPhoto(e.target.value)}
                      placeholder="અથવા ફોટો વેબ લિંક (https://...) પેસ્ટ કરો"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Besnu details group */}
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-800" />
                  <span>બેસણું (પ્રાર્થના સભા વિગતો)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">બેસણાની તારીખ</label>
                    <input
                      type="date"
                      value={formBesnuDate}
                      onChange={(e) => setFormBesnuDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">બેસણાનો સમય</label>
                    <input
                      type="text"
                      value={formBesnuTime}
                      onChange={(e) => setFormBesnuTime(e.target.value)}
                      placeholder="દા.ત. સાંજે ૪:૦૦ થી ૬:૦૦"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">બેસણાનું સ્થળ / હોલ / સરનામું</label>
                  <input
                    type="text"
                    value={formBesnuVenue}
                    onChange={(e) => setFormBesnuVenue(e.target.value)}
                    placeholder="દા.ત. પાટીદાર વાડી, ઉંઝા"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Family members & Contact */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  શોકગ્રસ્ત પરિવારના નામો (અલ્પવિરામથી અલગ કરો)
                </label>
                <input
                  type="text"
                  value={formFamilyMembers}
                  onChange={(e) => setFormFamilyMembers(e.target.value)}
                  placeholder="દા.ત. કમલેશભાઈ (પુત્ર), ભાવેશભાઈ (પુત્ર), ગીતાબેન (પુત્રી)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">સંપર્ક / સાંત્વના નંબર</label>
                <input
                  type="tel"
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                  placeholder="દા.ત. 9825012345"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold rounded-xl shadow-md transition-all"
                >
                  પ્રસિદ્ધ કરો (Publish)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
