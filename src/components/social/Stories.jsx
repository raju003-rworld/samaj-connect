import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { MediaUploader, isVideoUrl } from "@/components/MediaUploader";
import { VisibilitySelect } from "@/components/Visibility";

export function Stories() {
  const { user, t } = useApp();
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [vis, setVis] = useState("samaj");

  const load = () => api.get("/stories").then(({ data }) => setGroups(data.items)).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async (urls) => {
    await api.post("/stories", { mediaUrl: urls[0], mediaType: isVideoUrl(urls[0]) ? "video" : "image", visibility: vis });
    toast.success("સ્ટોરી ઉમેરાઈ"); load();
  };
  const open = (g) => { setViewing({ g, i: 0 }); api.post(`/stories/${g.items[0].id}/view`).catch(() => {}); };
  const next = () => {
    if (!viewing) return;
    const ni = viewing.i + 1;
    if (ni >= viewing.g.items.length) return setViewing(null);
    api.post(`/stories/${viewing.g.items[ni].id}/view`).catch(() => {});
    setViewing({ ...viewing, i: ni });
  };
  const del = async (s) => { await api.delete(`/stories/${s.id}`); setViewing(null); load(); };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" data-testid="stories-bar">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative w-16 h-16 rounded-full bg-purple-50 border-2 border-dashed border-purple-300 grid place-items-center">
            <MediaUploader multiple={false} kind="stories" onDone={add} testId="story-upload" label={<Plus className="w-5 h-5" />} className="!bg-transparent !border-0 !p-0 !rounded-full" />
          </div>
          <VisibilitySelect testId="story-visibility" value={vis} onChange={setVis} className="!px-1.5 !py-0.5 !text-[9px] max-w-[64px]" />
        </div>
        {groups.map((g) => {
          const seen = g.items.every((s) => s.viewedByMe);
          return (
            <button key={g.userId} data-testid={`story-${g.userId}`} onClick={() => open(g)} className="flex flex-col items-center gap-1 shrink-0 w-16">
              <div className={`w-16 h-16 rounded-full p-[2px] ${seen ? "bg-slate-300" : "bg-gradient-to-tr from-purple-700 via-fuchsia-500 to-amber-400"}`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-purple-100 grid place-items-center font-bold text-purple-800">
                    {g.photo ? <img src={g.photo} alt="" className="w-full h-full object-cover" /> : (g.name?.[0] || "?").toUpperCase()}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 truncate w-full">{g.userId === user?.id ? "તમે" : g.name}</span>
            </button>
          );
        })}
      </div>
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black grid place-items-center" onClick={next} data-testid="story-viewer">
          <div className="absolute top-3 left-3 right-3 flex gap-1">{viewing.g.items.map((_, k) => <div key={k} className={`flex-1 h-0.5 rounded ${k <= viewing.i ? "bg-white" : "bg-white/30"}`} />)}</div>
          <div className="absolute top-6 left-4 text-white text-sm font-semibold flex items-center gap-2">{viewing.g.name}
            {viewing.g.userId === user?.id && <button onClick={(e) => { e.stopPropagation(); del(viewing.g.items[viewing.i]); }} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{t("delete")}</button>}
          </div>
          <button className="absolute top-5 right-4 text-white" onClick={(e) => { e.stopPropagation(); setViewing(null); }}><X className="w-6 h-6" /></button>
          {(() => { const s = viewing.g.items[viewing.i]; return s.mediaType === "video"
            ? <video src={s.mediaUrl} autoPlay playsInline onEnded={next} className="max-h-[90vh] max-w-full" />
            : <img src={s.mediaUrl} alt="" className="max-h-[90vh] max-w-full object-contain" />; })()}
          {viewing.g.items[viewing.i].caption && <div className="absolute bottom-8 text-white text-sm bg-black/40 px-3 py-1 rounded-full">{viewing.g.items[viewing.i].caption}</div>}
        </div>
      )}
    </>
  );
}
