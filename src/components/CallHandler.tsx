"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Phone, PhoneOff, Mic, MicOff, X, Video, VideoOff } from "lucide-react";

interface CallData {
  id: number;
  caller_id: number;
  callee_id: number;
  status: string;
  caller_name: string;
  caller_photo: string | null;
}

interface CallHandlerProps {
  user: { id: number; name: string; role: string } | null;
  activeConv: { id: number; other_user: { id: number; name: string; photo: string | null } } | null;
}

const STUN_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function CallHandler({ user, activeConv }: CallHandlerProps) {
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "ringing" | "active" | "ended">("idle");
  const [micMuted, setMicMuted] = useState(false);
  const [lastSignalId, setLastSignalId] = useState<number>(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraOff, setCameraOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const lastSignalIdRef = useRef(lastSignalId);
  useEffect(() => {
    lastSignalIdRef.current = lastSignalId;
  }, [lastSignalId]);

  // Sync media streams to video elements when refs mount
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  // Poll for incoming calls
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const res = await fetch("/api/calls/incoming");
        if (res.ok) {
          const d = await res.json();
          if (d.call && !incomingCall && callStatus === "idle") {
            setIncomingCall(d.call);
            startRingtone();
          }
        }
      } catch {}
    };
    check();
    pollRef.current = setInterval(check, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); stopRingtone(); };
  }, [user, incomingCall, callStatus]);

  // When call is initiated or active, start signal and status polling
  useEffect(() => {
    if (activeCall) {
      startSignalAndStatusPolling(activeCall.id);
    } else {
      if (signalPollRef.current) {
        clearInterval(signalPollRef.current);
        signalPollRef.current = null;
      }
    }
  }, [activeCall]);

  function startRingtone() {
    try {
      const ctx = new AudioContext();
      function beep() {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
      beep();
      ringtoneRef.current = setInterval(beep, 2000);
    } catch {}
  }

  function stopRingtone() {
    if (ringtoneRef.current) { clearInterval(ringtoneRef.current); ringtoneRef.current = null; }
  }

  async function acceptCall() {
    if (!incomingCall) return;
    stopRingtone();
    try {
      const res = await fetch(`/api/calls/${incomingCall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (res.ok) {
        setActiveCall(incomingCall);
        setIncomingCall(null);
        setCallStatus("active");
        // Callee creates answer after getting offer
        await startWebRTC(incomingCall.id, false);
      }
    } catch {}
  }

  async function rejectCall() {
    if (!incomingCall) return;
    stopRingtone();
    try {
      await fetch(`/api/calls/${incomingCall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    } catch {}
    setIncomingCall(null);
  }

  async function initiateCall(calleeId: number, isVideo: boolean) {
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callee_id: calleeId }),
      });
      if (res.ok) {
        const d = await res.json();
        setActiveCall({ ...d.call, caller_name: user?.name || "", caller_photo: null });
        setCallStatus("calling");
        // Caller creates offer
        await startWebRTC(d.call.id, true);
      }
    } catch {}
  }

  async function endCall() {
    if (!activeCall) return;
    try {
      await fetch(`/api/calls/${activeCall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
    } catch {}
    cleanupCall();
  }

  function cleanupCall() {
    stopRingtone();
    if (signalPollRef.current) { clearInterval(signalPollRef.current); signalPollRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCameraOff(false);
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus("idle");
    setLastSignalId(0);
    setMicMuted(false);
  }

  async function startWebRTC(callId: number, isCaller: boolean) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(STUN_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`/api/calls/${callId}/signal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "ice", data: event.candidate }),
          }).catch(() => {});
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await fetch(`/api/calls/${callId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "offer", data: offer }),
        });
      }
    } catch {
      cleanupCall();
    }
  }

  function startSignalAndStatusPolling(callId: number) {
    if (signalPollRef.current) clearInterval(signalPollRef.current);

    signalPollRef.current = setInterval(async () => {
      try {
        // 1. Fetch Call Status from DB
        const callRes = await fetch(`/api/calls/${callId}`);
        if (callRes.ok) {
          const callData = await callRes.json();
          const status = callData.call?.status;

          if (status === "ended" || status === "rejected" || status === "missed") {
            cleanupCall();
            return;
          }

          if (status === "active" && callStatusRef.current === "calling") {
            setCallStatus("active");
          }
        }

        // 2. Fetch signals
        const sigRes = await fetch(`/api/calls/${callId}/signal?since=${lastSignalIdRef.current}`);
        if (!sigRes.ok) return;
        const d = await sigRes.json();
        if (!d.signals?.length) return;

        for (const sig of d.signals) {
          if (sig.id > lastSignalIdRef.current) {
            setLastSignalId(sig.id);
          }
          const data = typeof sig.data === "string" ? JSON.parse(sig.data) : sig.data;

          if (sig.type === "offer" && pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await fetch(`/api/calls/${callId}/signal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "answer", data: answer }),
            });
          } else if (sig.type === "answer" && pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
          } else if (sig.type === "ice" && pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data));
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = micMuted;
      });
      setMicMuted(!micMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = cameraOff;
      });
      setCameraOff(!cameraOff);
    }
  };

  return (
    <>
      {/* Incoming call overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80">
          <div className="glass-strong mx-4 w-full max-w-sm rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              {incomingCall.caller_photo ? (
                <Image src={incomingCall.caller_photo} alt="" width={96} height={96} className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {incomingCall.caller_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-white">{incomingCall.caller_name}</h2>
            <p className="mt-1 text-sm text-zinc-400">Incoming video call...</p>
            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                onClick={rejectCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105"
              >
                <PhoneOff className="h-7 w-7" />
              </button>
              <button
                onClick={acceptCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white transition-transform hover:scale-105"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active call overlay */}
      {activeCall && callStatus === "active" && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-black">
          <div className="relative flex-1 bg-zinc-900">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-contain" />
            <div className="absolute bottom-6 right-6 h-48 w-36 overflow-hidden rounded-2xl border-2 border-white/20 bg-zinc-800 shadow-xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 bg-zinc-900 px-6 py-6">
            <button
              onClick={toggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${micMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              {micMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${cameraOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              {cameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </button>
            <button
              onClick={endCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Calling overlay */}
      {activeCall && callStatus === "calling" && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mx-auto mb-4 h-24 w-24 animate-pulse overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                {activeConv?.other_user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white">Calling {activeConv?.other_user.name}...</h2>
            <p className="mt-1 text-sm text-zinc-400">Waiting for them to answer</p>
            <button
              onClick={endCall}
              className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
