import React, { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Web Audio API Ringtone & Chime synthesizer (zero external dependencies, reliable & non-blocking)
function startRingtoneChime(isIncoming = false) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return () => {};
    const ctx = new AudioCtx();
    let isPlaying = true;

    const chime = () => {
      if (!isPlaying || ctx.state === "closed") return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // Incoming call tone: dual pleasant frequency; Outgoing ringback: smooth 440Hz
        osc.frequency.setValueAtTime(isIncoming ? 523.25 : 440, ctx.currentTime);
        if (isIncoming) {
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);
        }
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch {
        // audio policy fallback
      }
    };

    chime();
    const interval = setInterval(chime, 2500);

    return () => {
      isPlaying = false;
      clearInterval(interval);
      try {
        ctx.close();
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export function CallOverlay({
  cid,
  call,
  currentUser,
  otherUser,
  onEndCall,
}) {
  const [currentCall, setCurrentCall] = useState(call);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  const isCaller = currentCall.callerId === currentUser.id;
  const isVideo = currentCall.callType === "video";
  const isActive = currentCall.status === "active";
  const isIncoming = !isCaller && (currentCall.status === "calling" || currentCall.status === "ringing");

  // Keep currentCall in sync if prop changes
  useEffect(() => {
    if (call) {
      setCurrentCall(call);
    }
  }, [call]);

  // Synchronize call state with backend polling every 1200ms
  useEffect(() => {
    let mounted = true;

    const pollCallStatus = async () => {
      try {
        const { data } = await api.get(`/conversations/${cid}/call`);
        if (!mounted) return;

        if (!data || !data.call) {
          // Call was ended or cancelled by peer
          toast.info("કૉલ સમાપ્ત થયો");
          onEndCall();
          return;
        }

        if (data.call.status === "ended" || data.call.status === "rejected") {
          if (data.call.status === "rejected") {
            toast.info("સામેવાળા સભ્યએ કૉલ અસ્વીકાર કર્યો");
          } else {
            toast.info("કૉલ સમાપ્ત થયો");
          }
          onEndCall();
          return;
        }

        setCurrentCall(data.call);
      } catch {
        // network retry
      }
    };

    const interval = setInterval(pollCallStatus, 1200);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [cid, onEndCall]);

  // Ringtone / Chime sound synthesis
  useEffect(() => {
    if (isActive) return;
    const stopAudio = startRingtoneChime(isIncoming);
    return () => {
      stopAudio();
    };
  }, [isActive, isIncoming]);

  // 45-Second Auto Ring Timeout (No answer handling)
  useEffect(() => {
    if (!isActive && (currentCall.status === "calling" || currentCall.status === "ringing")) {
      ringTimeoutRef.current = setTimeout(async () => {
        toast.info("સામેવાળા સભ્ય ઉપલબ્ધ નથી (No answer)");
        try {
          await api.post(`/conversations/${cid}/call/end`, { durationSec: 0 });
        } catch {}
        onEndCall();
      }, 45000);
    }

    return () => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, [isActive, currentCall.status, cid, onEndCall]);

  // Call duration counter when active
  useEffect(() => {
    if (isActive) {
      const startTime = currentCall.answeredAt ? new Date(currentCall.answeredAt).getTime() : Date.now();
      timerRef.current = setInterval(() => {
        const sec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setDuration(sec);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, currentCall.answeredAt]);

  // Handle camera and microphone access
  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            audio: true,
            video: isVideo ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;

          if (localVideoRef.current && isVideo) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Media devices not accessible or restricted:", err);
      }
    }

    if (isActive || (isCaller && isVideo)) {
      initMedia();
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, isCaller, isVideo]);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setMicMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setVideoOff((prev) => !prev);
  };

  const handleAnswer = async () => {
    try {
      const { data } = await api.post(`/conversations/${cid}/call/answer`);
      if (data?.call) {
        setCurrentCall(data.call);
      }
    } catch {
      toast.error("કૉલ જોડવામાં ભૂલ થઈ");
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/conversations/${cid}/call/reject`);
    } catch {
      // ignore
    } finally {
      onEndCall();
    }
  };

  const handleEnd = async () => {
    try {
      await api.post(`/conversations/${cid}/call/end`, { durationSec: duration });
    } catch {
      // ignore
    } finally {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      onEndCall();
    }
  };

  const formatSec = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const displayUser = isCaller
    ? otherUser
    : { name: currentCall.callerName || otherUser?.name, profilePhoto: otherUser?.profilePhoto };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 text-white select-none animate-in fade-in duration-300"
      data-testid="call-overlay"
    >
      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs backdrop-blur-md">
          {isVideo ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <Phone className="w-3.5 h-3.5 text-purple-400" />}
          <span className="font-medium">{isVideo ? "વિડિઓ કૉલ" : "વૉઇસ કૉલ"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>સુરક્ષિત એન્ક્રિપ્ટેડ કૉલ</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center my-4 relative">
        {isVideo && isActive ? (
          /* Video Call View */
          <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {/* Remote Video Tile */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-purple-950/40">
              <div className="w-24 h-24 rounded-full bg-purple-900/60 border-2 border-purple-500/40 grid place-items-center overflow-hidden mb-3 shadow-inner">
                {displayUser?.profilePhoto ? (
                  <img src={displayUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold">{displayUser?.name?.[0] || "U"}</span>
                )}
              </div>
              <div className="text-base font-bold text-slate-100">{displayUser?.name || "સભ્ય"}</div>
              <div className="text-xs text-purple-300/80 mt-1 font-mono">{formatSec(duration)}</div>
            </div>

            {/* Local Video Picture-in-Picture */}
            <div className="absolute bottom-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-2xl bg-black/80 border-2 border-white/20 overflow-hidden shadow-lg z-10">
              {!videoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="w-full h-full grid place-items-center bg-slate-800 text-slate-400 text-xs">
                  કૅમેરા બંધ
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Voice Call / Ringing / Calling View */
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              {/* Pulse rings for ringing/calling */}
              {(currentCall.status === "calling" || currentCall.status === "ringing") && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-purple-600/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-purple-600/10 animate-pulse" />
                </>
              )}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-purple-900/80 border-4 border-purple-500/50 shadow-2xl grid place-items-center overflow-hidden relative z-10">
                {displayUser?.profilePhoto ? (
                  <img src={displayUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-extrabold text-white">{displayUser?.name?.[0] || "U"}</span>
                )}
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">{displayUser?.name || "સભ્ય"}</h3>

            {isActive ? (
              <div className="text-base font-mono text-emerald-400 bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-500/30">
                {formatSec(duration)}
              </div>
            ) : isIncoming ? (
              <div className="text-sm font-medium text-purple-300 animate-pulse">
                ઇનકમિંગ {isVideo ? "વિડિઓ" : "વૉઇસ"} કૉલ આવી રહ્યો છે...
              </div>
            ) : currentCall.status === "ringing" ? (
              <div className="text-sm font-medium text-emerald-300 animate-pulse">
                રિંગ વાગી રહી છે (Ringing)...
              </div>
            ) : (
              <div className="text-sm font-medium text-purple-300 animate-pulse">
                કૉલ થઈ રહ્યો છે (Calling)...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="w-full max-w-md pb-4 sm:pb-8 flex items-center justify-center gap-5 sm:gap-6">
        {isIncoming ? (
          /* Incoming Call Controls: Accept & Reject */
          <div className="flex items-center justify-around w-full px-8">
            <button
              data-testid="reject-call-btn"
              onClick={handleReject}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white grid place-items-center shadow-lg shadow-rose-600/40 transition-transform active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-rose-300">નકારો (Decline)</span>
            </button>

            <button
              data-testid="answer-call-btn"
              onClick={handleAnswer}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white grid place-items-center shadow-lg shadow-emerald-600/40 animate-bounce transition-transform active:scale-95">
                {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </div>
              <span className="text-xs font-semibold text-emerald-300">ઉપાડો (Answer)</span>
            </button>
          </div>
        ) : (
          /* Active or Outgoing Call Controls */
          <>
            {/* Mic Toggle */}
            <button
              data-testid="toggle-mic-btn"
              onClick={toggleMic}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full grid place-items-center transition-all ${
                micMuted ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-white/15 text-white hover:bg-white/25"
              }`}
              title={micMuted ? "માઇક ચાલુ કરો" : "માઇક બંધ કરો"}
            >
              {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Toggle (Only for Video Calls) */}
            {isVideo && (
              <button
                data-testid="toggle-video-btn"
                onClick={toggleVideo}
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full grid place-items-center transition-all ${
                  videoOff ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-white/15 text-white hover:bg-white/25"
                }`}
                title={videoOff ? "કૅમેરા ચાલુ કરો" : "કૅમેરા બંધ કરો"}
              >
                {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            {/* Speaker Toggle (Only for Voice Calls) */}
            {!isVideo && (
              <button
                data-testid="toggle-speaker-btn"
                onClick={() => setSpeakerMuted((prev) => !prev)}
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full grid place-items-center transition-all ${
                  speakerMuted ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-white/15 text-white hover:bg-white/25"
                }`}
                title={speakerMuted ? "સ્પીકર ચાલુ કરો" : "સ્પીકર બંધ કરો"}
              >
                {speakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            )}

            {/* End Call Button */}
            <button
              data-testid="end-call-btn"
              onClick={handleEnd}
              className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white grid place-items-center shadow-xl shadow-rose-600/50 transition-transform active:scale-95"
              title="કૉલ પૂર્ણ કરો"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
