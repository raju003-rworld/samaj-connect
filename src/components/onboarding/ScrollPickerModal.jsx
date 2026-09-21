import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Check, Plus, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollPickerModal({
  open,
  onClose,
  title,
  subtitle,
  stepNumber,
  totalSteps = 5,
  items = [],
  selectedId = "",
  onSelect,
  searchPlaceholder = "શોધો...",
  emptyMessage = "કોઈ પરિણામ મળ્યું નથી",
  filterChips = [],
  allowCustom = false,
  customPlaceholder = "તમારા ગામનું નામ લખો...",
  onCustomConfirm,
  icon: Icon,
  accent = "purple", // purple | indigo | sky | emerald | amber
}) {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const searchInputRef = useRef(null);

  // Accent color tokens
  const colors = {
    purple: {
      bg: "bg-purple-600",
      bgLight: "bg-purple-50",
      border: "border-purple-200",
      borderActive: "border-purple-500",
      text: "text-purple-700",
      ring: "focus:ring-purple-500 focus:border-purple-500",
      selectedBg: "bg-purple-50/80 hover:bg-purple-100/60",
      badge: "bg-purple-100 text-purple-800",
      glow: "shadow-purple-500/20",
    },
    indigo: {
      bg: "bg-indigo-600",
      bgLight: "bg-indigo-50",
      border: "border-indigo-200",
      borderActive: "border-indigo-500",
      text: "text-indigo-700",
      ring: "focus:ring-indigo-500 focus:border-indigo-500",
      selectedBg: "bg-indigo-50/80 hover:bg-indigo-100/60",
      badge: "bg-indigo-100 text-indigo-800",
      glow: "shadow-indigo-500/20",
    },
    sky: {
      bg: "bg-sky-600",
      bgLight: "bg-sky-50",
      border: "border-sky-200",
      borderActive: "border-sky-500",
      text: "text-sky-700",
      ring: "focus:ring-sky-500 focus:border-sky-500",
      selectedBg: "bg-sky-50/80 hover:bg-sky-100/60",
      badge: "bg-sky-100 text-sky-800",
      glow: "shadow-sky-500/20",
    },
    emerald: {
      bg: "bg-emerald-600",
      bgLight: "bg-emerald-50",
      border: "border-emerald-200",
      borderActive: "border-emerald-500",
      text: "text-emerald-700",
      ring: "focus:ring-emerald-500 focus:border-emerald-500",
      selectedBg: "bg-emerald-50/80 hover:bg-emerald-100/60",
      badge: "bg-emerald-100 text-emerald-800",
      glow: "shadow-emerald-500/20",
    },
    amber: {
      bg: "bg-amber-600",
      bgLight: "bg-amber-50",
      border: "border-amber-200",
      borderActive: "border-amber-500",
      text: "text-amber-800",
      ring: "focus:ring-amber-500 focus:border-amber-500",
      selectedBg: "bg-amber-50/80 hover:bg-amber-100/60",
      badge: "bg-amber-100 text-amber-900",
      glow: "shadow-amber-500/20",
    },
  }[accent] || {
    bg: "bg-purple-600",
    bgLight: "bg-purple-50",
    border: "border-purple-200",
    borderActive: "border-purple-500",
    text: "text-purple-700",
    ring: "focus:ring-purple-500 focus:border-purple-500",
    selectedBg: "bg-purple-50/80 hover:bg-purple-100/60",
    badge: "bg-purple-100 text-purple-800",
    glow: "shadow-purple-500/20",
  };

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveChip("all");
      setShowCustomInput(false);
      setCustomText("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 200);
    }
  }, [open]);

  // Filtered items by search query and active filter chip
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply filter chip if selected
    if (activeChip !== "all" && filterChips.length > 0) {
      const chip = filterChips.find((c) => c.id === activeChip);
      if (chip && typeof chip.filterFn === "function") {
        result = result.filter(chip.filterFn);
      }
    }

    // Apply search query
    if (!query.trim()) return result;
    const q = query.toLowerCase().trim();

    return result.filter((item) => {
      const gujMatch = item.nameGujarati?.toLowerCase().includes(q) || false;
      const enMatch = item.name?.toLowerCase().includes(q) || item.nameEn?.toLowerCase().includes(q) || false;
      const codeMatch = item.code?.toLowerCase().includes(q) || false;
      const distMatch = item.district?.toLowerCase().includes(q) || false;
      const descMatch = item.description?.toLowerCase().includes(q) || false;
      const aliasMatch = Array.isArray(item.aliases) && item.aliases.some((a) => a?.toLowerCase().includes(q));
      return gujMatch || enMatch || codeMatch || distMatch || descMatch || aliasMatch;
    });
  }, [items, query, activeChip, filterChips]);

  const handleCustomSubmit = (e) => {
    e?.preventDefault();
    if (!customText.trim()) return;
    onCustomConfirm?.(customText.trim());
    setShowCustomInput(false);
    setCustomText("");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
        {/* Backdrop click dismiss */}
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Sheet Window */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative z-10 w-full sm:max-w-xl bg-white text-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
            <div className="w-12 h-1.5 rounded-full bg-slate-200" />
          </div>

          {/* Modal Header */}
          <div className="px-5 pt-3 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl ${colors.bg} text-white grid place-items-center shrink-0 shadow-md ${colors.glow}`}
              >
                {Icon ? <Icon className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    પગલું {stepNumber} / {totalSteps}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {items.length} ઉપલબ્ધ
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
              aria-label="બંધ કરો"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box & Controls */}
          <div className="px-5 pt-3 pb-2 space-y-2.5 bg-white border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition ${colors.ring}`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips (if any) */}
            {filterChips.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setActiveChip("all")}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition font-medium border ${
                    activeChip === "all"
                      ? `${colors.bg} text-white border-transparent shadow-sm`
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  બધા ({items.length})
                </button>
                {filterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveChip(chip.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition font-medium border ${
                      activeChip === chip.id
                        ? `${colors.bg} text-white border-transparent shadow-sm`
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Optional Custom Village / Custom Item trigger button */}
            {allowCustom && !showCustomInput && (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-dashed border-slate-300 flex items-center justify-center gap-1.5 transition text-purple-700 hover:text-purple-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>મારું ગામ યાદીમાં નથી મળતું? અહીં ક્લિક કરીને નવું ગામ લખો</span>
              </button>
            )}

            {/* Custom Input Form (Accordion expansion) */}
            {allowCustom && showCustomInput && (
              <form onSubmit={handleCustomSubmit} className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                  <span>નવું ગામ દાખલ કરો</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    રદ કરો
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder={customPlaceholder}
                    className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!customText.trim()}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    ઉમેરો & પસંદ કરો
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Scrollable Items List (સ્ક્રોલ લિસ્ટ) */}
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-slate-100 max-h-[52vh] sm:max-h-[50vh] overscroll-contain">
            {filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>
                <p className="text-xs text-slate-400">
                  શોધ શબ્દ તપાસો અથવા ફિલ્ટર સાફ કરો
                </p>
                {allowCustom && (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>નવું ગામ દાખલ કરો</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredItems.map((item) => {
                  const isSelected = selectedId === item.id;
                  const displayName = item.nameGujarati || item.name || item.nameEn;
                  const subName = item.nameEn || (item.nameGujarati ? item.name : "");
                  const badgeText = item.code || item.district || item.tag;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelect(item.id, item);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                        isSelected
                          ? `${colors.selectedBg} ${colors.borderActive} ring-2 ring-purple-500/20 shadow-sm`
                          : "bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl grid place-items-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105 ${
                            isSelected
                              ? `${colors.bg} text-white shadow-sm`
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.code?.slice(0, 3) || displayName.charAt(0) || "સ"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                              {displayName}
                            </span>
                            {badgeText && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}
                              >
                                {badgeText}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {subName && subName !== displayName && (
                              <span>{subName}</span>
                            )}
                            {item.description && (
                              <span className="text-slate-400 truncate max-w-[240px]">
                                · {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selection Checkmark indicator */}
                      <div
                        className={`w-6 h-6 rounded-full border grid place-items-center shrink-0 transition ${
                          isSelected
                            ? `${colors.bg} border-transparent text-white shadow-sm`
                            : "border-slate-300 bg-white group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer with quick dismiss / tip */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">
              કોઈપણ નામ પર ટૅપ કરીને સીધું પસંદ કરો
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-200/70 transition"
            >
              બંધ કરો
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
