import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Phone, MessageCircle, Share2, Plus, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";

const openWhatsApp = (m) => window.open(`https://wa.me/${m.replace(/\D/g, "")}`, "_blank");
const callNumber = (m) => (window.location.href = `tel:${m}`);

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((it) => {
    if (!it?.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

export default function Members() {
  const { t } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      const { data } = await api.get("/members", { params });
      setItems(dedupeById(data.items));
    } finally { setLoading(false); }
  }, [q]);

  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">સભ્યો શોધો</h2>
        <button
          data-testid="members-add-button"
          onClick={() => nav("/members/add")}
          className="inline-flex items-center gap-1 bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold px-3.5 py-2 rounded-full shadow"
        >
          <Plus className="w-4 h-4" /> {t("add")}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          data-testid={IDS.memberSearch}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search_members")}
          className="flex-1 py-2 outline-none text-sm placeholder:text-slate-400"
        />
        <button data-testid="members-search-submit" onClick={load} className="bg-purple-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{t("search")}</button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {["all", "village", "district", "bloodGroup"].map((k) => (
          <button
            key={k}
            data-testid={`member-tab-${k}`}
            onClick={() => setFilter(k)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap border transition ${filter === k ? "bg-purple-900 text-white border-purple-900" : "bg-white text-slate-700 border-slate-200 hover:border-purple-300"}`}
          >
            {k === "all" ? t("all") : k === "village" ? t("village") + " મુજબ" : k === "district" ? t("district") + " મુજબ" : t("blood_group") + " મુજબ"}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
        {!loading && items.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">
            {t("no_data")}
          </div>
        )}
        {!loading && dedupeById(items).map((m) => (
          <div key={m.id} data-testid={`member-card-${m.id}`} className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <button onClick={() => nav(`/members/${m.id}`)} className="w-14 h-14 rounded-full bg-purple-100 border-2 border-purple-200 grid place-items-center text-purple-800 font-extrabold overflow-hidden">
              {m.profilePhoto ? <img src={m.profilePhoto} alt="" className="w-full h-full object-cover" /> : (m.name?.[0] || "?").toUpperCase()}
            </button>
            <button onClick={() => nav(`/members/${m.id}`)} className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-slate-900 truncate">{m.name}</div>
              <div className="text-xs text-slate-500 truncate">
                {m.village || "—"}{m.district ? `, ${m.district}` : ""}
              </div>
              <div className="text-xs text-purple-800 font-medium mt-0.5">📞 {m.mobile}</div>
            </button>
            <div className="flex items-center gap-1.5">
              <button data-testid={`member-call-${m.id}`} onClick={() => callNumber(m.mobile)} className="px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold rounded-full flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{t("call")}</button>
              <button data-testid={`member-whatsapp-${m.id}`} onClick={() => openWhatsApp(m.mobile)} className="p-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><MessageCircle className="w-4 h-4" /></button>
              <button data-testid={`member-share-${m.id}`} onClick={() => navigator.share?.({ title: m.name, text: `${m.name} — ${m.mobile}` }).catch(() => {})} className="p-2 rounded-full bg-slate-50 text-slate-600 border border-slate-200 hidden sm:inline-flex"><Share2 className="w-4 h-4" /></button>
              <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
