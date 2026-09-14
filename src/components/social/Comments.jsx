import React, { useEffect, useState } from "react";
import { Send, Trash2, CornerDownRight, Flag, Heart, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";

function CommentRow({ c, ctx, depth = 0 }) {
  const { user, isMod, t, setReplyTo, del, report } = ctx;
  const isAuthor = c.authorId === user?.id;

  return (
    <div className={`group transition-all ${depth ? "ml-7 sm:ml-9 mt-2" : "mt-3"}`}>
      <div className="flex items-start gap-2.5" data-testid={`comment-${c.id}`}>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 grid place-items-center text-xs font-bold shrink-0 overflow-hidden border border-purple-200 shadow-xs">
          {c.authorPhoto ? (
            <img src={c.authorPhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            (c.authorName?.[0] || "?").toUpperCase()
          )}
        </div>

        {/* Bubble */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl px-3.5 py-2.5 transition-colors shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {c.authorName}
              </span>
              {c.createdAt && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(c.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
              {c.content}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 mt-1 ml-1 text-[11px] text-slate-500 font-medium">
            <button
              data-testid={`comment-reply-${c.id}`}
              onClick={() => setReplyTo(c)}
              className="hover:text-purple-900 flex items-center gap-1 transition-colors"
            >
              <CornerDownRight className="w-3 h-3 text-purple-700" />
              <span>{t("reply") || "જવાબ આપો"}</span>
            </button>

            {!isAuthor && (
              <button
                data-testid={`comment-report-${c.id}`}
                onClick={() => report(c)}
                className="hover:text-amber-600 flex items-center gap-1 transition-colors opacity-80 hover:opacity-100"
              >
                <Flag className="w-3 h-3 text-amber-500" />
                <span>{t("report") || "રિપોર્ટ"}</span>
              </button>
            )}

            {(isAuthor || isMod) && (
              <button
                data-testid={`comment-delete-${c.id}`}
                onClick={() => del(c)}
                className="hover:text-rose-600 flex items-center gap-1 transition-colors opacity-80 hover:opacity-100"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>{t("delete") || "ડિલીટ"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((it) => {
    if (!it?.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

export function Comments({ postId, onCount, onClose }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, t, isMod } = useApp();

  useEffect(() => {
    api
      .get(`/posts/${postId}/comments`)
      .then(({ data }) => setItems(dedupeById(data.items)))
      .catch(() => {});
  }, [postId]);

  const add = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        content: text.trim(),
        parentId: replyTo?.id || null,
      });
      setItems((x) => dedupeById([...x, data]));
      setText("");
      setReplyTo(null);
      onCount?.(1);
      toast.success("કમેન્ટ ઉમેરાઈ ગઈ");
    } catch {
      toast.error("કમેન્ટ કરવામાં ક્ષતિ આવી");
    } finally {
      setSubmitting(false);
    }
  };

  const del = async (c) => {
    if (!window.confirm("શું તમે આ કમેન્ટ ડિલીટ કરવા માંગો છો?")) return;
    try {
      await api.delete(`/comments/${c.id}`);
      setItems((x) => x.filter((i) => i.id !== c.id));
      onCount?.(-1);
      toast.success("કમેન્ટ ડિલીટ થઈ ગઈ");
    } catch {
      toast.error("ડિલીટ કરવામાં ક્ષતિ આવી");
    }
  };

  const report = async (c) => {
    const reason = window.prompt("રિપોર્ટનું કારણ દાખલ કરો:");
    if (!reason) return;
    try {
      await api.post("/reports", { targetType: "comment", targetId: c.id, reason });
      toast.success("રિપોર્ટ મોકલાયો");
    } catch {
      toast.error("રિપોર્ટ નિષ્ફળ");
    }
  };

  const roots = dedupeById(items).filter((c) => !c.parentId);
  const ctx = { items, user, isMod, t, setReplyTo, del, report };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100/90 space-y-3">
      {/* Header bar if provided with onClose */}
      {onClose && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-slate-900">
            <MessageCircle className="w-4 h-4 text-purple-700" />
            <span>કમેન્ટ્સ ({items.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1 scrollbar-none">
        {roots.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            હજુ કોઈ કમેન્ટ નથી. પ્રથમ કમેન્ટ લખો!
          </div>
        ) : (
          roots.map((c) => (
            <React.Fragment key={c.id}>
              <CommentRow c={c} ctx={ctx} />
              {dedupeById(items.filter((x) => x.parentId === c.id)).map((r) => (
                <CommentRow key={r.id} c={r} ctx={ctx} depth={1} />
              ))}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Reply To Banner */}
      {replyTo && (
        <div className="text-[11px] text-purple-900 bg-purple-50/90 border border-purple-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 shadow-2xs">
          <span className="truncate">
            જવાબ આપી રહ્યા છો: <strong>{replyTo.authorName}</strong>
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="p-0.5 rounded-full hover:bg-purple-100 text-purple-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Comment Input */}
      <div className="flex items-center gap-2 pt-1">
        <input
          data-testid={`comment-input-${postId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && add()}
          placeholder={replyTo ? `${replyTo.authorName} ને જવાબ આપો...` : t("write_comment") || "કમેન્ટ લખો..."}
          className="flex-1 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/80 rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder:text-slate-400"
        />
        <button
          data-testid={`comment-submit-${postId}`}
          onClick={add}
          disabled={!text.trim() || submitting}
          className="p-2.5 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-700 hover:from-purple-900 hover:to-indigo-800 text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
