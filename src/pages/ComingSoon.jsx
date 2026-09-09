import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ComingSoon() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const m = sp.get("m") || "module";
  const labels = {
    messenger: "મેસેન્જર", live: "લાઈવ સ્ટ્રીમ", hall: "હોલ / રૂમ બુકિંગ",
    family: "ફેમિલી ટ્રી", maran: "મરણ નોંધ", business: "બિઝનેસ ડિરેક્ટરી",
    gallery: "ફોટો ગેલેરી", cloud: "ક્લાઉડ ફોટોઝ",
  };
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <button data-testid="coming-back" onClick={() => nav(-1)} className="absolute left-4 top-16 p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
      <div className="mx-auto w-20 h-20 rounded-3xl bg-purple-50 border border-purple-100 grid place-items-center text-purple-800 shadow-sm">
        <Sparkles className="w-9 h-9" />
      </div>
      <h2 className="font-heading font-extrabold text-slate-900 text-2xl mt-5">{labels[m] || "Module"}</h2>
      <p className="text-slate-500 mt-2 text-sm">આ મોડ્યુલ ટૂંક સમયમાં ઉપલબ્ધ થશે.</p>
      <p className="text-slate-400 mt-1 text-xs">Phase 2/3/4 માં લોન્ચ થશે — architecture પહેલેથી તૈયાર છે.</p>
    </div>
  );
}
