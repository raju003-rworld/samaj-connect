import React, { useEffect, useState } from "react";
import { Send, Trash2, CornerDownRight, Flag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";

function CommentRow({ c, ctx, depth = 0 }) {
  const { user, isMod, t, setReplyTo, del, report } = ctx;
  return (
    <div className={depth ? "ml-8" : ""}>
      <div className="flex items-start gap-2" data-testid={`comment-${c.id}`}>
        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 grid place-items-center text-xs font-bold shrink-0 overflow-hidden">
          {c.authorPhoto ? <img src={c.authorPhoto} alt="" className="w-full h-full object-cover" /> : (c.authorName?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2">
          <div className="text-xs font-semibold text-slate-800">{c.authorName}</div>
          <div className="text-sm text-slate-700">{c.content}</div>
          <div className="flex gap-3 mt-1 text-[11px] text-slate-500">
            <button data-testid={`comment-reply-${c.id}`} onClick={() => setReplyTo(c)} className="hover:text-purple-800 flex items-center gap-0.5"><CornerDownRight className="w-3 h-3" /> {t("reply")}</button>
            {c.authorId !== user?.id && <button data-testid={`comment-report-${c.id}`} onClick={() => report(c)} className="hover:text-amber-600 flex items-center gap-0.5"><Flag className="w-3 h-3" /> {t("report")}</button>}
            {(c.authorId === user?.id || isMod) && <button data-testid={`comment-delete-${c.id}`} onClick={() => del(c)} className="hover:text-rose-600 flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> {t("delete")}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Comments({ postId, onCount }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const { user, t, isMod } = useApp();

  useEffect(() => { api.get(`/posts/${postId}/comments`).then(({ data }) => setItems(data.items)); }, [postId]);

  const add = async () => {
    if (!text.trim()) return;
    const { data } = await api.post(`/posts/${postId}/comments`, { content: text, parentId: replyTo?.id || null });
    setItems((x) => [...x, data]);
    setText(""); setReplyTo(null); onCount?.(1);
  };
  const del = async (c) => {
    await api.delete(`/comments/${c.id}`);
    setItems((x) => x.filter((i) => i.id !== c.id)); onCount?.(-1);
  };

  const report = async (c) => {
    const reason = window.prompt("રિપોર્ટનું કારણ:"); if (!reason) return;
    await api.post("/reports", { targetType: "comment", targetId: c.id, reason }); toast.success("રિપોર્ટ મોકલાયો");
  };

  const roots = items.filter((c) => !c.parentId);
  const ctx = { items, user, isMod, t, setReplyTo, del, report };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      {roots.map((c) => (
        <React.Fragment key={c.id}>
          <CommentRow c={c} ctx={ctx} />
          {items.filter((x) => x.parentId === c.id).map((r) => <CommentRow key={r.id} c={r} ctx={ctx} depth={1} />)}
        </React.Fragment>
      ))}
      {replyTo && <div className="text-[11px] text-purple-800 bg-purple-50 rounded-full px-3 py-1 inline-flex items-center gap-2">↩ {replyTo.authorName} <button onClick={() => setReplyTo(null)} className="font-bold">×</button></div>}
      <div className="flex items-center gap-2 pt-1">
        <input data-testid={`comment-input-${postId}`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("write_comment")} className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
        <button data-testid={`comment-submit-${postId}`} onClick={add} className="p-2 rounded-full bg-purple-900 text-white"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
