import React, { useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Web Audio API Ringtone & Chime synthesizer (zero external dependencies, non-blocking)
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
        // Incoming call tone: pleasant dual frequency; Outgoing ringback: smooth 440Hz
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
        // Audio policy fallback
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
  const [connectionState, setConnectionState] = useState("initiating"); // "initiating" | "connecting" | "connected" | "failed" | "disconnected"
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pcRef = useRef(null);

  const pendingCandidatesRef = useRef([]);
  const processedSignalsRef = useRef(new Set());
  const lastSignalTimeRef = useRef(0);
  const offerSentRef = useRef(false);

  const timerRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  const isCaller = currentCall.callerId === currentUser.id;
  const isVideo = currentCall.callType === "video";
  const isActive = currentCall.status === "active";
  const isIncoming = !isCaller && (currentCall.status === "calling" || currentCall.status === "ringing");

  // Synchronize currentCall if prop changes
  useEffect(() => {
    if (call) {
      setCurrentCall(call);
    }
  }, [call]);

  // Clean WebRTC and media resources completely
  const cleanupMediaAndPeer = useCallback(() => {
    // 1. Stop local audio/video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }

    // 2. Stop remote audio/video tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      remoteStreamRef.current = null;
    }

    // 3. Close RTCPeerConnection
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    // 4. Detach video and audio elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingCandidatesRef.current = [];
    offerSentRef.current = false;
  }, []);

  // Request user media (Microphone for Voice, Mic + Camera for Video)
  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API is not supported in this browser");
      }
      const constraints = {
        audio: true,
        video: isVideo
          ? {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && isVideo) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaError(null);
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      let userMsg = "ઑડિયો/વિડિઓ ડિવાઇસ શરૂ કરવામાં ભૂલ આવી.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userMsg = "માઇક્રોફોન અથવા કૅમેરાની પરવાનગી નકારવામાં આવી છે. કૃપા કરીને બ્રાઉઝર સેટિંગ્સમાં મંજૂરી આપો.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userMsg = "કોઈ માઇક્રોફોન અથવા કૅમેરા ડિવાઇસ મળ્યા નથી.";
      } else if (err.name === "NotReadableError") {
        userMsg = "માઇક્રોફોન અથવા કૅમેરા પહેલેથી જ અન્ય એપ્લિકેશન દ્વારા વપરાશમાં છે.";
      }
      setMediaError(userMsg);
      toast.error(userMsg);
      return null;
    }
  }, [isVideo]);

  // Initialize RTCPeerConnection with STUN/TURN configuration and event handlers
  const initPeerConnection = useCallback(
    async (localStream) => {
      if (pcRef.current) return pcRef.current;

      // Default to Google STUN servers. Optional TURN is only added if explicitly configured via environment.
      let iceServers = [
        { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
      ];
      try {
        const { data } = await api.get("/call/ice-servers");
        if (data?.iceServers?.length) {
          iceServers = data.iceServers;
        }
      } catch {
        // Fallback cleanly to Google STUN
      }

      // Optional client-side TURN fallback (if provided, otherwise omitted)
      const viteTurnUrl = import.meta.env?.VITE_TURN_SERVER_URL;
      if (viteTurnUrl) {
        const viteTurnConfig = { urls: viteTurnUrl.split(",").map((s) => s.trim()) };
        if (import.meta.env?.VITE_TURN_USERNAME) viteTurnConfig.username = import.meta.env.VITE_TURN_USERNAME;
        if (import.meta.env?.VITE_TURN_CREDENTIAL) viteTurnConfig.credential = import.meta.env.VITE_TURN_CREDENTIAL;
        iceServers.push(viteTurnConfig);
      }

      const pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 2,
      });
      pcRef.current = pc;

      // Add local media tracks to PeerConnection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming remote media tracks (Voice audio + Video)
      pc.ontrack = (event) => {
        let remoteStream = remoteStreamRef.current;
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamRef.current = remoteStream;
        }

        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
        } else {
          remoteStreamRef.current.addTrack(event.track);
        }

        if (event.track.kind === "video") {
          setHasRemoteVideo(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch(() => {});
          }
        }

        // Attach remote audio element for voice calls and video calls
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          remoteAudioRef.current.play().catch(() => {});
        }

        setConnectionState("connected");
      };

      // Gather and exchange ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            const candJson = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
            await api.post(`/conversations/${cid}/call/signal`, {
              to: isCaller ? currentCall.receiverId : currentCall.callerId,
              signal: {
                type: "candidate",
                candidate: candJson,
              },
            });
          } catch (err) {
            console.warn("Could not post ICE candidate:", err);
          }
        }
      };

      // Monitor WebRTC Connection State
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("RTCPeerConnection state:", state);
        if (state === "connected") {
          setConnectionState("connected");
        } else if (state === "connecting") {
          setConnectionState("connecting");
        } else if (state === "failed" || state === "disconnected") {
          setConnectionState(state);
          if (state === "failed") {
            toast.error("કૉલ કનેક્શન નિષ્ફળ ગયું (WebRTC Connection Failed)");
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setConnectionState("connected");
        } else if (pc.iceConnectionState === "failed") {
          setConnectionState("failed");
        }
      };

      return pc;
    },
    [cid, currentCall.callerId, currentCall.receiverId, isCaller]
  );

  // Synchronize call state with backend polling every 1000ms
  useEffect(() => {
    let mounted = true;

    const pollCallStatus = async () => {
      try {
        const { data } = await api.get(`/conversations/${cid}/call`);
        if (!mounted) return;

        if (!data || !data.call) {
          toast.info("કૉલ સમાપ્ત થયો");
          cleanupMediaAndPeer();
          onEndCall();
          return;
        }

        if (data.call.status === "ended" || data.call.status === "rejected") {
          if (data.call.status === "rejected") {
            toast.info("સામેવાળા સભ્યએ કૉલ અસ્વીકાર કર્યો");
          } else {
            toast.info("કૉલ સમાપ્ત થયો");
          }
          cleanupMediaAndPeer();
          onEndCall();
          return;
        }

        setCurrentCall(data.call);
      } catch {
        // Network retry
      }
    };

    const interval = setInterval(pollCallStatus, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [cid, onEndCall, cleanupMediaAndPeer]);

  // Start local media eagerly for Caller or once Active
  useEffect(() => {
    if (isCaller || isActive) {
      startLocalMedia();
    }
  }, [isCaller, isActive, startLocalMedia]);

  // Initiate WebRTC Offer when call becomes ACTIVE (Caller side)
  useEffect(() => {
    let mounted = true;

    async function sendOffer() {
      if (!isActive || !isCaller || offerSentRef.current) return;
      offerSentRef.current = true;
      setConnectionState("connecting");

      try {
        const stream = await startLocalMedia();
        if (!mounted) return;
        const pc = await initPeerConnection(stream);
        if (!mounted) return;

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo,
        });
        await pc.setLocalDescription(offer);

        await api.post(`/conversations/${cid}/call/signal`, {
          to: currentCall.receiverId,
          signal: {
            type: "offer",
            sdp: offer.sdp,
          },
        });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    }

    sendOffer();

    return () => {
      mounted = false;
    };
  }, [isActive, isCaller, isVideo, cid, currentCall.receiverId, startLocalMedia, initPeerConnection]);

  // Poll WebRTC signals (Offer, Answer, ICE candidates) every 600ms
  useEffect(() => {
    let mounted = true;

    const pollSignals = async () => {
      if (!isActive && !isCaller && currentCall.status !== "ringing") return;

      try {
        const { data } = await api.get(`/conversations/${cid}/call/signals?since=${lastSignalTimeRef.current}`);
        if (!mounted) return;
        const signals = data?.signals || [];

        for (const sigItem of signals) {
          if (!sigItem || !sigItem.id) continue;
          if (processedSignalsRef.current.has(sigItem.id)) continue;
          processedSignalsRef.current.add(sigItem.id);

          if (sigItem.timestamp && sigItem.timestamp > lastSignalTimeRef.current) {
            lastSignalTimeRef.current = sigItem.timestamp;
          }

          const sig = sigItem.signal || sigItem;
          const sigType = sig.type;

          // Callee receives Offer -> sets RemoteDescription -> creates Answer
          if (sigType === "offer" && !isCaller) {
            console.log("WebRTC: Received offer from caller");
            try {
              let stream = localStreamRef.current;
              if (!stream) {
                stream = await startLocalMedia();
              }
              const pc = await initPeerConnection(stream);

              await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: sig.sdp }));

              // Process any queued ICE candidates that arrived before the offer
              while (pendingCandidatesRef.current.length > 0) {
                const cand = pendingCandidatesRef.current.shift();
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.warn("Failed to add buffered ICE candidate:", e);
                }
              }

              // Create and send WebRTC Answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await api.post(`/conversations/${cid}/call/signal`, {
                to: currentCall.callerId,
                signal: {
                  type: "answer",
                  sdp: answer.sdp,
                },
              });
              setConnectionState("connecting");
            } catch (err) {
              console.error("Error responding to offer:", err);
            }
          }

          // Caller receives Answer -> sets RemoteDescription
          else if (sigType === "answer" && isCaller) {
            console.log("WebRTC: Received answer from callee");
            try {
              const pc = pcRef.current;
              if (pc && pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sig.sdp }));

                // Process queued ICE candidates
                while (pendingCandidatesRef.current.length > 0) {
                  const cand = pendingCandidatesRef.current.shift();
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (e) {
                    console.warn("Failed to add buffered ICE candidate:", e);
                  }
                }
                setConnectionState("connecting");
              }
            } catch (err) {
              console.error("Error setting remote answer:", err);
            }
          }

          // Both sides receive ICE candidates
          else if (sigType === "candidate") {
            if (sig.candidate) {
              const pc = pcRef.current;
              if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
                } catch (err) {
                  console.warn("Error adding direct ICE candidate:", err);
                }
              } else {
                pendingCandidatesRef.current.push(sig.candidate);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error polling call signals:", err);
      }
    };

    const interval = setInterval(pollSignals, 600);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isActive, isCaller, currentCall.status, currentCall.callerId, cid, startLocalMedia, initPeerConnection]);

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
        cleanupMediaAndPeer();
        onEndCall();
      }, 45000);
    }

    return () => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, [isActive, currentCall.status, cid, onEndCall, cleanupMediaAndPeer]);

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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMediaAndPeer();
    };
  }, [cleanupMediaAndPeer]);

  // Control Actions
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = micMuted;
      });
    }
    setMicMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = videoOff;
      });
    }
    setVideoOff((prev) => !prev);
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !speakerMuted;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !speakerMuted;
    }
    setSpeakerMuted((prev) => !prev);
  };

  const handleAnswer = async () => {
    try {
      setConnectionState("connecting");
      const { data } = await api.post(`/conversations/${cid}/call/answer`);
      if (data?.call) {
        setCurrentCall(data.call);
      }
      const stream = await startLocalMedia();
      await initPeerConnection(stream);
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
      cleanupMediaAndPeer();
      onEndCall();
    }
  };

  const handleEnd = async () => {
    try {
      await api.post(`/conversations/${cid}/call/end`, { durationSec: duration });
    } catch {
      // ignore
    } finally {
      cleanupMediaAndPeer();
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
      {/* Hidden real-time WebRTC remote audio playback element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs backdrop-blur-md">
          {isVideo ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <Phone className="w-3.5 h-3.5 text-purple-400" />}
          <span className="font-medium">{isVideo ? "વિડિઓ કૉલ" : "વૉઇસ કૉલ"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-emerald-400">
          {connectionState === "connected" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>સુરક્ષિત કનેક્ટેડ</span>
            </>
          ) : connectionState === "connecting" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-300">કનેક્ટિંગ...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>એન્ડ-ટુ-એન્ડ સુરક્ષિત</span>
            </>
          )}
        </div>
      </div>

      {/* Media Error Banner if any */}
      {mediaError && (
        <div className="w-full max-w-md mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center my-4 relative">
        {isVideo && (isActive || isCaller) ? (
          /* Video Call View */
          <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {/* Real Remote Video Element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                hasRemoteVideo ? "opacity-100" : "opacity-0 absolute"
              }`}
            />

            {/* Remote Video Placeholder when video track not yet flowing */}
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-purple-950/40 p-4">
                <div className="w-24 h-24 rounded-full bg-purple-900/60 border-2 border-purple-500/40 grid place-items-center overflow-hidden mb-3 shadow-inner">
                  {displayUser?.profilePhoto ? (
                    <img src={displayUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold">{displayUser?.name?.[0] || "U"}</span>
                  )}
                </div>
                <div className="text-base font-bold text-slate-100">{displayUser?.name || "સભ્ય"}</div>
                <div className="text-xs text-purple-300/80 mt-1 font-mono">
                  {isActive ? formatSec(duration) : isIncoming ? "ઇનકમિંગ વિડિઓ કૉલ..." : "જોડાઈ રહ્યું છે..."}
                </div>
                {isActive && (
                  <div className="text-[11px] text-emerald-400 mt-2 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>રીયલ WebRTC વિડિઓ સ્ટ્રીમ ચાલુ છે</span>
                  </div>
                )}
              </div>
            )}

            {/* Real Local Video Picture-in-Picture Preview */}
            <div className="absolute bottom-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-2xl bg-black/80 border-2 border-white/20 overflow-hidden shadow-lg z-10">
              {!videoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full grid place-items-center bg-slate-800 text-slate-400 text-xs text-center p-1">
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
              <div className="space-y-2">
                <div className="text-base font-mono text-emerald-400 bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-500/30">
                  {formatSec(duration)}
                </div>
                <div className="text-xs text-emerald-300 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>WebRTC વૉઇસ કૉલ સક્રિય</span>
                </div>
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
                onClick={toggleSpeaker}
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
