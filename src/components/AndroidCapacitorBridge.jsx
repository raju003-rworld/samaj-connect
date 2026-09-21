import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { toast } from "sonner";

export default function AndroidCapacitorBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Configure Status Bar for native Android
    const initStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#3b0764" }); // Purple 900
      } catch (err) {
        console.warn("StatusBar setup:", err?.message || err);
      }
    };
    initStatusBar();

    // Network status change feedback
    const handleOffline = () => {
      toast.error("ઇન્ટરનેટ કનેક્શન બંધ છે. કૃપા કરીને ચેક કરો.", { id: "net-offline" });
    };
    const handleOnline = () => {
      toast.success("ઇન્ટરનેટ કનેક્ટ થયું!", { id: "net-online", duration: 2500 });
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!Capacitor.isNativePlatform()) {
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      };
    }

    // 1. Hardware Back Button Handling
    let lastBackPress = 0;
    const backListener = CapApp.addListener("backButton", ({ canGoBack }) => {
      // Step A: Check if any open dialog, modal, drawer, or sheet is open in DOM
      const openDialog = document.querySelector(
        '[data-state="open"], [role="dialog"], [data-radix-dialog-content], .vaul-drawer[data-state="open"]'
      );
      if (openDialog) {
        // Dispatch Escape key to gracefully trigger Radix/Shadcn dialog closure
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
        const closeBtn = document.querySelector(
          '[data-state="open"] button[aria-label="Close"], [role="dialog"] button[aria-label="Close"], [data-dialog-close]'
        );
        if (closeBtn && typeof closeBtn.click === "function") {
          closeBtn.click();
        }
        return;
      }

      // Step B: Check current route
      const currentPath = window.location.pathname;

      // On root landing or login screens, double-tap back to exit with friendly toast
      if (currentPath === "/reels" || currentPath === "/" || currentPath === "/login") {
        const now = Date.now();
        if (now - lastBackPress < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPress = now;
          toast.info("એપ બંધ કરવા માટે ફરીથી બેક દબાવો", {
            id: "back-exit-toast",
            duration: 2000,
          });
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
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      backListener.then((sub) => sub.remove()).catch(() => {});
      urlListener.then((sub) => sub.remove()).catch(() => {});
    };
  }, [navigate, location]);

  return null;
}

