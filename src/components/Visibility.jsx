import React from "react";
import { Globe, Users, Lock, Building2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const VIS = {
  samaj: { icon: Users, gu: "ફક્ત સમાજ", en: "Samaj Only", cls: "bg-purple-50 text-purple-800 border-purple-200" },
  all_samaj: { icon: Building2, gu: "બધા સમાજ", en: "All Samaj", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  public: { icon: Globe, gu: "પબ્લિક", en: "Public", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  private: { icon: Lock, gu: "પ્રાઇવેટ", en: "Private", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

export const VisibilityBadge = ({ value = "samaj" }) => {
  const { lang } = useApp();
  const v = VIS[value] || VIS.samaj;
  return (
    <span data-testid={`visibility-badge-${value}`} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v.cls}`}>
      <v.icon className="w-3 h-3" /> {v[lang] || v.gu}
    </span>
  );
};

// Members may pick samaj/private; admins also all_samaj/public (enforced again server-side)
export const VisibilitySelect = ({ value, onChange, testId = "visibility-select", className = "" }) => {
  const { lang, isAdmin } = useApp();
  const opts = isAdmin ? Object.keys(VIS) : ["samaj", "private"];
  return (
    <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-semibold bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-300 ${className}`}>
      {opts.map((k) => <option key={k} value={k}>{VIS[k][lang] || VIS[k].gu}</option>)}
    </select>
  );
};
