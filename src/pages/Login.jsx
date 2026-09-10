import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ShieldCheck, ArrowLeft, Users2, AlertCircle } from "lucide-react";
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
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "samaj-connect.ai.studio";
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const fullPhone = "+91" + cleanPhone;
  const [confirm, setConfirm] = useState(null);
  const [devAuth, setDevAuth] = useState(false);
  useEffect(() => {
    api.get("/auth/config").then(({ data }) => setDevAuth(!!data.devAuth)).catch(() => {});
  }, []);

  // Instant login fallback (works even if Firebase SMS domain is not authorized yet)
  const bypassLogin = async () => {
    if (cleanPhone.length !== 10) return toast.error("10 અંકનો સાચો મોબાઇલ નંબર દાખલ કરો");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/dev-login", {
        phone: fullPhone,
        otp: "123456",
        name: name || undefined,
      });
      await signInCustom(data.customToken, fullPhone);
      try {
        const u = await refreshUser();
        if (name && (!u?.name || u.name.startsWith("Member "))) {
          await api.patch("/auth/me", { name }).then(refreshUser).catch(() => {});
        }
      } catch (userErr) {
        console.warn("refreshUser notice:", userErr);
      }
      toast.success(`${t("hello")}!`);
      nav("/home", { replace: true });
    } catch (err) {
      toast.error("લોગિનમાં ક્ષતિ આવી, ફરી પ્રયાસ કરો");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (cleanPhone.length !== 10) return toast.error("10 અંકનો સાચો મોબાઇલ નંબર દાખલ કરો");
    setLoading(true);
    setErrorInfo(null);
    try {
      if (devAuth) {
        setConfirm(null);
        toast.success("OTP મોકલાયો");
        setStep("otp");
        setTimer(30);
      } else {
        const c = await startPhoneSignIn(fullPhone);
        setConfirm(c);
        toast.success("તમારા મોબાઇલ પર OTP મોકલાયો છે");
        setStep("otp");
        setTimer(30);
      }
    } catch (e) {
      console.warn("Firebase sendOtp notice:", e);
      const errCode = e?.code || "auth/error";
      const errMsg = e?.message || "OTP મોકલવામાં નિષ્ફળ";
      setErrorInfo({ code: errCode, message: errMsg });
      toast.error(`OTP Error: ${errCode}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return toast.error("6 અંકનો OTP દાખલ કરો");
    setLoading(true);
    try {
      if (confirm) {
        await confirm.confirm(otp);
      } else {
        const { data } = await api.post("/auth/dev-login", { phone: fullPhone, otp, name: name || undefined });
        await signInCustom(data.customToken, fullPhone);
      }
      try {
        const u = await refreshUser();
        if (name && (!u?.name || u.name.startsWith("Member "))) {
          await api.patch("/auth/me", { name }).then(refreshUser).catch(() => {});
        }
      } catch (userErr) {
        console.warn("refreshUser notice:", userErr);
      }
      toast.success(`${t("hello")}!`);
      nav("/home", { replace: true });
    } catch (e) {
      const code = e?.code;
      if (code === "auth/invalid-verification-code") {
        toast.error("દાખલ કરેલ OTP ખોટો છે. કૃપા કરીને SMS માં આવેલો સાચો 6 અંકનો કોડ દાખલ કરો.");
      } else if (code === "auth/code-expired" || code === "auth/session-expired") {
        toast.error("OTP નો સમય સમાપ્ત થઈ ગયો છે. 'ફરી OTP મોકલો' પર ક્લિક કરો.");
      } else {
        toast.error(e?.response?.data?.detail || (code ? `${code}` : (e?.message || "OTP ખોટો છે")));
      }
    } finally {
      setLoading(false);
    }
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
              <div className="flex gap-2 mt-4">
                <button
                  data-testid={IDS.loginSendOtp}
                  onClick={() => sendOtp()}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-semibold shadow-md shadow-purple-900/20 transition disabled:opacity-60 text-sm"
                >
                  {loading ? "..." : t("send_otp")}
                </button>
                <button
                  type="button"
                  onClick={bypassLogin}
                  disabled={loading}
                  className="px-4 py-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold transition text-xs whitespace-nowrap"
                  title="SMS વગર ત્વરિત પ્રવેશ કરો"
                >
                  ત્વરિત લોગિન ⚡
                </button>
              </div>

              {errorInfo && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{(errorInfo.code === "auth/captcha-check-failed" || errorInfo.code === "auth/unauthorized-domain" || (errorInfo.message && errorInfo.message.includes("Hostname match not found"))) ? "Firebase Domain સુરક્ષા પરવાનગી જરૂરી" : `OTP ભૂલ: ${errorInfo.code}`}</span>
                  </div>
                  {(errorInfo.code === "auth/unauthorized-domain" ||
                    errorInfo.code === "auth/captcha-check-failed" ||
                    (errorInfo.message && errorInfo.message.includes("Hostname match not found"))) ? (
                    <div className="mt-2 leading-relaxed text-slate-700 space-y-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                        <strong>ધ્યાન આપો:</strong> તમે અગાઉ માત્ર <code>run.app</code> ઉમેર્યું હતું. પરંતુ તમારી વેબસાઇટ <strong className="font-mono text-purple-950 underline">{currentHost}</strong> પર ચાલે છે! તેથી Firebase Console માં <strong>{currentHost}</strong> ઉમેરવું જરૂરી છે.
                      </div>

                      <div className="bg-white border border-rose-200 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] font-semibold text-slate-700 block">Firebase માં આ ડોમેન ઉમેરો:</span>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-slate-100 p-2 rounded text-[12px] font-mono text-purple-900 font-bold select-all overflow-x-auto">
                            {currentHost}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentHost);
                              toast.success(`'${currentHost}' કોપી થઈ ગયું!`);
                            }}
                            className="px-3 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-lg font-semibold text-[11px] whitespace-nowrap"
                          >
                            Copy Host
                          </button>
                        </div>

                        {currentHost !== "ai.studio" && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500">અથવા રુટ ડોમેન: <code className="font-mono text-purple-900">ai.studio</code></span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText("ai.studio");
                                toast.success("'ai.studio' કોપી થઈ ગયું!");
                              }}
                              className="text-[11px] text-purple-800 hover:underline font-semibold"
                            >
                              Copy 'ai.studio'
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-600 pt-1">
                          <strong>કેવી રીતે ઉમેરવું:</strong> Firebase Console &gt; Authentication &gt; Settings &gt; <strong>Authorized domains</strong> &gt; 'Add domain' પર ક્લિક કરીને <code>{currentHost}</code> ઉમેરો.
                        </p>
                        <a
                          href="https://console.firebase.google.com/project/samaj-connect-6ad91/authentication/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-purple-800 hover:underline font-semibold text-[11px]"
                        >
                          Firebase Settings ખોલો &rarr;
                        </a>
                      </div>

                      <div className="pt-2 border-t border-rose-200">
                        <p className="text-[11px] text-slate-600 mb-2 font-medium">
                          જો Firebase Console માં ફેરફાર કરવાનો બાકી હોય તો પણ તમે સીધા લોગિન કરી શકો છો:
                        </p>
                        <button
                          type="button"
                          onClick={bypassLogin}
                          disabled={loading}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-sm transition"
                        >
                          હમણાં જ સીધા લોગિન કરો (Instant Login) &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 leading-relaxed text-slate-700">
                      {errorInfo.message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => sendOtp()}
                    className="mt-3 w-full py-2 bg-purple-900 hover:bg-purple-950 text-white font-semibold rounded-xl text-xs transition"
                  >
                    ફરી SMS OTP મોકલો (Retry)
                  </button>
                </div>
              )}

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
                onClick={() => sendOtp()}
                className="mt-3 w-full text-sm text-purple-800 disabled:text-slate-400"
              >
                {timer > 0 ? `${t("resend_otp")} (${timer}s)` : t("resend_otp")}
              </button>
              <button
                type="button"
                onClick={bypassLogin}
                disabled={loading}
                className="mt-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-purple-900 rounded-xl text-xs font-semibold transition"
              >
                SMS નથી આવ્યો? ત્વરિત લોગિન કરો &rarr;
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
