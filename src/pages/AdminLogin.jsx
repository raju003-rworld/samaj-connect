import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Phone, KeyRound, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { startPhoneSignIn, signInCustom } from "@/lib/firebase";
import { useApp } from "@/context/AppContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { refreshUser } = useApp();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [devAuth, setDevAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.get("/auth/config").then(({ data }) => setDevAuth(!!data.devAuth)).catch(() => {});
  }, []);

  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const fullPhone = `+91${cleanPhone}`;

  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    if (cleanPhone.length !== 10) {
      setErrorMsg("કૃપા કરીને 10 અંકનો સાચો મોબાઈલ નંબર દાખલ કરો.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      if (devAuth) {
        setConfirm(null);
        toast.success("OTP મોકલાયો (Dev)");
      } else {
        const c = await startPhoneSignIn(fullPhone);
        setConfirm(c);
        toast.success("તમારા મોબાઈલ પર OTP મોકલાયો છે");
      }
      setStep("otp");
    } catch (err) {
      const code = err?.code || "auth/error";
      setErrorMsg(`OTP મોકલવામાં ભૂલ: ${code}`);
      toast.error(`OTP Error: ${code}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg("6 અંકનો OTP દાખલ કરો.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      // 1) Real Firebase Phone OTP sign-in (produces a genuine Firebase ID token).
      if (confirm) {
        await confirm.confirm(otp);
      } else {
        // Dev-only fallback (server rejects unless DEV_AUTH_ENABLED=true).
        const { data } = await api.post("/auth/dev-login", { phone: fullPhone, otp });
        await signInCustom(data.customToken, fullPhone);
      }

      // 2) Load the verified profile.
      await refreshUser().catch(() => {});

      // 3) Server-side admin authorization check (role decided by ADMIN_ALLOWLIST).
      const res = await api.post("/auth/admin-login", {});
      if (res.data?.success) {
        toast.success(`સ્વાગત છે, ${res.data.user.name}`, {
          description: `એડમિન રોલ: ${res.data.user.adminRole}`,
        });
        navigate("/admin", { replace: true });
      } else {
        setErrorMsg("સર્વર દ્વારા એડમિન ચકાસણી અમાન્ય ઠરી.");
      }
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.code;
      if (status === 403) {
        setErrorMsg(err.response?.data?.message || "તમારું એકાઉન્ટ એડમિન પેનલ માટે અધિકૃત નથી. (Access Denied)");
        toast.error("Access Denied: not an authorized admin account");
      } else if (status === 401) {
        setErrorMsg("પ્રમાણીકરણ નિષ્ફળ. કૃપા કરીને ફરી OTP થી લોગિન કરો.");
      } else if (code === "auth/invalid-verification-code") {
        setErrorMsg("દાખલ કરેલ OTP ખોટો છે. SMS માં આવેલો સાચો 6 અંકનો કોડ દાખલ કરો.");
      } else if (code === "auth/code-expired") {
        setErrorMsg("OTP નો સમય સમાપ્ત થઈ ગયો. ફરી OTP મોકલો.");
      } else {
        setErrorMsg(err?.response?.data?.message || err?.message || "લોગિન નિષ્ફળ ગયું.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              SAMAJ CONNECT
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Admin Console
              </span>
            </h1>
            <p className="text-xs text-slate-400">સમાજ સંચાલન અને વહીવટી પોર્ટલ</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          મુખ્ય એપ પર પાછા જાઓ
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/50 text-purple-400 mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">સુરક્ષિત એડમિન લોગિન</h2>
            <p className="text-xs text-slate-400 mt-1">
              માત્ર અધિકૃત એડમિન · Firebase OTP + સર્વર-વેરિફાઇડ રોલ
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {step === "phone" && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  એડમિન મોબાઈલ નંબર (Mobile Number)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    required
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  સુરક્ષા નિયમ: OTP ચકાસણી પછી માત્ર સર્વર-માન્ય એડમિન એલાઉલિસ્ટ ધરાવતા નંબરને જ પ્રવેશ મળશે.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>OTP મોકલો</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); setErrorMsg(""); }}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> નંબર બદલો
              </button>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  6-અંકનો OTP ({fullPhone})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    required
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>એડમિન પેનલમાં પ્રવેશ કરો</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading}
                className="w-full text-xs text-slate-400 hover:text-purple-300 transition-colors"
              >
                ફરી OTP મોકલો
              </button>
            </form>
          )}

          <div id="recaptcha-container" />
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
        સમાજ કનેક્ટ વહીવટી સિસ્ટમ © {new Date().getFullYear()} · સર્વ હક સુરક્ષિત · Server-Enforced RBAC
      </footer>
    </div>
  );
}
