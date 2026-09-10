import React from "react";
import { Trash2, Users, User, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function DeleteMessageModal({ open, onOpenChange, message, onDeleteConfirm }) {
  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-testid="delete-msg-modal">
        <DialogHeader>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 grid place-items-center mb-1">
            <Trash2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            મેસેજ ડિલીટ કરો (Delete Message)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            તમે આ મેસેજ કેવી રીતે ડિલીટ કરવા માંગો છો તે પસંદ કરો:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <button
            data-testid="del-everyone-btn"
            onClick={() => {
              onDeleteConfirm(message, true);
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 grid place-items-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-800">બધા માટે ડિલીટ કરો (Delete for Everyone)</div>
              <div className="text-[11px] text-rose-600">તમારા અને સામેવાળા બંનેના ચેટમાંથી હંમેશ માટે હટી જશે.</div>
            </div>
          </button>

          <button
            data-testid="del-me-btn"
            onClick={() => {
              onDeleteConfirm(message, false);
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 grid place-items-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">ફક્ત મારા માટે ડિલીટ કરો (Delete for Me)</div>
              <div className="text-[11px] text-slate-500">ફક્ત તમારી સ્ક્રીન પરથી જ આ મેસેજ હટશે.</div>
            </div>
          </button>
        </div>

        <div className="pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            રદ કરો (Cancel)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
