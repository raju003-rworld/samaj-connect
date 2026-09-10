import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Phone, KeyRound, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { signInCustom } from "@/lib/firebase";
import { useApp } from "@/context/AppContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { refreshUser } = useApp();
  const [phone, setPhone] = useState("9876543210");
  const [password, setPassword] = useState("Admin@Samaj2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const res = await api.post("/auth/admin-login", {
        phone: cleanPhone,
        password: password,
      });

      if (res.data?.success && res.data?.customToken) {
        // Store admin token in session
        sessionStorage.setItem("admin_token", res.data.customToken);
        localStorage.setItem("admin_token", res.data.customToken);

        // Sign in custom to Firebase auth layer
        try {
          await signInCustom(res.data.customToken, `+91${cleanPhone}`);
        } catch (authErr) {
          console.warn("signInCustom warning:", authErr);
        }

        if (refreshUser) {
          await refreshUser().catch(() => {});
        }

        toast.success(`સ્વાગત છે, ${res.data.user.name}`, {
          description: `એડમિન રોલ: ${res.data.user.adminRole}`,
        });

        navigate("/admin", { replace: true });
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || "લોગિન નિષ્ફળ ગયું. કૃપા કરીને વિગતો તપાસો.";
      setErrorMsg(serverMsg);
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (rolePhone, rolePass) => {
    setPhone(rolePhone);
    setPassword(rolePass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Bar */}
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

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/50 text-purple-400 mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">સુરક્ષિત એડમિન લોગિન</h2>
            <p className="text-xs text-slate-400 mt-1">
              માત્ર અધિકૃત સુપર એડમિન અને સમાજ સંચાલકો માટે
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
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
                  placeholder="9876543210"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                એડમિન પાસવર્ડ અથવા સિક્યોરિટી પિન (Password / OTP)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                સુરક્ષા નિયમ: માત્ર સર્વર-માન્ય એડમિન રોલ ધરાવતા યુઝર્સને જ મંજૂરી મળશે.
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
                  <span>એડમિન પેનલમાં પ્રવેશ કરો</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role testing shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              ઝડપી રોલ ટેસ્ટિંગ સ્વીચર (Dev / Test Roles)
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setDemoRole("9876543210", "Admin@Samaj2026")}
                className="text-left px-3 py-2 rounded-lg bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/40 text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-purple-300">૧. Super Admin</div>
                  <div className="text-[10px] text-slate-400 font-mono">+91 98765 43210 (સર્વોચ્ચ નિયંત્રણ)</div>
                </div>
                <span className="text-[10px] font-semibold bg-purple-800/50 text-purple-200 px-2 py-0.5 rounded">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole("9825000001", "Admin@Samaj2026")}
                className="text-left px-3 py-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-800/40 text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-indigo-300">૨. Main Samaj Admin</div>
                  <div className="text-[10px] text-slate-400 font-mono">+91 98250 00001 (મુખ્ય પાટીદાર સમાજ)</div>
                </div>
                <span className="text-[10px] font-semibold bg-indigo-800/50 text-indigo-200 px-2 py-0.5 rounded">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole("9825000002", "Admin@Samaj2026")}
                className="text-left px-3 py-2 rounded-lg bg-sky-950/40 hover:bg-sky-950/70 border border-sky-800/40 text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-sky-300">૩. Samaj Chapter Admin</div>
                  <div className="text-[10px] text-slate-400 font-mono">+91 98250 00002 (અમદાવાદ સમાજ શાખા)</div>
                </div>
                <span className="text-[10px] font-semibold bg-sky-800/50 text-sky-200 px-2 py-0.5 rounded">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole("9825123456", "WrongPassword")}
                className="text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs flex items-center justify-between text-slate-400 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-300">૪. Normal Member (Test Rejection)</div>
                  <div className="text-[10px] text-slate-500 font-mono">+91 98251 23456 (પ્રોટેક્શન ટેસ્ટ)</div>
                </div>
                <span className="text-[10px] text-slate-500">Test Reject</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
        સમાજ કનેક્ટ વહીવટી સિસ્ટમ © {new Date().getFullYear()} · સર્વ હક સુરક્ષિત · Server-Enforced RBAC
      </footer>
    </div>
  );
}
