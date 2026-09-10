import React from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const CHAT_THEMES = {
  default: {
    id: "default",
    name: "સમાજ પર્પલ (Samaj Purple)",
    bgClass: "bg-[#efe7f7]",
    bubbleMine: "bg-purple-900 text-white",
    btnMine: "bg-purple-900 hover:bg-purple-800 text-white",
    accentText: "text-purple-700",
    swatch: "bg-purple-900",
    bgSwatch: "bg-[#efe7f7]",
  },
  indigo: {
    id: "indigo",
    name: "રોયલ ઈન્ડિગો (Royal Indigo)",
    bgClass: "bg-[#e0e7ff]",
    bubbleMine: "bg-indigo-900 text-white",
    btnMine: "bg-indigo-900 hover:bg-indigo-800 text-white",
    accentText: "text-indigo-700",
    swatch: "bg-indigo-900",
    bgSwatch: "bg-[#e0e7ff]",
  },
  emerald: {
    id: "emerald",
    name: "શાંતિ ગ્રીન (Emerald Peace)",
    bgClass: "bg-[#dcfce7]",
    bubbleMine: "bg-emerald-900 text-white",
    btnMine: "bg-emerald-900 hover:bg-emerald-800 text-white",
    accentText: "text-emerald-700",
    swatch: "bg-emerald-900",
    bgSwatch: "bg-[#dcfce7]",
  },
  rose: {
    id: "rose",
    name: "ગુલાબી રોઝ (Rose Silk)",
    bgClass: "bg-[#ffe4e6]",
    bubbleMine: "bg-rose-900 text-white",
    btnMine: "bg-rose-900 hover:bg-rose-800 text-white",
    accentText: "text-rose-700",
    swatch: "bg-rose-900",
    bgSwatch: "bg-[#ffe4e6]",
  },
  amber: {
    id: "amber",
    name: "સુવર્ણ એમ્બર (Warm Amber)",
    bgClass: "bg-[#fef3c7]",
    bubbleMine: "bg-amber-900 text-white",
    btnMine: "bg-amber-900 hover:bg-amber-800 text-white",
    accentText: "text-amber-700",
    swatch: "bg-amber-900",
    bgSwatch: "bg-[#fef3c7]",
  },
  slate: {
    id: "slate",
    name: "મિડનાઇટ સ્લેટ (Midnight Slate)",
    bgClass: "bg-[#f1f5f9]",
    bubbleMine: "bg-slate-900 text-white",
    btnMine: "bg-slate-900 hover:bg-slate-800 text-white",
    accentText: "text-slate-700",
    swatch: "bg-slate-900",
    bgSwatch: "bg-[#f1f5f9]",
  },
};

export function ThemePickerModal({ open, onOpenChange, currentTheme = "default", onSelectTheme }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-testid="chat-theme-modal">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">ચેટ થીમ પસંદ કરો (Chat Theme)</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            આ વાતચીત માટે મનપસંદ થીમ પસંદ કરો
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5 py-2">
          {Object.values(CHAT_THEMES).map((th) => {
            const isSelected = currentTheme === th.id;
            return (
              <button
                key={th.id}
                data-testid={`theme-option-${th.id}`}
                onClick={() => {
                  onSelectTheme(th.id);
                  onOpenChange(false);
                }}
                className={`flex flex-col p-3 rounded-2xl border-2 transition-all text-left relative ${
                  isSelected ? "border-purple-800 shadow-sm bg-purple-50/50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`h-12 w-full rounded-xl ${th.bgSwatch} p-2 flex items-center justify-end mb-2 border border-black/5`}>
                  <div className={`w-8 h-4 rounded-full ${th.swatch}`} />
                </div>
                <div className="text-xs font-semibold text-slate-800 leading-snug">{th.name}</div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-900 text-white grid place-items-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
