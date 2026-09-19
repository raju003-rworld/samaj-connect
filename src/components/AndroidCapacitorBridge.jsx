import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function AndroidCapacitorBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Configure Status Bar for native Android
    const initStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#3b0764" }); // Purple 900
      } catch (err) {
        console.warn("StatusBar setup:", err?.message || err);
      }
    };
    initStatusBar();

    // 1. Hardware Back Button Handling
    let lastBackPress = 0;
    const backListener = CapApp.addListener("backButton", ({ canGoBack }) => {
      const currentPath = window.location.pathname;

      // On root landing or login screens, double-tap back to exit
      if (currentPath === "/reels" || currentPath === "/" || currentPath === "/login") {
        const now = Date.now();
        if (now - lastBackPress < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPress = now;
        }
      } else if (canGoBack) {
        window.history.back();
      } else {
        navigate("/reels", { replace: true });
      }
    });

    // 2. Deep Linking Handling (https://samajconnect.app/* or samajconnect://*)
    const urlListener = CapApp.addListener("appUrlOpen", (event) => {
      try {
        const url = new URL(event.url);
        // Extract internal path e.g. /reels, /p/xyz, /profile
        const path = url.pathname || "";
        const search = url.search || "";
        const hash = url.hash || "";
        if (path) {
          navigate(path + search + hash);
        }
      } catch (err) {
        console.warn("Deep link parse error:", err?.message || err);
      }
    });

    return () => {
      backListener.then((sub) => sub.remove()).catch(() => {});
      urlListener.then((sub) => sub.remove()).catch(() => {});
    };
  }, [navigate, location]);

  return null;
}
