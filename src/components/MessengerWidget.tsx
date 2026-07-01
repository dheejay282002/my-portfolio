"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Plus, ChevronLeft, User, FileText, Camera, CornerUpLeft, Phone, Video, VideoOff, Mic, MicOff, PhoneOff, X as XIcon } from "lucide-react";
import Image from "next/image";

interface OtherUser {
  id: number;
  name: string;
  photo: string | null;
}

interface Conversation {
  id: number;
  other_user: OtherUser;
  last_message: string;
  last_message_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender_name: string;
  sender_photo: string | null;
  attachment_url: string;
  attachment_type: string;
  reactions: string;
  reply_to_id: number | null;
  reply_content: string | null;
  reply_sender_name: string | null;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_photo: string | null;
}

interface CallData {
  id: number;
  caller_id: number;
  callee_id: number;
  status: string;
  caller_name: string;
  caller_photo: string | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const PROJECT_REQUEST_PREFIX = "📋 PROJECT_REQUEST_SUBMIT";

export default function MessengerWidget() {
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ project_name: "", description: "", tech_stack: "" });
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; sender_name: string; content: string } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeInviteMsgId, setActiveInviteMsgId] = useState<number | null>(null);
  const [submittedInvites, setSubmittedInvites] = useState<Set<number>>(new Set());
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastClosedAtRef = useRef<number>(Date.now());
  const prevUnreadRef = useRef(0);
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call state
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "active" | "ended">("idle");
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const lastSignalIdRef = useRef(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STUN_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // Sync remote stream to video element when ref mounts
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null));
  }, []);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const d = await res.json();
      setConversations(d.conversations);
      if (!open) {
        const count = d.conversations.filter((c: { last_message_at: string }) => {
          const t = new Date(c.last_message_at).getTime();
          return t > lastClosedAtRef.current;
        }).length;
        setUnreadCount(count);
        if (count > prevUnreadRef.current) playNotificationSound();
        prevUnreadRef.current = count;
      }
    }
  }, [open]);

  const fetchMessages = useCallback(async (convId: number) => {
    const res = await fetch(`/api/conversations/${convId}/messages`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages);
    }
  }, []);

  const checkTyping = useCallback(async (convId: number) => {
    const res = await fetch(`/api/conversations/${convId}/typing`);
    if (res.ok) {
      const d = await res.json();
      setTypingUser(d.typing?.name || null);
    }
  }, []);

  const sendTypingSignal = useCallback(async (convId: number) => {
    await fetch(`/api/conversations/${convId}/typing`, { method: "POST" });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchConversations]);

  useEffect(() => {
    if (activeConv && view === "chat") {
      fetchMessages(activeConv.id);
      checkTyping(activeConv.id);
      const id = setInterval(() => {
        fetchMessages(activeConv.id);
        checkTyping(activeConv.id);
      }, 5000);
      return () => {
        clearInterval(id);
        setTypingUser(null);
        if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
      };
    }
  }, [activeConv, view, fetchMessages, checkTyping]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = (conv: Conversation) => {
    setActiveConv(conv);
    setView("chat");
    fetchMessages(conv.id);
  };

  const openNew = async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) {
      const d = await res.json();
      setContacts(d.contacts);
    }
    setView("new");
  };

  const startConversation = async (contact: Contact) => {
    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: contact.id }),
      });
      if (res.ok) {
        const d = await res.json();
        const conv = d.conversation as Conversation;
        setActiveConv(conv);
        setView("chat");
        fetchMessages(conv.id);
        setConversations((prev) => {
          if (prev.find((c) => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
      }
    } finally {
      setSending(false);
    }
  };

  const sendProjectRequestLink = async () => {
    if (!activeConv) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: activeConv.other_user.id,
          content: PROJECT_REQUEST_PREFIX,
        }),
      });
      if (res.ok) {
        await fetchMessages(activeConv.id);
        await fetchConversations();
      }
    } finally {
      setSending(false);
    }
  };

  const submitProjectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.project_name.trim() || !projectForm.description.trim()) return;
    setSubmittingProject(true);
    try {
      const res = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectForm,
          conversation_id: activeConv?.id,
        }),
      });
      if (res.ok) {
        setProjectSubmitted(true);
        if (activeInviteMsgId !== null) {
          setSubmittedInvites((prev) => new Set(prev).add(activeInviteMsgId));
        }
        setProjectForm({ project_name: "", description: "", tech_stack: "" });
        setTimeout(() => { setShowProjectForm(false); setProjectSubmitted(false); setActiveInviteMsgId(null); }, 2000);
      }
    } finally {
      setSubmittingProject(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachmentFile) || !activeConv || sending) return;
    setSending(true);
    try {
      let attachmentUrl = "";
      let attachmentType = "";
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("file", attachmentFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const d = await uploadRes.json();
          attachmentUrl = d.url;
          attachmentType = attachmentFile.type;
        }
      }
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: activeConv.other_user.id,
          content: input.trim(),
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          reply_to_id: replyTo?.id || null,
        }),
      });
      if (res.ok) {
        setInput("");
        if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
        setAttachmentFile(null);
        setAttachmentPreview(null);
        setReplyTo(null);
        await fetchMessages(activeConv.id);
        await fetchConversations();
      }
    } finally {
      setSending(false);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image") && !file.type.startsWith("video")) {
      alert("Only images and videos are supported.");
      return;
    }
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleReaction = async (msgId: number, emoji: string) => {
    const res = await fetch(`/api/messages/${msgId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, reactions: JSON.stringify(d.reactions) } : m))
      );
    }
  };

  // === Call functions ===
  function startRingtone() {
    try {
      const ctx = new AudioContext();
      function beep() {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
      }
      beep();
      ringtoneRef.current = setInterval(beep, 2000);
    } catch {}
  }
  function stopRingtone() { if (ringtoneRef.current) { clearInterval(ringtoneRef.current); ringtoneRef.current = null; } }

  function playNotificationSound() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.frequency.value = 680;
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.15);
      }, 160);
    } catch {}
  }

  async function initiateCall(calleeId: number, _isVideo: boolean) {
    try {
      const res = await fetch("/api/calls", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callee_id: calleeId }),
      });
      if (!res.ok) return;
      const d = await res.json();
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: _isVideo, audio: true });
      localStreamRef.current = stream;
      
      const pc = new RTCPeerConnection(STUN_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (event) => { if (event.streams[0]) setRemoteStream(event.streams[0]); };
      pc.onicecandidate = (event) => {
        if (event.candidate) fetch(`/api/calls/${d.call.id}/signal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "ice", data: event.candidate }) }).catch(() => {});
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await fetch(`/api/calls/${d.call.id}/signal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "offer", data: offer }) });

      setActiveCall({ ...d.call, caller_name: user?.name || "", caller_photo: null });
      setCallStatus("calling");
    } catch { cleanupCall(); }
  }

  async function acceptCall() {
    if (!incomingCall) return;
    stopRingtone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      const pc = new RTCPeerConnection(STUN_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (event) => { if (event.streams[0]) setRemoteStream(event.streams[0]); };
      pc.onicecandidate = (event) => {
        if (event.candidate) fetch(`/api/calls/${incomingCall.id}/signal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "ice", data: event.candidate }) }).catch(() => {});
      };

      await fetch(`/api/calls/${incomingCall.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "accepted" }) });
      setActiveCall(incomingCall); setIncomingCall(null); setCallStatus("active");
    } catch { cleanupCall(); }
  }

  async function rejectCall() {
    if (!incomingCall) return;
    stopRingtone();
    try { await fetch(`/api/calls/${incomingCall.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) }); } catch {}
    setIncomingCall(null);
  }

  async function endCall() {
    if (!activeCall) return;
    try { await fetch(`/api/calls/${activeCall.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ended" }) }); } catch {}
    cleanupCall();
  }

  function cleanupCall() {
    stopRingtone();
    if (signalPollRef.current) { clearInterval(signalPollRef.current); signalPollRef.current = null; }
    if (incomingPollRef.current) { clearInterval(incomingPollRef.current); incomingPollRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
    setRemoteStream(null);
    setCameraOff(false);
    setActiveCall(null); setIncomingCall(null); setCallStatus("idle"); lastSignalIdRef.current = 0; setMicMuted(false);
  }

  function startSignalPolling(callId: number) {
    signalPollRef.current = setInterval(async () => {
      try {
        // Poll Call Status continuously from DB
        const statusRes = await fetch(`/api/calls/${callId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const status = statusData.call?.status;

          if (status === "rejected" || status === "ended" || status === "missed") {
            cleanupCall();
            return;
          }

          if (status === "active" && callStatusRef.current === "calling") {
            setCallStatus("active");
          }
        }

        const res = await fetch(`/api/calls/${callId}/signal?since=${lastSignalIdRef.current}`);
        if (!res.ok) return;
        const d = await res.json();
        if (!d.signals?.length) return;
        for (const sig of d.signals) {
          if (sig.id > lastSignalIdRef.current) lastSignalIdRef.current = sig.id;
          const data = typeof sig.data === "string" ? JSON.parse(sig.data) : sig.data;
          
          if (sig.type === "offer" && pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await fetch(`/api/calls/${callId}/signal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "answer", data: answer }) });
            
            const pcAny = pcRef.current as any;
            if (pcAny.iceQueue) {
              for (const cand of pcAny.iceQueue) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
              pcAny.iceQueue = [];
            }
          } else if (sig.type === "answer" && pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
            
            const pcAny = pcRef.current as any;
            if (pcAny.iceQueue) {
              for (const cand of pcAny.iceQueue) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
              pcAny.iceQueue = [];
            }
          } else if (sig.type === "ice" && pcRef.current) {
            if (pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data)).catch(() => {});
            } else {
              const pcAny = pcRef.current as any;
              if (!pcAny.iceQueue) pcAny.iceQueue = [];
              pcAny.iceQueue.push(data);
            }
          }
        }
      } catch {}
    }, 2000);
  }

  // Poll for incoming calls
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const res = await fetch("/api/calls/incoming");
        if (!res.ok) return;
        const d = await res.json();
        if (d.call && !incomingCall && !activeCall && callStatus === "idle") { setIncomingCall(d.call); startRingtone(); }
      } catch {}
    };
    check();
    incomingPollRef.current = setInterval(check, 3000);
    return () => { if (incomingPollRef.current) clearInterval(incomingPollRef.current); stopRingtone(); };
  }, [user, incomingCall, activeCall, callStatus]);

  // Start/stop signal polling when call is active or calling
  useEffect(() => {
    if ((callStatus === "active" || callStatus === "calling") && activeCall) {
      startSignalPolling(activeCall.id);
    }
    return () => {
      if (signalPollRef.current) {
        clearInterval(signalPollRef.current);
        signalPollRef.current = null;
      }
    };
  }, [callStatus, activeCall]);

  function toggleMute() {
    if (localStreamRef.current) { localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = micMuted; }); setMicMuted(!micMuted); }
  }

  function toggleCamera() {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = cameraOff;
      });
      setCameraOff(!cameraOff);
    }
  }

  if (!user) return null;

  return (<>
    <div className="fixed bottom-6 right-6 z-[100]">
      {!open ? (
        <button
          onClick={() => { setOpen(true); setUnreadCount(0); prevUnreadRef.current = 0; }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div className="glass-strong flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl shadow-2xl max-sm:h-[480px] max-sm:w-[calc(100vw-48px)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              {view === "chat" && (
              <button
                onClick={() => { setView("list"); setActiveConv(null); if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; } }}
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <span className="font-semibold text-white text-sm">
                {view === "chat"
                  ? activeConv?.other_user.name || "Chat"
                  : view === "new"
                    ? "New Message"
                    : "Messages"}
              </span>
            </div>
            <button
              onClick={() => { setOpen(false); lastClosedAtRef.current = Date.now(); }}
              className="text-zinc-400 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {view === "list" && (
              <div>
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <MessageSquare className="mb-3 h-8 w-8" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openChat(conv)}
                      className="flex w-full items-center gap-3 border-b border-white/5 px-5 py-4 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                        {conv.other_user.photo ? (
                          <Image
                            src={conv.other_user.photo}
                            alt=""
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                            {conv.other_user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {conv.other_user.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.last_message_at && (
                          <span className="text-[10px] text-zinc-600">
                            {timeAgo(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
                <button
                  onClick={openNew}
                  className="flex w-full items-center justify-center gap-2 border-t border-white/5 px-5 py-4 text-sm text-cyan-400 transition-colors hover:bg-white/5"
                >
                  <Plus className="h-4 w-4" />
                  New Message
                </button>
              </div>
            )}

            {view === "new" && (
              <div>
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <User className="mb-3 h-8 w-8" />
                    <p className="text-sm">No other users found</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => startConversation(contact)}
                      className="flex w-full items-center gap-3 border-b border-white/5 px-5 py-4 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                        {contact.profile_photo ? (
                          <Image
                            src={contact.profile_photo}
                            alt=""
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                            {contact.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {contact.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {view === "chat" && activeConv && (
              <div className="flex h-full flex-col overflow-x-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-zinc-500">
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      const isProjectRequest = msg.content === PROJECT_REQUEST_PREFIX;
                      const inviteDone = submittedInvites.has(msg.id);
                      if (isProjectRequest && !isMine && inviteDone) return null;

                      const hasImage = msg.attachment_url && msg.attachment_type.startsWith("image");
                      const hasVideo = msg.attachment_url && msg.attachment_type.startsWith("video");
                      const hasMedia = hasImage || hasVideo;

                      let reactions: Record<string, number[]> = {};
                      try { reactions = JSON.parse(msg.reactions || "{}"); } catch {}

                      return (
                        <div
                          key={msg.id}
                          className="flex flex-col"
                          onMouseEnter={() => setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                        >
                          <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            {isProjectRequest && !isMine ? (
                              <div className="glass rounded-2xl px-5 py-4 max-w-[85%]">
                                <p className="text-xs text-zinc-500 mb-2">
                                  {msg.sender_name} sent a project request form
                                </p>
                                <button
                                  onClick={() => {
                                    setActiveInviteMsgId(msg.id);
                                    setShowProjectForm(true);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                                >
                                  <FileText className="h-4 w-4" />
                                  Submit Project Request
                                </button>
                              </div>
                            ) : hasMedia ? (
                              <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%]`}>
                                {msg.reply_to_id && msg.reply_content !== null && (
                                  <div className="mb-1 w-full rounded-lg border-l-2 border-zinc-500/50 bg-white/5 px-3 py-1.5">
                                    <p className="text-[10px] font-medium text-zinc-500">{msg.reply_sender_name}</p>
                                    <p className="truncate text-xs text-zinc-400">{msg.reply_content}</p>
                                  </div>
                                )}
                                {hasImage && (
                                  <Image
                                    src={msg.attachment_url}
                                    alt=""
                                    width={320}
                                    height={240}
                                    className="w-full cursor-pointer rounded-2xl object-cover"
                                    unoptimized
                                    onClick={() => setLightboxUrl(msg.attachment_url)}
                                  />
                                )}
                                {hasVideo && (
                                  <video
                                    src={msg.attachment_url}
                                    controls
                                    className="w-full rounded-2xl"
                                    style={{ maxHeight: 240 }}
                                  />
                                )}
                                <div className="mt-1 flex items-center gap-2">
                                  {msg.content && (
                                    <div
                                      className={`rounded-2xl px-4 py-2 text-sm ${
                                        isMine
                                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                          : "glass text-zinc-300"
                                      }`}
                                    >
                                      {!isMine && (
                                        <p className="mb-0.5 text-[10px] font-medium text-zinc-500">
                                          {msg.sender_name}
                                        </p>
                                      )}
                                      <p className="break-words">{msg.content}</p>
                                    </div>
                                  )}
                                  <p className="text-[10px] text-zinc-500 shrink-0">
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                  isMine
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                    : "glass text-zinc-300"
                                }`}
                              >
                                {!isMine && (
                                  <p className="mb-1 text-[10px] font-medium text-zinc-500">
                                    {msg.sender_name}
                                  </p>
                                )}
                                {msg.reply_to_id && msg.reply_content !== null && (
                                  <div className={`mb-1.5 rounded-lg border-l-2 px-2.5 py-1 text-xs ${isMine ? "border-white/30 bg-white/10" : "border-zinc-500/50 bg-white/5"}`}>
                                    <p className={`text-[10px] font-medium ${isMine ? "text-white/70" : "text-zinc-500"}`}>{msg.reply_sender_name}</p>
                                    <p className={`truncate ${isMine ? "text-white/60" : "text-zinc-400"}`}>{msg.reply_content}</p>
                                  </div>
                                )}
                                {msg.content && <p className="break-words">{msg.content}</p>}
                                <p
                                  className={`mt-1 text-[10px] ${
                                    isMine ? "text-white/60" : "text-zinc-600"
                                  }`}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Reaction badges */}
                          {Object.keys(reactions).length > 0 && (
                            <div className={`flex gap-1 -mt-1 ${isMine ? "justify-end mr-1" : "justify-start ml-1"}`}>
                              {Object.entries(reactions).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-colors ${
                                    users.includes(user.id)
                                      ? "bg-cyan-500/20 text-cyan-400"
                                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                  }`}
                                >
                                  {emoji} {users.length}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Reaction picker on hover */}
                          {hoveredMsgId === msg.id && (
                            <div className={`flex gap-0.5 ${isMine ? "justify-end mr-2" : "justify-start ml-2"} -mb-1`}>
                              <div className="flex items-center gap-0.5 rounded-full bg-zinc-800 px-1.5 py-1 shadow-lg">
                                {REACTION_EMOJIS.map((emoji) => {
                                  const userReacted = reactions[emoji]?.includes(user.id);
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(msg.id, emoji)}
                                      className={`rounded-full p-1 text-sm transition-transform hover:scale-125 ${
                                        userReacted ? "scale-110" : ""
                                      }`}
                                    >
                                      {emoji}
                                    </button>
                                  );
                                })}
                                <div className="mx-0.5 h-4 w-px bg-zinc-700" />
                                <button
                                  onClick={() => {
                                    setReplyTo({
                                      id: msg.id,
                                      sender_name: msg.sender_name,
                                      content: msg.content || (hasImage ? "📷 Photo" : hasVideo ? "🎬 Video" : ""),
                                    });
                                  }}
                                  className="rounded-full p-1 text-xs text-zinc-400 transition-colors hover:text-white"
                                  title="Reply"
                                >
                                  <CornerUpLeft className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  {typingUser && (
                    <div className="flex items-center gap-2 px-2 py-1">
                      <div className="flex items-center gap-0.5">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0ms" }} />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "150ms" }} />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "300ms" }} />
                      </div>
                      <p className="text-xs text-zinc-500">{typingUser} typing...</p>
                    </div>
                  )}
                  <div ref={msgEndRef} />
                </div>

                <div className="border-t border-white/10 px-5 py-3">
                  {replyTo && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-zinc-800/50 px-3 py-2">
                      <CornerUpLeft className="h-4 w-4 shrink-0 text-cyan-400" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-medium text-cyan-400 truncate">Replying to {replyTo.sender_name}</p>
                        <p className="truncate text-xs text-zinc-400">{replyTo.content}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)} className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {attachmentPreview && (
                    <div className="relative mb-2 inline-block">
                      {attachmentFile?.type.startsWith("video") ? (
                        <video src={attachmentPreview} className="h-16 w-24 rounded-lg object-cover" />
                      ) : (
                        <Image src={attachmentPreview} alt="" width={96} height={64} className="h-16 w-24 rounded-lg object-cover" unoptimized />
                      )}
                      <button
                        onClick={() => { setAttachmentFile(null); setAttachmentPreview(null); }}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,video/*"
                      onChange={handleFilePick}
                      className="hidden"
                    />
                    <div className="relative">
                      <button
                        onClick={() => setShowPlusMenu((p) => !p)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl glass text-zinc-400 transition-colors hover:text-cyan-400"
                        title="More"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      {showPlusMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowPlusMenu(false)} />
                          <div className="absolute bottom-full left-0 z-20 mb-2 w-48 overflow-hidden rounded-xl glass-strong shadow-xl">
                            <button
                              onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                            >
                              <Camera className="h-4 w-4 text-cyan-400" />
                              Photo / Video
                            </button>
                            <button
                              onClick={() => { if (activeConv) initiateCall(activeConv.other_user.id, true); setShowPlusMenu(false); }}
                              disabled={!activeConv}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                            >
                              <Video className="h-4 w-4 text-cyan-400" />
                              Video Call
                            </button>
                            <button
                              onClick={() => { if (activeConv) initiateCall(activeConv.other_user.id, false); setShowPlusMenu(false); }}
                              disabled={!activeConv}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                            >
                              <Phone className="h-4 w-4 text-cyan-400" />
                              Audio Call
                            </button>
                            {user?.role === "admin" && (
                              <button
                                onClick={() => { sendProjectRequestLink(); setShowPlusMenu(false); }}
                                disabled={sending}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                              >
                                <FileText className="h-4 w-4 text-cyan-400" />
                                Project Request
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (activeConv) {
                          if (e.target.value && !typingIntervalRef.current) {
                            sendTypingSignal(activeConv.id);
                            typingIntervalRef.current = setInterval(() => sendTypingSignal(activeConv.id), 1500);
                          } else if (!e.target.value && typingIntervalRef.current) {
                            clearInterval(typingIntervalRef.current);
                            typingIntervalRef.current = null;
                          }
                        }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="glass flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || (!input.trim() && !attachmentFile)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Request Form Modal */}
          {showProjectForm && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl">
              <div className="glass-strong mx-4 w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
                {projectSubmitted ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-green-400 font-medium">Project request submitted!</p>
                    <p className="mt-1 text-xs text-zinc-500">The admin will review it shortly.</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-white mb-4">New Project Request</h4>
                    <form onSubmit={submitProjectRequest} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={projectForm.project_name}
                        onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
                        required
                        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                      />
                      <textarea
                        rows={3}
                        placeholder="Project Description"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        required
                        className="glass w-full resize-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Preferred Tech Stack (optional)"
                        value={projectForm.tech_stack}
                        onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
                        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setShowProjectForm(false); setProjectSubmitted(false); setActiveInviteMsgId(null); }}
                          className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingProject}
                          className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {submittingProject ? "Submitting..." : "Submit Request"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
    {lightboxUrl && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
        onClick={() => setLightboxUrl(null)}
      >
        <button
          onClick={() => setLightboxUrl(null)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-6 w-6" />
        </button>
        <Image
          src={lightboxUrl}
          alt=""
          width={900}
          height={600}
          className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
          unoptimized
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}

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
            <button onClick={rejectCall} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105">
              <PhoneOff className="h-7 w-7" />
            </button>
            <button onClick={acceptCall} className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white transition-transform hover:scale-105">
              <Phone className="h-7 w-7" />
            </button>
          </div>
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
          <button onClick={endCall} className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105">
            <PhoneOff className="h-7 w-7" />
          </button>
        </div>
      </div>
    )}

    {/* Active call overlay */}
    {activeCall && callStatus === "active" && (
      <div className="fixed inset-0 z-[300] flex flex-col bg-black">
        <div className="relative flex-1 bg-zinc-900">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center justify-center gap-8 bg-zinc-900 px-6 py-6">
          <button onClick={toggleMute} className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${micMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
            {micMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          <button onClick={toggleCamera} className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${cameraOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
            {cameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>
          <button onClick={endCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105">
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    )}
  </>
);
}
