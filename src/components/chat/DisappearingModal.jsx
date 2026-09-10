import React, { useState } from "react";
import { Clock, ShieldCheck, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const OPTIONS = [
  { id: "off", title: "બંધ (Off)", desc: "મેસેજ આપમેળે ડિલીટ થશે નહીં" },
  { id: "1m", title: "1 મિનિટ (1 Minute)", desc: "સામેવાળો વાંચે પછી 1 મિનિટમાં ડિલીટ થશે" },
  { id: "5m", title: "5 મિનિટ (5 Minutes)", desc: "સામેવાળો વાંચે પછી 5 મિનિટમાં ડિલીટ થશે" },
  { id: "1h", title: "1 કલાક (1 Hour)", desc: "સામેવાળો વાંચે પછી 1 કલાકમાં ડિલીટ થશે" },
  { id: "1d", title: "1 દિવસ (1 Day)", desc: "સામેવાળો વાંચે પછી 24 કલાકમાં ડિલીટ થશે" },
];

export function DisappearingModal({ open, onOpenChange, currentDuration = "off", onSelectDuration }) {
  const [selected, setSelected] = useState(currentDuration);

  const handleSave = () => {
    onSelectDuration(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-testid="disappearing-modal">
        <DialogHeader>
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 grid place-items-center mb-1">
            <Clock className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            અદ્રશ્ય થતા સંદેશા (Disappearing Messages)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed">
            જ્યારે આ સેટિંગ ચાલુ હોય, ત્યારે સામેવાળો સભ્ય મેસેજ <strong>વાંચે (Read કરે)</strong> તે પછીથી ટાઈમર શરૂ થશે અને બંને બાજુથી આપમેળે મેસેજ ડિલીટ થશે.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {OPTIONS.map((opt) => {
            const isSel = selected === opt.id;
            return (
              <button
                key={opt.id}
                data-testid={`disappearing-opt-${opt.id}`}
                onClick={() => setSelected(opt.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  isSel ? "border-purple-800 bg-purple-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{opt.title}</div>
                  <div className="text-[11px] text-slate-500">{opt.desc}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border grid place-items-center ${
                    isSel ? "border-purple-900 bg-purple-900 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-purple-800 shrink-0" />
          <span>સર્વર અને બંને ડિવાઇસ પરથી આપમેળે સુરક્ષિત રીતે દૂર કરવામાં આવે છે.</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            રદ કરો
          </button>
          <button
            data-testid="save-disappearing-btn"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-2xl bg-purple-900 text-white text-sm font-semibold hover:bg-purple-800 shadow-sm"
          >
            લાગુ કરો (Apply)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
