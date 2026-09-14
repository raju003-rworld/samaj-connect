import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  ArrowLeft,
  Phone,
  MessageCircle,
  Share2,
  Trash2,
  Edit2,
  Printer,
  Sparkles,
  Heart,
  Calendar,
  Briefcase,
  GraduationCap,
  MapPin,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const RELATIONS = [
  { key: "grandfather", label: "દાદા (Grandfather)", gen: -2, gender: "male" },
  { key: "grandmother", label: "દાદી (Grandmother)", gen: -2, gender: "female" },
  { key: "father", label: "પિતા (Father)", gen: -1, gender: "male" },
  { key: "mother", label: "માતા (Mother)", gen: -1, gender: "female" },
  { key: "uncle_kaka", label: "કાકા (Uncle)", gen: -1, gender: "male" },
  { key: "aunt_kaki", label: "કાકી (Aunt)", gen: -1, gender: "female" },
  { key: "self", label: "સ્વયં (Self)", gen: 0, gender: "male" },
  { key: "spouse", label: "પત્ની / પતિ (Spouse)", gen: 0, gender: "female" },
  { key: "brother", label: "ભાઈ (Brother)", gen: 0, gender: "male" },
  { key: "sister", label: "બહેન (Sister)", gen: 0, gender: "female" },
  { key: "bhabhi", label: "ભાભી (Sister-in-law)", gen: 0, gender: "female" },
  { key: "son", label: "પુત્ર (Son)", gen: 1, gender: "male" },
  { key: "daughter", label: "પુત્રી (Daughter)", gen: 1, gender: "female" },
  { key: "daughter_in_law", label: "પુત્રવધૂ (Daughter-in-law)", gen: 1, gender: "female" },
  { key: "son_in_law", label: "જમાઈ (Son-in-law)", gen: 1, gender: "male" },
  { key: "grandson", label: "પૌત્ર / દોહિત્ર (Grandson)", gen: 2, gender: "male" },
  { key: "granddaughter", label: "પૌત્રી / દોહિત્રી (Granddaughter)", gen: 2, gender: "female" },
  { key: "other", label: "અન્ય સગાં (Other)", gen: 0, gender: "male" },
];

const GENERATION_TIERS = [
  { gen: -2, title: "પ્રથમ પેઢી (દાદા - દાદી / વડીલો)", icon: "👴👵" },
  { gen: -1, title: "બીજી પેઢી (માતા - પિતા / કાકા - કાકી)", icon: "👨‍👩‍👧" },
  { gen: 0, title: "મુખ્ય પેઢી (સ્વયં, જીવનસાથી, ભાઈ - બહેન)", icon: "🧑‍🤝‍🧑" },
  { gen: 1, title: "આવનારી પેઢી (પુત્ર, પુત્રી, પુત્રવધૂ, જમાઈ)", icon: "👦👧" },
  { gen: 2, title: "નવી પેઢી (પૌત્ર - પૌત્રી / બાળકો)", icon: "👶" },
];

