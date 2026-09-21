import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  testBackendConnection,
  getBaseApiUrl,
  setCustomBackendUrl,
  SHARED_PROD_URL,
  DEV_CONTAINER_URL,
} from "@/lib/api";
import { toast } from "sonner";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Smartphone, Server } from "lucide-react";

export default function AndroidDiagnosticsModal({ open, onOpenChange }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform();
  const currentBase = getBaseApiUrl();

  useEffect(() => {
    if (open) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("sc_backend_url") || "" : "";
      setCustomUrlInput(stored);
      runTest();
    }
  }, [open]);

  const runTest = async (overrideUrl) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testBackendConnection(overrideUrl);
      setTestResult(res);
      if (res.ok) {
        toast.success(`સર્વર કનેક્શન સફળ! લેટન્સી: ${res.latency}ms`);
      } else {
        toast.error(`સર્વર કનેક્શનમાં ભૂલ: ${res.error}`);
      }
    } catch (err) {
      setTestResult({ ok: false, error: err?.message || "ટેસ્ટ નિષ્ફળ" });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCustom = (urlToSet) => {
    setCustomBackendUrl(urlToSet);
    toast.success("સર્વર URL અપડેટ થઈ ગયું!");
    runTest(urlToSet);
  };

  const handleResetDefault = () => {
    setCustomBackendUrl("");
    setCustomUrlInput("");
    toast.success("ડિફોલ્ટ સર્વર URL રીસેટ થયું");
    runTest();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92%] rounded-3xl p-5 bg-white text-slate-900 border border-slate-200">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-900 grid place-items-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-heading font-bold text-base text-slate-900">
                Android APK સર્વર સ્ટેટસ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                સર્વર કનેક્શન, સ્પીડ અને નેટવર્ક ડાયગ્નોસ્ટિક્સ
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Status Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">એપ પ્લેટફોર્મ:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900">
                {isNative ? "📱 Android Native APK" : "🌐 Web Browser"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">સક્રિય સર્વર API:</span>
              <span className="text-[11px] font-mono font-medium text-slate-700 truncate max-w-[200px]" title={currentBase}>
                {currentBase}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-600">કનેક્શન પરિણામ:</span>
              {testing ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-purple-700 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ટેસ્ટિંગ...
                </span>
              ) : testResult?.ok ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> સફળ ({testResult.latency}ms)
                </span>
              ) : testResult ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> નિષ્ફળ
                </span>
              ) : (
                <span className="text-xs text-slate-400">ટેસ્ટ નથી થયો</span>
              )}
            </div>
          </div>

          {/* Test Action */}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={() => runTest()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              કનેક્શન ટેસ્ટ કરો (Test Speed)
            </button>
          </div>

          {/* Preset Buttons for One-Click Switch */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              સર્વર પસંદગી (One-Click Server Switch)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomUrlInput(SHARED_PROD_URL);
                  handleSaveCustom(SHARED_PROD_URL);
                }}
                className={`p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                  currentBase.includes("ais-pre-")
                    ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-bold">🚀 Shared Prod (Default)</div>
                <div className="text-[9px] text-slate-400 truncate">ais-pre-fzquurunf...</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomUrlInput(DEV_CONTAINER_URL);
                  handleSaveCustom(DEV_CONTAINER_URL);
                }}
                className={`p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                  currentBase.includes("ais-dev-")
                    ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="text-[11px] font-bold">🛠️ Dev Container</div>
                <div className="text-[9px] text-slate-400 truncate">ais-dev-fzquurunf...</div>
              </button>
            </div>
          </div>

          {/* Custom Backend URL Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              કસ્ટમ સર્વર URL (Custom Host):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://your-domain.com"
                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 font-mono"
              />
              <button
                type="button"
                onClick={() => handleSaveCustom(customUrlInput)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer"
              >
                સેવ
              </button>
            </div>
            {customUrlInput && (
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-purple-700 hover:underline cursor-pointer pt-0.5"
              >
                ડિફોલ્ટ રીસેટ કરો
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
