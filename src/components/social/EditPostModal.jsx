import React, { useState } from "react";
import { Edit3, MapPin, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { PrivacySelector } from "@/components/Visibility";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const EMOJI_PRESETS = ["🙏", "🌸", "💐", "✨", "🤝", "🚩", "🌿", "🔥"];

export function EditPostModal({ open, onOpenChange, post, onSave }) {
  const { lang } = useApp();
  const [caption, setCaption] = useState(post?.caption || post?.content || "");
  const [visibility, setVisibility] = useState(post?.visibility || "samaj");
  const [location, setLocation] = useState(post?.location || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (saving || !post?.id) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/posts/${post.id}`, {
        caption: caption.trim(),
        visibility,
        location: location.trim(),
      });
      toast.success(lang === "en" ? "Post updated successfully" : "પોસ્ટ સુધારી લીધી");
      onSave?.(data);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "પોસ્ટ સુધારવામાં ક્ષતિ આવી");
    } finally {
      setSaving(false);
    }
  };

  const addEmoji = (emoji) => {
    setCaption((prev) => prev + emoji);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6" data-testid="edit-post-modal">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Edit3 className="w-5 h-5 text-purple-700" />
            {lang === "en" ? "Edit Post" : "પોસ્ટ સુધારો"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {lang === "en"
              ? "Update caption, privacy visibility, or location of your post."
              : "તમારી પોસ્ટનું કેપ્શન, પ્રાઈવસી (કોણ જોઈ શકે) અથવા લોકેશન બદલો."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Media Preview (Thumbnail) */}
          {post?.mediaUrls?.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                {post.mediaType === "video" || post.mediaType === "reel" || post.mediaUrls[0].match(/\.(mp4|mov|webm)/i) ? (
                  <video src={post.mediaUrls[0]} className="w-full h-full object-cover" />
                ) : (
                  <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-xs text-slate-600 min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {post.mediaUrls.length} {post.mediaType === "reel" ? "રીલ / વિડિયો" : "મીડિયા ફાઇલ"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === "en" ? "Media files are preserved" : "મીડિયા ફાઇલ યથાવત રહેશે"}
                </p>
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === "en" ? "Caption & Description" : "કેપ્શન અને વિગત"}
            </label>
            <textarea
              data-testid="edit-post-caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder={lang === "en" ? "Write a caption..." : "પોસ્ટ વિશે કંઈક લખો..."}
              className="w-full text-sm border border-slate-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50 resize-none"
            />
            {/* Quick Emojis */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium">ક્વિક ઇમોજી:</span>
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => addEmoji(em)}
                  className="text-sm px-1.5 py-0.5 rounded-lg hover:bg-slate-100 transition"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Selector - Point 3 Requirement */}
          <div className="pt-1">
            <PrivacySelector
              value={visibility}
              onChange={setVisibility}
              testIdPrefix="edit-post-privacy"
            />
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === "en" ? "Location (optional)" : "સ્થળ / લોકેશન (વૈકલ્પિક)"}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="edit-post-location-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={lang === "en" ? "Add location (e.g. Ahmedabad, Mehsana)" : "સ્થળ ઉમેરો (દા.ત. અમદાવાદ, ઊંઝા)"}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              data-testid="edit-post-cancel-btn"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              {lang === "en" ? "Cancel" : "રદ કરો"}
            </button>
            <button
              type="submit"
              data-testid="edit-post-save-btn"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold bg-purple-900 hover:bg-purple-950 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {lang === "en" ? "Saving..." : "સાચવી રહ્યું છે..."}
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {lang === "en" ? "Save Changes" : "ફેરફારો સાચવો"}
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
