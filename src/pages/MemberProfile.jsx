import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Video, MessageCircle, MessageSquare, Share2, Mail, MapPin, Cake, Droplet, GraduationCap, User2, Users2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-none">
    <div className="w-8 h-8 rounded-lg bg-purple-50 grid place-items-center text-purple-800 shrink-0"><Icon className="w-4 h-4" /></div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div className="text-sm text-slate-800 font-medium break-words">{value || "—"}</div>
    </div>
  </div>
);

export default function MemberProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useApp();
  const [m, setM] = useState(null);

  useEffect(() => {
    api.get(`/members/${id}`).then(({ data }) => setM(data)).catch(() => nav("/members"));
  }, [id, nav]);

  const startInAppCall = async (callType = "voice") => {
    if (!m) return;
    try {
      const { data } = await api.post("/conversations/direct", {
        userId: m.userId || m.id,
        phone: m.mobile,
      });
      const cid = data?.conversation?.id || data?.id;
      if (cid) {
        nav(`/messages/${cid}?autoCall=${callType}`);
      } else {
        toast.error("કૉલ શરૂ થઈ શક્યો નહીં");
      }
    } catch {
      toast.error("કૉલ શરૂ કરવામાં સમસ્યા આવી");
    }
  };

  const openChat = async () => {
    if (!m) return;
    try {
      const { data } = await api.post("/conversations/direct", {
        userId: m.userId || m.id,
        phone: m.mobile,
      });
      const cid = data?.conversation?.id || data?.id;
      if (cid) {
        nav(`/messages/${cid}`);
      }
    } catch {
      toast.error("ચેટ શરૂ થઈ શકી નહીં");
    }
  };

  if (!m) return <div className="skeleton h-64" />;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button data-testid="member-profile-back" onClick={() => nav(-1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">સભ્યની સંપૂર્ણ માહિતી</h2>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-800 h-24 relative">
          <div className="absolute left-5 -bottom-10 w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow">
            {m.profilePhoto ? <img src={m.profilePhoto} alt="" className="w-full h-full object-cover" /> : (
              <div className="w-full h-full bg-purple-100 text-purple-800 grid place-items-center font-extrabold text-2xl">{(m.name?.[0] || "?").toUpperCase()}</div>
            )}
          </div>
        </div>
        <div className="pt-14 px-5 pb-5">
          <div className="font-heading font-extrabold text-slate-900 text-xl">{m.name}</div>
          <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {m.village}{m.district ? `, ${m.district}` : ""}</div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              data-testid="mp-voice-call"
              onClick={() => startInAppCall("voice")}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-sm font-semibold rounded-full flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>વૉઇસ કૉલ</span>
            </button>

            <button
              data-testid="mp-video-call"
              onClick={() => startInAppCall("video")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>વિડિઓ કૉલ</span>
            </button>

            <button
              data-testid="mp-chat"
              onClick={openChat}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 text-sm font-semibold rounded-full border border-purple-200 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>મેસેજ</span>
            </button>

            <button
              data-testid="mp-call"
              onClick={() => (window.location.href = `tel:${m.mobile}`)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-full border border-slate-200 flex items-center gap-1.5"
              title="મોબાઇલ નેટવર્ક ડાયલર"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>ડાયલર</span>
            </button>

            <button
              data-testid="mp-whatsapp"
              onClick={() => window.open(`https://wa.me/${m.mobile.replace(/\D/g, "")}`, "_blank")}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full border border-emerald-300 flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t("whatsapp")}</span>
            </button>

            <button
              data-testid="mp-share"
              onClick={() => navigator.share?.({ title: m.name, text: `${m.name} — ${m.mobile}` }).catch(() => {})}
              className="px-3.5 py-2 bg-slate-50 text-slate-700 text-sm font-medium rounded-full border border-slate-200 flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>{t("share")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="font-heading font-bold text-slate-900 mb-1">વ્યક્તિગત માહિતી</div>
        <Row icon={Phone} label="મોબાઇલ" value={m.mobile} />
        <Row icon={Cake} label={t("dob")} value={m.dob} />
        <Row icon={Droplet} label={t("blood_group")} value={m.bloodGroup} />
        <Row icon={GraduationCap} label={t("education")} value={m.education} />
        <Row icon={Mail} label={t("email")} value={m.email} />
        <Row icon={User2} label={t("father")} value={m.father} />
        <Row icon={Users2} label={t("mother")} value={m.mother} />
        <Row icon={MapPin} label={t("address")} value={m.address} />
      </div>
    </div>
  );
}
