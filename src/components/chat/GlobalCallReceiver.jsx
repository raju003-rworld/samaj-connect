import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { CallOverlay, startRingtoneChime } from "@/components/chat/CallOverlay";

export default function GlobalCallReceiver() {
  const { user } = useApp();
  const location = useLocation();
  const nav = useNavigate();

  const [activeCallData, setActiveCallData] = useState(null);
  const [inCallOverlay, setInCallOverlay] = useState(false);
  const stopAudioRef = useRef(null);

  // Poll for active calls every 2 seconds
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const checkActiveCall = async () => {
      try {
        const { data } = await api.get("/calls/my-active-call");
        if (!mounted) return;

        if (data?.call && data?.conversationId) {
          // If we are already on /messages/:cid, the ChatWindow will handle displaying the CallOverlay
          const currentCid = location.pathname.startsWith("/messages/")
            ? location.pathname.split("/messages/")[1]
            : null;

          if (currentCid === data.conversationId) {
            // Already inside ChatWindow, let ChatWindow manage it
            if (!inCallOverlay) {
              setActiveCallData(null);
            }
            return;
          }

          setActiveCallData(data);
        } else {
          setActiveCallData(null);
          setInCallOverlay(false);
        }
      } catch {
        // quiet fallback
      }
    };

    checkActiveCall();
    const timer = setInterval(checkActiveCall, 2000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user?.id, location.pathname, inCallOverlay]);

  const userDigits = user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
  const isMatchUser = (targetId) => {
    if (!targetId || !user) return false;
    if (targetId === user.id) return true;
    if (userDigits && (targetId === `user_${userDigits}` || targetId.includes(userDigits))) return true;
    return false;
  };

  // Handle ringing chime for incoming calls
  useEffect(() => {
    const isIncoming =
      activeCallData?.call &&
      (activeCallData.isIncoming || isMatchUser(activeCallData.call.receiverId)) &&
      (activeCallData.call.status === "calling" || activeCallData.call.status === "ringing") &&
      !inCallOverlay;

    if (isIncoming) {
      if (!stopAudioRef.current) {
        stopAudioRef.current = startRingtoneChime(true);
      }
    } else {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
    }

    return () => {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
    };
  }, [activeCallData, user?.id, inCallOverlay]);

  if (!activeCallData?.call) return null;

  const { call, conversationId, otherUser } = activeCallData;
  const isIncoming =
    (activeCallData.isIncoming || isMatchUser(call.receiverId)) &&
    (call.status === "calling" || call.status === "ringing");

  const handleAccept = async () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    try {
      await api.post(`/conversations/${conversationId}/call/answer`);
      setInCallOverlay(true);
    } catch {
      nav(`/messages/${conversationId}`);
    }
  };

  const handleReject = async () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    try {
      await api.post(`/conversations/${conversationId}/call/reject`);
    } catch {}
    setActiveCallData(null);
    setInCallOverlay(false);
  };

  // If call is actively answered and in overlay
  if (inCallOverlay) {
    return (
      <CallOverlay
        cid={conversationId}
        call={{ ...call, status: "active" }}
        currentUser={user}
        otherUser={otherUser}
        onEndCall={() => {
          setInCallOverlay(false);
          setActiveCallData(null);
        }}
      />
    );
  }

  // If incoming call alert
  if (isIncoming) {
    return (
      <div
        data-testid="global-incoming-call-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-purple-200 text-center space-y-6">
          {/* Pulsing Avatar */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-700 bg-purple-100 grid place-items-center shadow-lg">
              {otherUser?.photo ? (
                <img
                  src={otherUser.photo}
                  alt={otherUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-purple-700" />
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
              {call.callType === "video" ? (
                <>
                  <Video className="w-4 h-4 text-purple-700" /> ઇનકમિંગ વિડિઓ કૉલ
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-purple-700" /> ઇનકમિંગ વૉઇસ કૉલ
                </>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 truncate">
              {otherUser?.name || call.callerName || "સમાજ સભ્ય"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">કૉલ આવી રહ્યો છે... (Ringing)</p>
          </div>

          {/* Accept / Decline Action Buttons */}
          <div className="flex items-center justify-center gap-6 pt-2">
            {/* Decline Button */}
            <div className="text-center space-y-1.5">
              <button
                data-testid="global-call-decline-btn"
                onClick={handleReject}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white grid place-items-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                title="અસ્વીકાર કરો"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <div className="text-xs font-semibold text-slate-600">અસ્વીકાર</div>
            </div>

            {/* Accept Button */}
            <div className="text-center space-y-1.5">
              <button
                data-testid="global-call-accept-btn"
                onClick={handleAccept}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white grid place-items-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-all animate-bounce"
                title="કૉલ ઉપાડો"
              >
                <Phone className="w-6 h-6" />
              </button>
              <div className="text-xs font-semibold text-emerald-700">સ્વીકારો</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
