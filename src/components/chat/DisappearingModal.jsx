import React, { useState } from "react";
import { Clock, ShieldCheck, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const OPTIONS = [
  { id: "off", title: "બંધ (Off)", label: "બંધ (Off)" },
  { id: "10s", title: "10 સેકન્ડ", label: "10 સેકન્ડ" },
  { id: "30s", title: "30 સેકન્ડ", label: "30 સેકન્ડ" },
  { id: "1m", title: "1 મિનિટ", label: "1 મિનિટ" },
  { id: "5m", title: "5 મિનિટ", label: "5 મિનિટ" },
  { id: "1h", title: "1 કલાક", label: "1 કલાક" },
  { id: "1d", title: "24 કલાક", label: "24 કલાક" },
  { id: "7d", title: "7 દિવસ", label: "7 દિવસ" },
];

export function DisappearingModal({ open, onOpenChange, currentDuration = "off", onSelectDuration }) {
  const [selected, setSelected] = useState(currentDuration || "off");

  React.useEffect(() => {
    if (open) {
      setSelected(currentDuration || "off");
    }
  }, [open, currentDuration]);

  const handleSave = () => {
    onSelectDuration(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[92vw] max-w-sm max-h-[88vh] flex flex-col p-4 sm:p-5 rounded-3xl gap-3 overflow-hidden shadow-2xl"
        data-testid="disappearing-modal"
      >
        <DialogHeader className="space-y-1 shrink-0 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 grid place-items-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              અદ્રશ્ય સંદેશા (Disappearing)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-normal pt-0.5">
            મેસેજ વાંચ્યા પછી આપમેળે ડિલીટ થશે.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 py-1 pr-0.5">
          {OPTIONS.map((opt) => {
            const isSel = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`disappearing-opt-${opt.id}`}
                onClick={() => setSelected(opt.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSel
                    ? "border-purple-800 bg-purple-50/90 text-purple-950 font-semibold"
                    : "border-slate-200/90 hover:border-slate-300 text-slate-800 bg-white"
                }`}
              >
                <span className="text-sm font-medium">{opt.label || opt.title}</span>
                <div
                  className={`w-5 h-5 rounded-full border grid place-items-center transition-colors shrink-0 ${
                    isSel
                      ? "border-purple-900 bg-purple-900 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-800 shrink-0" />
          <span>બંને ડિવાઇસ પરથી સુરક્ષિત રીતે દૂર થશે.</span>
        </div>

        <div className="flex gap-2 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            રદ કરો
          </button>
          <button
            type="button"
            data-testid="save-disappearing-btn"
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-purple-900 text-white text-sm font-semibold hover:bg-purple-800 transition shadow-sm cursor-pointer"
          >
            લાગુ કરો
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
