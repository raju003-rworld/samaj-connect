import React, { useRef, useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/firebase";

// Real Firebase Storage upload. onDone(urls[], files[]) ; accept: "image/*,video/*" etc.
export const MediaUploader = ({ onDone, accept = "image/*,video/*", multiple = true, kind = "media", label, className = "", testId = "media-upload" }) => {
  const input = useRef();
  const [progress, setProgress] = useState(null);
  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setProgress(0);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        urls.push(await uploadFile(files[i], kind, (p) => setProgress(Math.round((i * 100 + p) / files.length))));
      }
      onDone(urls, files);
    } catch (err) { toast.error("અપલોડ નિષ્ફળ: " + err.message); }
    finally { setProgress(null); e.target.value = ""; }
  };
  return (
    <>
      <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden" onChange={pick} data-testid={`${testId}-input`} />
      <button type="button" data-testid={testId} onClick={() => input.current.click()} disabled={progress !== null}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-full disabled:opacity-60 ${className}`}>
        {progress !== null ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {progress}%</> : <><Paperclip className="w-3.5 h-3.5" /> {label || "ફોટો / વિડિયો"}</>}
      </button>
    </>
  );
};

export const MediaPreview = ({ urls, onRemove }) => urls.length ? (
  <div className="flex gap-2 flex-wrap mt-2">
    {urls.map((u, i) => (
      <div key={u} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        {/\.(mp4|webm|mov)(\?|$)/i.test(u) || u.includes("video") ? <video src={u} className="w-full h-full object-cover" /> : <img src={u} alt="" className="w-full h-full object-cover" />}
        {onRemove && <button onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>}
      </div>
    ))}
  </div>
) : null;

export const isVideoUrl = (u = "") => /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(u) || /video/i.test(u);
