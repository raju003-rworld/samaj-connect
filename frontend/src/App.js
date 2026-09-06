import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AppProvider, useApp } from "@/context/AppContext";
import AppShell from "@/components/AppShell";
import Splash from "@/pages/Splash";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Members from "@/pages/Members";
import AddMember from "@/pages/AddMember";
import MemberProfile from "@/pages/MemberProfile";
import Social from "@/pages/Social";
import Events from "@/pages/Events";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import ComingSoon from "@/pages/ComingSoon";
import Messages from "@/pages/Messages";
import Live from "@/pages/Live";
import LiveRoom from "@/pages/LiveRoom";
import Notifications from "@/pages/Notifications";
import UserProfile from "@/pages/UserProfile";
import Search from "@/pages/Search";
import PublicPost from "@/pages/PublicPost";

const Protected = ({ children }) => {
  const { user, booting } = useApp();
  if (booting) return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Protected><Home /></Protected>} />
      <Route path="/members" element={<Protected><Members /></Protected>} />
      <Route path="/members/add" element={<Protected><AddMember /></Protected>} />
      <Route path="/members/:id" element={<Protected><MemberProfile /></Protected>} />
      <Route path="/social" element={<Protected><Social /></Protected>} />
      <Route path="/events" element={<Protected><Events /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/admin" element={<Protected><Admin /></Protected>} />
      <Route path="/messages" element={<Protected><Messages /></Protected>} />
      <Route path="/messages/:cid" element={<Protected><Messages /></Protected>} />
      <Route path="/live" element={<Protected><Live /></Protected>} />
      <Route path="/live/:lid" element={<Protected><LiveRoom /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/users/:uid" element={<Protected><UserProfile /></Protected>} />
      <Route path="/search" element={<Protected><Search /></Protected>} />
      <Route path="/p/:pid" element={<PublicPost />} />
      <Route path="/coming-soon" element={<Protected><ComingSoon /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
