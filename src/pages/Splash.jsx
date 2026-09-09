import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { IDS } from "@/constants/testIds";

export default function Splash() {
  const nav = useNavigate();
  const { user, booting } = useApp();

  useEffect(() => {
    if (booting) return;
    const t = setTimeout(() => nav(user ? "/home" : "/login", { replace: true }), 1400);
    return () => clearTimeout(t);
  }, [booting, user, nav]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-900 relative overflow-hidden flex items-center justify-center px-6">
      {/* Decorative circles */}
      <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative text-center animate-fade-in-up">
        <div data-testid={IDS.splashLogo} className="mx-auto w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl text-purple-100 animate-pulse-ring">
          <Users2 className="w-14 h-14" />
        </div>
        <h1 className="font-heading font-extrabold text-white text-4xl sm:text-5xl mt-8 tracking-tight">
          SAMAJ <span className="text-purple-300">CONNECT</span>
        </h1>
        <p className="text-purple-200/90 mt-3 text-base sm:text-lg">સમાજને જોડતું એક ડિજિટલ પ્લેટફોર્મ</p>
        <p className="text-purple-300/60 mt-1 text-sm">એક સમાજ... એક પરિવાર...</p>

        <div className="mt-12 mx-auto w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 bg-purple-300 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