export default function FamilyTree() {
  const nav = useNavigate();
  const { user } = useApp();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "list"
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formRelation, setFormRelation] = useState("father");
  const [formGen, setFormGen] = useState(-1);
  const [formGender, setFormGender] = useState("male");
  const [formIsLate, setFormIsLate] = useState(false);
  const [formAge, setFormAge] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formOccupation, setFormOccupation] = useState("");
  const [formEducation, setFormEducation] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/family-tree");
      setMembers(data?.members || []);
    } catch {
      toast.error("ફેમિલી ટ્રી ડેટા લોડ કરવામાં ભૂલ આવી");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName("");
    setFormRelation("father");
    setFormGen(-1);
    setFormGender("male");
    setFormIsLate(false);
    setFormAge("");
    setFormPhone("");
    setFormVillage(user?.village || "ઉંઝા");
    setFormCity(user?.city || "અમદાવાદ");
    setFormOccupation("");
    setFormEducation("");
    setFormPhoto("");
    setFormNotes("");
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMember(m);
    setFormName(m.name || "");
    setFormRelation(m.relation || "other");
    setFormGen(typeof m.generation === "number" ? m.generation : 0);
    setFormGender(m.gender || "male");
    setFormIsLate(!!m.isLate);
    setFormAge(m.age ? String(m.age) : "");
    setFormPhone(m.phone || "");
    setFormVillage(m.village || "");
    setFormCity(m.currentCity || "");
    setFormOccupation(m.occupation || "");
    setFormEducation(m.education || "");
    setFormPhoto(m.photo || "");
    setFormNotes(m.notes || "");
    setModalOpen(true);
  };

  const handleRelationChange = (relKey) => {
    setFormRelation(relKey);
    const found = RELATIONS.find((r) => r.key === relKey);
    if (found) {
      setFormGen(found.gen);
      setFormGender(found.gender);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("કૃપા કરીને સભ્યનું નામ દાખલ કરો");
      return;
    }

    const relObj = RELATIONS.find((r) => r.key === formRelation);
    const payload = {
      name: formName.trim(),
      relation: formRelation,
      relationLabel: relObj?.label || formRelation,
      generation: Number(formGen),
      gender: formGender,
      isLate: formIsLate,
      age: formAge ? Number(formAge) : undefined,
      phone: formPhone.trim(),
      village: formVillage.trim(),
      currentCity: formCity.trim(),
      occupation: formOccupation.trim(),
      education: formEducation.trim(),
      photo: formPhoto.trim(),
      notes: formNotes.trim(),
    };

    try {
      if (editingMember) {
        await api.put(`/family-tree/${editingMember.id}`, payload);
        toast.success("સભ્યની વિગત સુધારાઈ ગઈ");
      } else {
        await api.post("/family-tree", payload);
        toast.success("પરિવારના નવા સભ્ય ઉમેરાઈ ગયા");
      }
      setModalOpen(false);
      fetchMembers();
    } catch {
      toast.error("સાચવવામાં ભૂલ થઈ. ફરી પ્રયત્ન કરો.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`શું તમે '${name}' ને ફેમિલી ટ્રીમાંથી દૂર કરવા માંગો છો?`)) return;
    try {
      await api.delete(`/family-tree/${id}`);
      toast.success("સભ્ય દૂર કરવામાં આવ્યા");
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      toast.error("દૂર કરવામાં ભૂલ આવી");
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.relationLabel?.toLowerCase().includes(q) ||
        m.village?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
    );
  }, [members, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:m-0" data-testid="family-tree-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-3xl shadow-md print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav(-1)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="પાછા જાઓ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-200" />
              સમાજ ફેમિલી ટ્રી (Family Tree)
            </h1>
          </div>
          <p className="text-purple-100 text-xs sm:text-sm pl-9">
            તમારા પરિવારની પેઢીઓ, સભ્યો અને સંબંધોની ડિજિટલ વંશાવલિ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto pl-9 sm:pl-0">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="વંશાવલિ પ્રિન્ટ કરો"
          >
            <Printer className="w-4 h-4" /> પ્રિન્ટ
          </button>
          <button
            data-testid="add-family-member-btn"
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-purple-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> + નવો સભ્ય ઉમેરો
          </button>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs print:hidden">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            data-testid="view-tree-btn"
            onClick={() => setViewMode("tree")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === "tree"
                ? "bg-purple-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🌳 વંશાવલિ પેઢી વ્યુ (Tree)
          </button>
          <button
            data-testid="view-list-btn"
            onClick={() => setViewMode("list")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-purple-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 તમામ સભ્યો ({filteredMembers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="નામ, સંબંધ અથવા ગામ શોધો..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Tree Mode */}
      {viewMode === "tree" && (
        <div className="space-y-8">
          {GENERATION_TIERS.map((tier) => {
            const tierMembers = filteredMembers.filter((m) => m.generation === tier.gen);
            if (tierMembers.length === 0 && searchQuery) return null;

            return (
              <div key={tier.gen} className="space-y-3">
                {/* Generation Tier Banner */}
                <div className="flex items-center gap-2.5 pb-2 border-b-2 border-purple-100">
                  <span className="text-xl">{tier.icon}</span>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-purple-950">
                    {tier.title}
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full ml-auto">
                    {tierMembers.length} સભ્યો
                  </span>
                </div>

                {tierMembers.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400">
                    આ પેઢીમાં હજુ કોઈ સભ્ય ઉમેરેલા નથી.
                    <button
                      onClick={openAddModal}
                      className="text-purple-800 font-bold ml-1 hover:underline"
                    >
                      + સભ્ય ઉમેરો
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {tierMembers.map((m) => (
                      <FamilyMemberCard
                        key={m.id}
                        member={m}
                        onEdit={() => openEditModal(m)}
                        onDelete={() => handleDelete(m.id, m.name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List Mode */}
      {viewMode === "list" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              કુલ સભ્યો: {filteredMembers.length}
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl grid place-items-center font-extrabold overflow-hidden shrink-0 border-2 ${
                      m.isLate
                        ? "border-amber-400 bg-amber-50 text-amber-900"
                        : "border-purple-200 bg-purple-100 text-purple-900"
                    }`}
                  >
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      (m.name?.[0] || "?").toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {m.isLate && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-md">
                          સ્વર્ગસ્થ 🕊️
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-purple-800 font-semibold">
                      {m.relationLabel || m.relation} {m.age ? `(${m.age} વર્ષ)` : ""}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {m.village && <span>📍 {m.village}</span>}
                      {m.occupation && <span>💼 {m.occupation}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="p-2 bg-purple-50 text-purple-800 rounded-xl hover:bg-purple-100 text-xs font-semibold flex items-center gap-1"
                      title="કૉલ કરો"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                    title="સુધારો કરો"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id, m.name)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs"
                    title="દૂર કરો"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
                {editingMember ? "સભ્યની વિગત સુધારો" : "+ પરિવારના સભ્ય ઉમેરો"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs sm:text-sm">
              {/* Relation Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  સંબંધ (Relation) *
                </label>
                <select
                  value={formRelation}
                  onChange={(e) => handleRelationChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white text-xs sm:text-sm font-medium"
                >
                  {RELATIONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  સભ્યનું પૂરું નામ *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="દા.ત. રમણિકભાઈ પટેલ"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                />
              </div>

              {/* Status Toggle (Living / Swargath) */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700">સ્થિતિ:</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="status"
                    checked={!formIsLate}
                    onChange={() => setFormIsLate(false)}
                    className="accent-purple-800"
                  />
                  <span>હયાત (Living)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-900">
                  <input
                    type="radio"
                    name="status"
                    checked={formIsLate}
                    onChange={() => setFormIsLate(true)}
                    className="accent-amber-600"
                  />
                  <span>સ્વર્ગસ્થ (Late 🕊️)</span>
                </label>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ઉંમર (Age)</label>
                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="દા.ત. 45"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">જાતિ (Gender)</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                  >
                    <option value="male">પુરુષ (Male)</option>
                    <option value="female">સ્ત્રી (Female)</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">મોબાઇલ નંબર</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="દા.ત. 9825012345"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                />
              </div>

              {/* Village & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">વતન (Native Village)</label>
                  <input
                    type="text"
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    placeholder="દા.ત. ઉંઝા"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">હાલ રહેઠાણ (City)</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="દા.ત. અમદાવાદ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* Occupation & Education */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">વ્યવસાય / ધંધો</label>
                  <input
                    type="text"
                    value={formOccupation}
                    onChange={(e) => setFormOccupation(e.target.value)}
                    placeholder="દા.ત. વેપાર, સર્વિસ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">શિક્ષણ (Education)</label>
                  <input
                    type="text"
                    value={formEducation}
                    onChange={(e) => setFormEducation(e.target.value)}
                    placeholder="દા.ત. B.Com, MBA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ફોટો લિંક (Photo URL)</label>
                <input
                  type="url"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ખાસ નોંધ</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="પરિવાર કે સભ્ય વિશે વિશેષ નોંધ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:bg-white text-xs"
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
                  className="flex-1 py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  {editingMember ? "સુધારો સાચવો" : "+ સભ્ય ઉમેરો"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FamilyMemberCard({ member: m, onEdit, onDelete }) {
  return (
    <div
      data-testid={`family-member-card-${m.id}`}
      className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
        m.isLate
          ? "border-amber-300/80 bg-gradient-to-b from-amber-50/20 to-white"
          : "border-slate-100 hover:border-purple-200 shadow-xs"
      }`}
    >
      <div>
        {/* Card Header: Avatar & Details */}
        <div className="flex items-start gap-3">
          <div
            className={`w-13 h-13 rounded-2xl overflow-hidden grid place-items-center font-extrabold shrink-0 border-2 shadow-xs ${
              m.isLate
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : "border-purple-200 bg-purple-100 text-purple-900"
            }`}
          >
            {m.photo ? (
              <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
            ) : (
              (m.name?.[0] || "?").toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-heading font-extrabold text-sm text-slate-900 truncate">
                {m.name}
              </h4>
              {m.isLate && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-md">
                  સ્વર્ગસ્થ 🕊️
                </span>
              )}
            </div>

            <div className="text-xs font-bold text-purple-800 mt-0.5 flex items-center gap-1">
              <span>{m.relationLabel || m.relation}</span>
              {m.age && <span className="text-slate-400 font-normal">| {m.age} વર્ષ</span>}
            </div>

            {(m.village || m.currentCity) && (
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{m.village || m.currentCity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Occupation & Education Badges */}
        {(m.occupation || m.education) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
            {m.occupation && (
              <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-100">
                💼 {m.occupation}
              </span>
            )}
            {m.education && (
              <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-100">
                🎓 {m.education}
              </span>
            )}
          </div>
        )}

        {m.notes && (
          <p className="text-[11px] text-slate-500 italic mt-2 bg-purple-50/40 p-2 rounded-xl border border-purple-50">
            "{m.notes}"
          </p>
        )}
      </div>

      {/* Card Action Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div>
          {m.phone ? (
            <a
              href={`tel:${m.phone}`}
              className="inline-flex items-center gap-1 text-purple-900 font-bold hover:underline"
            >
              <Phone className="w-3.5 h-3.5" /> {m.phone}
            </a>
          ) : (
            <span className="text-slate-400 text-[11px]">સંપર્ક ઉપલબ્ધ નથી</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="સુધારો કરો"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
            title="દૂર કરો"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
