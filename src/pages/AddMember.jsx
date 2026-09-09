import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";
import { ArrowLeft } from "lucide-react";

const Field = ({ label, testId, value, onChange, placeholder = "", type = "text" }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-600 mb-1 block">{label}</span>
    <input
      data-testid={testId}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-sm placeholder:text-slate-400 bg-white"
    />
  </label>
);

export default function AddMember() {
  const nav = useNavigate();
  const { t } = useApp();
  const [form, setForm] = useState({
    name: "", mobile: "", village: "", address: "", dob: "", bloodGroup: "",
    education: "", email: "", father: "", mother: "", gender: "", maritalStatus: "",
    district: "", profilePhoto: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error("નામ જરૂરી છે");
    if (!/^\+?\d{10,15}$/.test(form.mobile.replace(/\s/g, ""))) return toast.error("સાચો મોબાઇલ નંબર દાખલ કરો");
    setSaving(true);
    try {
      await api.post("/members", form);
      toast.success(t("saved_ok"));
      nav("/members");
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("saved_fail"));
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button data-testid="add-member-back" onClick={() => nav(-1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-heading font-extrabold text-slate-900 text-xl sm:text-2xl">{t("add_member")}</h2>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t("name") + " *"} testId="add-name" value={form.name} onChange={set("name")} />
        <Field label={t("mobile") + " *"} testId="add-mobile" value={form.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" />
        <Field label={t("village")} testId="add-village" value={form.village} onChange={set("village")} />
        <Field label={t("district")} testId="add-district" value={form.district} onChange={set("district")} />
        <Field label={t("dob")} testId="add-dob" value={form.dob} onChange={set("dob")} type="date" />
        <Field label={t("blood_group")} testId="add-blood" value={form.bloodGroup} onChange={set("bloodGroup")} placeholder="O+" />
        <Field label={t("education")} testId="add-education" value={form.education} onChange={set("education")} />
        <Field label={t("email")} testId="add-email" value={form.email} onChange={set("email")} type="email" />
        <Field label={t("father")} testId="add-father" value={form.father} onChange={set("father")} />
        <Field label={t("mother")} testId="add-mother" value={form.mother} onChange={set("mother")} />
        <label className="block">
          <span className="text-xs font-semibold text-slate-600 mb-1 block">{t("gender")}</span>
          <select data-testid="add-gender" value={form.gender} onChange={(e) => set("gender")(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
            <option value="">--</option>
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
            <option value="other">{t("other")}</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600 mb-1 block">{t("marital_status")}</span>
          <select data-testid="add-marital" value={form.maritalStatus} onChange={(e) => set("maritalStatus")(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
            <option value="">--</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <Field label={t("address")} testId="add-address" value={form.address} onChange={set("address")} />
        </div>
        <div className="sm:col-span-2">
          <Field label={t("profile_photo_url")} testId="add-photo" value={form.profilePhoto} onChange={set("profilePhoto")} placeholder="https://..." />
        </div>
      </div>

      <button
        data-testid={IDS.addMemberSubmit}
        onClick={submit}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow-md shadow-purple-900/20 disabled:opacity-60"
      >
        {saving ? "..." : t("save")}
      </button>
    </div>
  );
}
