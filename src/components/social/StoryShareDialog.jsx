import React, { useEffect, useState } from "react";
import { Send, Search, X, Check, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export function StoryShareDialog({
  open,
  onClose,
  story,
}) {
  const { user } = useApp();
  const [convs, setConvs] = useState([]);
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      api
        .get("/conversations")
        .then(({ data }) => setConvs(data.items || []))
        .catch(() => {});
    }
  }, [open]);

  if (!open || !story) return null;

  const handleShareToConv = async (c) => {
    setSendingId(c.id);
    try {
      // Send message to conversation
      const shareText = note.trim()
        ? `📱 સ્ટોરી: ${note}\n${story.caption || ""}`
        : `📱 સ્ટોરી શેર કરી (Shared Story)${story.caption ? `: "${story.caption}"` : ""}`;

      await api.post(`/conversations/${c.id}/messages`, {
        text: shareText,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType || "image",
        type: story.mediaType || "image",
        storyId: story.id,
      });

      // Also record story share metric
      await api.post(`/stories/${story.id}/share`, { conversationId: c.id }).catch(() => {});

      toast.success("સ્ટોરી ચેટમાં શેર થઈ ગઈ!");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "શેર કરવામાં ક્ષતિ આવી");
    } finally {
      setSendingId(null);
    }
  };

  const getConvTitle = (c) => {
    if (c.type === "group") return c.name;
    const other = Object.entries(c.members || {}).find(([k]) => k !== user?.id);
    return other ? other[1].name : "સભ્ય";
  };

  const getConvPhoto = (c) => {
    if (c.type === "group") return c.photo;
    const other = Object.entries(c.members || {}).find(([k]) => k !== user?.id);
    return other ? other[1].photo : null;
  };

  const filtered = convs.filter((c) =>
    getConvTitle(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      data-testid="story-share-dialog"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 grid place-items-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">
                સ્ટોરી ચેટમાં મોકલો (Share to Chat)
              </h3>
              <p className="text-[10px] text-slate-500">
                તમારા મિત્ર અથવા ગ્રુપ સાથે શેર કરો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Thumbnail Preview & Note */}
        <div className="my-3 flex items-center gap-3 p-2.5 rounded-2xl bg-purple-50/60 border border-purple-100">
          <div className="w-12 h-12 rounded-xl bg-black overflow-hidden shrink-0">
            {story.mediaType === "video" ? (
              <video src={story.mediaUrl} className="w-full h-full object-cover" />
            ) : (
              <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="સંદેશ લખો (Optional note)..."
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="સભ્ય અથવા ગ્રુપ શોધો..."
            className="w-full text-xs bg-transparent outline-none text-slate-700"
          />
        </div>

        {/* Conversations List */}
        <div className="max-h-52 overflow-y-auto space-y-1">
          {filtered.map((c) => {
            const title = getConvTitle(c);
            const photo = getConvPhoto(c);
            const isSending = sendingId === c.id;

            return (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 grid place-items-center font-bold text-xs overflow-hidden shrink-0">
                    {photo ? (
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    ) : c.type === "group" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      (title[0] || "?").toUpperCase()
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {title}
                  </div>
                </div>

                <button
                  onClick={() => handleShareToConv(c)}
                  disabled={isSending}
                  data-testid={`story-send-to-${c.id}`}
                  className="px-3 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSending ? "..." : "મોકલો"}</span>
                </button>
              </div>
            );
          })}

          {!filtered.length && (
            <div className="text-center py-6 text-xs text-slate-400">
              કોઈ વાતચીત મળી નથી
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
