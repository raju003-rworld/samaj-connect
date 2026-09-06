import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ShieldCheck, ArrowLeft, Users2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { startPhoneSignIn, signInCustom } from "@/lib/firebase";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";

export default function Login() {
  const nav = useNavigate();
  const { refreshUser, t, lang, toggleLang } = useApp();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const fullPhone = "+91" + cleanPhone;
  const [confirm, setConfirm] = useState(null);
  const [devAuth, setDevAuth] = useState(false);
  useEffect(() => { api.get("/auth/config").then(({ data }) => setDevAuth(!!data.devAuth)).catch(() => {}); }, []);

  const sendOtp = async () => {
    if (cleanPhone.length !== 10) return toast.error("10 અંકનો સાચો મોબાઇલ નંબર દાખલ કરો");
    setLoading(true);
    try {
      if (devAuth) { setConfirm(null); toast.success("ડેમો OTP: 123456"); }
      else { const c = await startPhoneSignIn(fullPhone); setConfirm(c); toast.success("OTP મોકલાયો"); }
      setStep("otp");
      setTimer(30);
    } catch (e) {
      toast.error("OTP મોકલવામાં નિષ્ફળ: " + (e?.code || e.message));
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return toast.error("6 અંકનો OTP દાખલ કરો");
    setLoading(true);
    try {
      if (confirm) {
        await confirm.confirm(otp);
      } else {
        const { data } = await api.post("/auth/dev-login", { phone: fullPhone, otp, name: name || undefined });
        await signInCustom(data.customToken);
      }
      const u = await refreshUser();
      if (name && (!u.name || u.name.startsWith("Member "))) await api.patch("/auth/me", { name }).then(refreshUser);
      toast.success(`${t("hello")}!`);
      nav("/home", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "OTP ખોટો છે");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Purple gradient top */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-900 px-6 pt-10 pb-16 relative">
        <button data-testid={IDS.langToggle} onClick={toggleLang} className="absolute top-5 right-5 text-xs font-semibold text-purple-100 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
          {lang === "gu" ? "English" : "ગુજરાતી"}
        </button>
        <div className="max-w-md mx-auto text-center text-white">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 border border-white/20 grid place-items-center mb-4">
            <Users2 className="w-8 h-8 text-purple-100" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">SAMAJ CONNECT</h1>
          <p className="text-purple-200 mt-1 text-sm">{t("tagline_short")}</p>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto -mt-10 px-4 pb-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
          {step === "phone" ? (
            <>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t("enter_mobile")}</label>
              <div className="flex items-stretch rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-400">
                <div className="px-3 flex items-center gap-1 bg-slate-50 text-slate-700 border-r border-slate-200 text-sm font-medium">
                  <Phone className="w-4 h-4 text-purple-700" /> +91
                </div>
                <input
                  data-testid={IDS.loginPhone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  inputMode="numeric"
                  className="flex-1 px-3 py-3 outline-none text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <input
                data-testid="login-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("name") + " (optional)"}
                className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-400"
              />
              <button
                data-testid={IDS.loginSendOtp}
                onClick={sendOtp}
                disabled={loading}
                className="mt-5 w-full py-3.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow-md shadow-purple-900/20 transition disabled:opacity-60"
              >
                {loading ? "..." : t("send_otp")}
              </button>
              <div className="mt-4 text-center text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 inline text-emerald-600 mr-1" />
                {t("demo_hint")}
              </div>
            </>
          ) : (
            <>
              <button data-testid="otp-back-button" onClick={() => setStep("phone")} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs mb-3">
                <ArrowLeft className="w-4 h-4" /> બદલો
              </button>
              <div className="text-sm text-slate-600 mb-1">{t("enter_otp")}</div>
              <div className="text-xs text-slate-500 mb-4">+91 {cleanPhone}</div>
              <input
                data-testid={IDS.otpInput}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 text-center text-2xl tracking-[0.5em] font-bold text-purple-900"
              />
              <button
                data-testid={IDS.otpVerify}
                onClick={verifyOtp}
                disabled={loading}
                className="mt-5 w-full py-3.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow-md shadow-purple-900/20 disabled:opacity-60"
              >
                {loading ? "..." : t("verify_otp")}
              </button>
              <button
                data-testid={IDS.otpResend}
                disabled={timer > 0}
                onClick={sendOtp}
                className="mt-3 w-full text-sm text-purple-800 disabled:text-slate-400"
              >
                {timer > 0 ? `${t("resend_otp")} (${timer}s)` : t("resend_otp")}
              </button>
              <div className="mt-4 text-center text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 inline text-emerald-600 mr-1" />
                {t("demo_hint")}
              </div>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-4 px-6">Terms & Privacy Policy સ્વીકારીને આગળ વધો</p>
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
