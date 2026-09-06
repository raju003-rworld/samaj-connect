import React, { useState } from "react";
import { Building2, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Samaj switcher (join / activate). Super admin can create a new Samaj.
export const SamajSwitcher = ({ open, onOpenChange }) => {
  const { user, samajList, refreshUser, lang } = useApp();
  const [name, setName] = useState("");
  const isSuper = user?.role === "super_admin";

  const pick = async (s) => {
    const mine = user.samajIds?.includes(s.id);
    await api.post(`/samaj/${s.id}/${mine ? "activate" : "join"}`);
    await refreshUser();
    toast.success((lang === "gu" ? "સક્રિય સમાજ: " : "Active Samaj: ") + s.name);
    onOpenChange(false);
    window.location.reload();
  };
  const create = async () => {
    if (!name.trim()) return;
    await api.post("/samaj", { name });
    setName("");
    await refreshUser();
    toast.success("સમાજ બન્યો");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-testid="samaj-switcher">
        <DialogHeader>
          <DialogTitle>{lang === "gu" ? "સમાજ પસંદ કરો" : "Select Samaj"}</DialogTitle>
          <DialogDescription>{lang === "gu" ? "તમારો સક્રિય સમાજ બદલો" : "Change your active Samaj"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {samajList.map((s) => (
            <button key={s.id} data-testid={`samaj-option-${s.id}`} onClick={() => pick(s)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left ${s.id === user?.activeSamajId ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <Building2 className="w-5 h-5 text-purple-700" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{lang === "en" && s.nameEn ? s.nameEn : s.name}</div>
                <div className="text-[11px] text-slate-500">{s.code}{user?.samajIds?.includes(s.id) ? " · સભ્ય" : ""}</div>
              </div>
              {s.id === user?.activeSamajId && <Check className="w-4 h-4 text-purple-700" />}
            </button>
          ))}
          {isSuper && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input data-testid="samaj-new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="નવો સમાજ નામ" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
              <button data-testid="samaj-create-btn" onClick={create} className="px-3 rounded-xl bg-purple-900 text-white"><Plus className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
