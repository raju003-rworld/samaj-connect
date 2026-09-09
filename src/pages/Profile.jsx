import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, LogOut, Newspaper, Calendar, LayoutDashboard, Settings, HelpCircle, ChevronRight, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { MediaUploader } from "@/components/MediaUploader";

const Item = ({ icon: Icon, label, onClick, testId }) => (
  <button data-testid={testId} onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-none text-left">
    <div className="w-9 h-9 rounded-xl bg-purple-50 grid place-items-center text-purple-800"><Icon className="w-4 h-4" /></div>
    <span className="flex-1 text-sm text-slate-800 font-medium">{label}</span>
    <ChevronRight className="w-4 h-4 text-slate-400" />
  </button>
);

export default function Profile() {
  const { user, updateUser, logout, t, isMod } = useApp();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: user?.name || "", village: user?.village || "", district: user?.district || "", bio: user?.bio || "", profilePhoto: user?.profilePhoto || "" });

  const save = async () => {
    try {
      const { data } = await api.patch("/auth/me", f);
      updateUser(data);
      toast.success(t("saved_ok"));
      setEdit(false);
    } catch { toast.error(t("saved_fail")); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">મારી પ્રોફાઇલ</h2>

      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-800 grid place-items-center text-2xl font-extrabold border-2 border-purple-200 overflow-hidden">
            {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover"/> : (user?.name?.[0] || "?").toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-heading font-bold text-slate-900 text-lg">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.phone}</div>
            {user?.role !== "member" && <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">{user?.role}</span>}
          </div>
          <button data-testid="profile-edit-toggle" onClick={() => setEdit((v) => !v)} className="p-2 rounded-full bg-purple-50 text-purple-800 hover:bg-purple-100">
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {edit && (
          <div className="mt-4 space-y-2">
            {["name", "village", "district", "bio"].map((k) => (
              <input
                key={k}
                data-testid={`profile-${k}`}
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                placeholder={t(k) || k}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
            ))}
            <div className="flex items-center gap-2">
              <MediaUploader multiple={false} accept="image/*" kind="profile" onDone={(u) => setF({ ...f, profilePhoto: u[0] })} label={t("profile_photo_url")} testId="profile-photo-upload" />
              {f.profilePhoto && <img src={f.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />}
            </div>
            <button data-testid="profile-save" onClick={save} className="w-full py-2.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {t("save")}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <Item icon={Newspaper} label={t("my_posts")} testId="profile-my-posts" onClick={() => nav("/social")} />
        <Item icon={Calendar} label={t("my_events")} testId="profile-my-events" onClick={() => nav("/events")} />
        {isMod && (
          <Item icon={LayoutDashboard} label={t("admin")} testId={IDS.adminPanelBtn} onClick={() => nav("/admin")} />
        )}
        <Item icon={Settings} label={t("settings")} testId="profile-settings" onClick={() => toast.info("Settings coming soon")} />
        <Item icon={HelpCircle} label={t("help")} testId="profile-help" onClick={() => toast.info("Help coming soon")} />
        <Item icon={LogOut} label={t("logout")} testId="profile-logout" onClick={async () => { await logout(); nav("/login"); }} />
      </div>
    </div>
  );
}
