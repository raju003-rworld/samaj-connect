import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Check, ChevronDown, Lock, Plus, Building2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SearchableCombobox({
  id,
  label,
  sublabel,
  placeholder = "પસંદ કરો (Select)...",
  value,
  selectedItem,
  options = [],
  onChange,
  disabled = false,
  disabledHint = "પહેલા અગાઉની વિગત પસંદ કરો",
  icon: Icon = Building2,
  chips = [],
  allowCustom = false,
  customLabel = "+ નવું ગામ ઉમેરો (Add New Village)",
  onAddCustom,
  required = true,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState(null);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const searchInputRef = useRef(null);

  // Reset search when opening/closing
  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveChip(null);
      setCustomInputOpen(false);
      setCustomText("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  // Filter options based on search text and active category chip
  const filteredOptions = useMemo(() => {
    let list = options || [];

    // Chip filter
    if (activeChip) {
      const chipObj = chips.find((c) => c.id === activeChip);
      if (chipObj?.filterFn) {
        list = list.filter(chipObj.filterFn);
      }
    }

    // Search query filter (matching Gujarati or English)
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const nameGu = (item.nameGujarati || item.name || "").toLowerCase();
        const nameEn = (item.nameEn || item.name || "").toLowerCase();
        const extra = (item.district || item.taluka || item.city || "").toLowerCase();
        return nameGu.includes(q) || nameEn.includes(q) || extra.includes(q);
      });
    }

    return list;
  }, [options, activeChip, chips, search]);

  const handleSelect = (item) => {
    onChange(item);
    setOpen(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (onAddCustom) {
      onAddCustom(trimmed);
      setOpen(false);
    }
  };

  const displayTitle = selectedItem
    ? selectedItem.nameGujarati || selectedItem.name
    : "";
  const displaySubtitle = selectedItem
    ? selectedItem.nameEn || (selectedItem.name !== selectedItem.nameGujarati ? selectedItem.name : "")
    : "";

  return (
    <div className="space-y-1.5 w-full" id={`combobox-container-${id}`}>
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={`btn-${id}`}
          className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
        >
          <Icon className="w-4 h-4 text-purple-700 shrink-0" />
          <span>{label}</span>
          {sublabel && (
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">
              ({sublabel})
            </span>
          )}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>

        {selectedItem && !disabled && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition underline cursor-pointer"
          >
            બદલો (Change)
          </button>
        )}
      </div>

      {/* Trigger Button */}
      <button
        id={`btn-${id}`}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
          disabled
            ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed"
            : selectedItem
            ? "bg-purple-50/40 border-purple-300 ring-1 ring-purple-300/60 shadow-xs hover:border-purple-400 cursor-pointer"
            : "bg-white border-slate-200 hover:border-purple-300 shadow-xs cursor-pointer text-slate-600"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 text-xs font-bold transition ${
              disabled
                ? "bg-slate-200/80 text-slate-400"
                : selectedItem
                ? "bg-purple-600 text-white shadow-xs shadow-purple-600/20"
                : "bg-purple-50 text-purple-700 border border-purple-100"
            }`}
          >
            {disabled ? (
              <Lock className="w-4 h-4" />
            ) : selectedItem ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {disabled ? (
              <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">
                {disabledHint}
              </p>
            ) : selectedItem ? (
              <div className="truncate">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {displayTitle}
                </span>
                {displaySubtitle && (
                  <span className="text-xs text-slate-500 ml-1.5 font-normal">
                    ({displaySubtitle})
                  </span>
                )}
                {selectedItem.memberCount && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-1.5 py-0.5 rounded-md ml-2">
                    {selectedItem.memberCount} સભ્યો
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">
                {placeholder}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {/* Searchable Picker Dialog (Mobile Bottom Sheet / Modal) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg w-[95vw] sm:w-full rounded-3xl p-0 overflow-hidden bg-white shadow-2xl border border-slate-100 max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 grid place-items-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {label}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {sublabel ? `${sublabel} — ` : ""}શોધો અથવા યાદીમાંથી પસંદ કરો
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ગુજરાતી અથવા અંગ્રેજીમાં શોધો (Search)..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition shadow-2xs font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips (if provided) */}
            {chips?.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setActiveChip(null)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                    activeChip === null
                      ? "bg-purple-700 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  તમામ ({options.length})
                </button>
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveChip(chip.id === activeChip ? null : chip.id)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                      activeChip === chip.id
                        ? "bg-purple-700 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </DialogHeader>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 divide-y divide-slate-50">
            {/* Custom Village option if allowed */}
            {allowCustom && (
              <div className="mb-2 p-2.5 rounded-2xl bg-purple-50/80 border border-purple-200/80">
                {!customInputOpen ? (
                  <button
                    type="button"
                    onClick={() => setCustomInputOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{customLabel}</span>
                  </button>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="space-y-2">
                    <div className="text-xs font-bold text-purple-950">
                      તમારા ગામનું નામ લખો:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="ગામનું નામ (દા.ત. શિહોરી, રાણપુર...)"
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-purple-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <button
                        type="submit"
                        disabled={!customText.trim()}
                        className="px-3 py-2 bg-purple-700 text-white text-xs font-bold rounded-xl hover:bg-purple-800 disabled:opacity-50 transition cursor-pointer"
                      >
                        ઉમેરો
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomInputOpen(false)}
                        className="p-2 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        રદ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  કોઈ પરિણામ મળ્યું નથી
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  "{search}" માટે કોઈ વિગત નથી. જોડણી તપાસો અથવા અલગ શબ્દ શોધો.
                </p>
              </div>
            ) : (
              filteredOptions.map((item) => {
                const isSelected = item.id === value;
                const itemTitle = item.nameGujarati || item.name;
                const itemSubtitle = item.nameEn || (item.name !== item.nameGujarati ? item.name : "");

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs font-semibold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 text-xs font-bold transition ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-700"
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 leading-snug">
                            {itemTitle}
                          </span>
                          {itemSubtitle && (
                            <span className="text-xs text-slate-500 font-normal">
                              ({itemSubtitle})
                            </span>
                          )}
                        </div>

                        {/* Extra metadata like taluka, district or member count */}
                        {(item.district || item.taluka || item.memberCount) && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                            {item.taluka && <span>તા. {item.taluka}</span>}
                            {item.district && <span>જી. {item.district}</span>}
                            {item.memberCount && (
                              <span className="text-purple-700 font-semibold">
                                • {item.memberCount} સભ્યો
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          પસંદ કરેલ
                        </span>
                      ) : (
                        <span className="text-xs text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                          પસંદ કરો →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Result Count */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>કુલ {filteredOptions.length} વિકલ્પો ઉપલબ્ધ</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-600 font-semibold hover:text-slate-900 px-2 py-1 rounded-lg"
            >
              બંધ કરો
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
