import React from "react";
import { Globe, Users, Lock, Building2, UserCheck, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const VIS = {
  samaj: {
    icon: Users,
    gu: "મારી સમાજ",
    en: "My Samaj",
    desc: "ફક્ત તમારી સમાજના સભ્યો જોઈ શકે છે",
    cls: "bg-purple-50 text-purple-800 border-purple-200",
  },
  followers: {
    icon: UserCheck,
    gu: "મારા Followers",
    en: "Followers",
    desc: "ફક્ત તમને ફોલો કરતા સભ્યો જ જોઈ શકશે",
    cls: "bg-blue-50 text-blue-800 border-blue-200",
  },
  public: {
    icon: Globe,
    gu: "જાહેર (Public)",
    en: "Public",
    desc: "બધા યુઝર્સ આ સામગ્રી જોઈ શકે છે",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  only_me: {
    icon: Lock,
    gu: "માત્ર હું (Only Me)",
    en: "Only Me",
    desc: "ફક્ત તમે જ આ સામગ્રી જોઈ શકશો",
    cls: "bg-slate-100 text-slate-700 border-slate-200",
  },
  private: {
    icon: Lock,
    gu: "માત્ર હું (Only Me)",
    en: "Only Me",
    desc: "ફક્ત તમે જ આ સામગ્રી જોઈ શકશો",
    cls: "bg-slate-100 text-slate-700 border-slate-200",
  },
  all_samaj: {
    icon: Building2,
    gu: "બધા સમાજ",
    en: "All Samaj",
    desc: "તમામ સમાજના નોંધાયેલા સભ્યો",
    cls: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
};

export const VisibilityBadge = ({ value = "samaj" }) => {
  const { lang } = useApp();
  const v = VIS[value] || VIS.samaj;
  return (
    <span
      data-testid={`visibility-badge-${value}`}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v.cls}`}
    >
      <v.icon className="w-3 h-3" /> {v[lang] || v.gu}
    </span>
  );
};

// Compact Dropdown Selector with Point 3 Privacy Options
export const VisibilitySelect = ({
  value = "samaj",
  onChange,
  testId = "visibility-select",
  className = "",
}) => {
  const { lang, isAdmin } = useApp();
  const opts = isAdmin
    ? ["samaj", "followers", "public", "only_me", "all_samaj"]
    : ["samaj", "followers", "public", "only_me"];

  // Normalize legacy private value
  const curValue = value === "private" ? "only_me" : value;

  return (
    <select
      data-testid={testId}
      value={curValue}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-semibold bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer ${className}`}
    >
      {opts.map((k) => (
        <option key={k} value={k}>
          {VIS[k][lang] || VIS[k].gu}
        </option>
      ))}
    </select>
  );
};

// Rich Interactive Privacy Selector (Point 3 - Requirement 6, 7, 8)
export const PrivacySelector = ({
  value = "samaj",
  onChange,
  className = "",
  testIdPrefix = "privacy-option",
}) => {
  const { lang, isAdmin } = useApp();
  const options = [
    { key: "samaj", isDefault: true },
    { key: "followers", isDefault: false },
    { key: "public", isDefault: false },
    { key: "only_me", isDefault: false },
    ...(isAdmin ? [{ key: "all_samaj", isDefault: false }] : []),
  ];

  const curValue = value === "private" ? "only_me" : value;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
          {lang === "en" ? "Who can see this?" : "કોણ જોઈ શકે છે?"}
        </span>
        <span className="text-[10px] text-purple-700 font-medium">
          {lang === "en" ? "Default: My Samaj" : "ડિફૉલ્ટ: મારી સમાજ"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {options.map(({ key, isDefault }) => {
          const item = VIS[key];
          const isSelected = curValue === key;
          const Icon = item.icon;
          return (
            <button
              key={key}
              type="button"
              data-testid={`${testIdPrefix}-${key}`}
              onClick={() => onChange(key)}
              className={`flex flex-col items-start text-left p-2 rounded-xl border transition-all ${
                isSelected
                  ? "border-purple-600 bg-purple-50/80 shadow-sm ring-1 ring-purple-500"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div
                  className={`w-6 h-6 rounded-lg grid place-items-center ${
                    isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isDefault && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">
                    ડિફૉલ્ટ
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold leading-tight ${isSelected ? "text-purple-950" : "text-slate-800"}`}>
                {item[lang] || item.gu}
              </span>
              <span className="text-[10px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

