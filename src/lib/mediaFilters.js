/**
 * Video and Image Filters for SAMAJ CONNECT
 * Applied via CSS filters for non-destructive, responsive, professional preview and display.
 */

export const MEDIA_FILTERS = [
  { id: "normal", name: "સામાન્ય (Normal)", filter: "none", previewBg: "bg-slate-200" },
  { id: "warm", name: "હૂંફાળું (Warm)", filter: "sepia(0.3) saturate(1.4) brightness(1.05)", previewBg: "bg-amber-100" },
  { id: "vintage", name: "વિન્ટેજ (Vintage)", filter: "sepia(0.6) contrast(1.1) brightness(0.95)", previewBg: "bg-orange-100" },
  { id: "vivid", name: "તેજસ્વી (Vivid)", filter: "saturate(1.7) contrast(1.15)", previewBg: "bg-fuchsia-100" },
  { id: "bw", name: "બ્લેક એન્ડ વ્હાઇટ (B&W)", filter: "grayscale(1) contrast(1.2)", previewBg: "bg-neutral-300" },
  { id: "cinematic", name: "સિનેમેટિક (Cinematic)", filter: "contrast(1.25) saturate(1.2) brightness(0.95) hue-rotate(-10deg)", previewBg: "bg-indigo-100" },
  { id: "cool", name: "શાંત નીલ (Cool)", filter: "hue-rotate(30deg) saturate(1.15) brightness(1.05)", previewBg: "bg-sky-100" },
  { id: "sepia", name: "ગોલ્ડન સેપિયા (Sepia)", filter: "sepia(0.85) contrast(1.1)", previewBg: "bg-yellow-200" },
];

export function getFilterCss(filterId) {
  const found = MEDIA_FILTERS.find((f) => f.id === filterId);
  return found ? found.filter : "none";
}

/**
 * Format relative time for Status/Stories
 * e.g. "Just now", "2m ago", "15m ago", "1h ago", "5h ago", "Yesterday"
 * with Gujarati and English options
 */
export function formatStoryTime(isoString, lang = "gu") {
  if (!isoString) return lang === "gu" ? "હમણાં જ" : "Just now";
  const now = Date.now();
  const posted = new Date(isoString).getTime();
  const diffSec = Math.max(1, Math.floor((now - posted) / 1000));

  if (diffSec < 60) {
    return lang === "gu" ? "હમણાં જ" : "Just now";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === "gu" ? `${diffMin} મિનિટ પહેલાં` : `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return lang === "gu" ? `${diffHour} કલાક પહેલાં` : `${diffHour}h ago`;
  }

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) {
    return lang === "gu" ? "ગઈકાલે" : "Yesterday";
  }

  return lang === "gu" ? `${diffDays} દિવસ પહેલાં` : `${diffDays}d ago`;
}
