"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Plus, ChevronLeft, User, FileText, Camera, CornerUpLeft, Phone, Video, VideoOff, Mic, MicOff, PhoneOff, X as XIcon, Upload, AlertCircle, Check, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
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
  const router = useRouter();
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
  const [projectForm, setProjectForm] = useState({ project_name: "", description: "", tech_stack: "", product_id: "" as string | number });
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
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [paymentReferenceNo, setPaymentReferenceNo] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showQRId, setShowQRId] = useState<number | null>(null);

  const formatPrice = (baseline: string) => {
    if (currency === "USD" || rate === 1) return baseline;
    const numbers = baseline.replace(/,/g, "").match(/\d+/g);
    if (!numbers || numbers.length === 0) return baseline;

    const convertedNumbers = numbers.map((n) => {
      const num = Number(n);
      const converted = Math.round(num * rate);
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(converted);
    });

    if (convertedNumbers.length === 2) {
      return `${convertedNumbers[0]} – ${convertedNumbers[1]}${baseline.includes("+") ? "+" : ""}`;
    } else if (convertedNumbers.length === 1) {
      return `${convertedNumbers[0]}${baseline.includes("+") ? "+" : ""}`;
    }
    return baseline;
  };

  const msgEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const loggedUser = d?.user ?? null;
        setUser(loggedUser);
        
        // If user logged in, check if there is a pending package request in localStorage
        if (loggedUser && typeof window !== "undefined") {
          const pending = localStorage.getItem("pending_package_request");
          if (pending) {
            try {
              const { productName, productId } = JSON.parse(pending);
              setOpen(true);
              setShowProjectForm(true);
              setProjectForm({
                project_name: `Request for ${productName}`,
                description: "",
                tech_stack: "",
                product_id: Number(productId)
              });
              localStorage.removeItem("pending_package_request");
            } catch {}
          }
        }
      });

    // Fetch available products
    fetch("/api/products")
      .then(r => r.json())
      .then(d => {
        if (d.products) setAvailableProducts(d.products);
      })
      .catch(() => {});

    // Fetch active payment methods
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => {
        setPaymentMethods(d.methods?.filter((m: any) => m.is_active) || []);
      })
      .catch(() => {});

    // Live Geolocation and Currency Rates check
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const cur = data.currency || "USD";
        setCurrency(cur);
        fetch("https://open.er-api.com/v6/latest/USD")
          .then((r) => r.json())
          .then((ratesData) => {
            if (ratesData.rates && ratesData.rates[cur]) {
              setRate(ratesData.rates[cur]);
            }
          });
      })
      .catch(() => {
        // Fallback guess using timezone offset
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === "Asia/Manila") {
          setCurrency("PHP");
          fetch("https://open.er-api.com/v6/latest/USD")
            .then((r) => r.json())
            .then((ratesData) => {
              if (ratesData.rates && ratesData.rates["PHP"]) {
                setRate(ratesData.rates["PHP"]);
              }
            });
        }
      });
  }, []);

  useEffect(() => {
    const handleOpenRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { productName, productId } = customEvent.detail;
      
      if (!user) {
        // If not logged in, save intent and redirect to login
        localStorage.setItem("pending_package_request", JSON.stringify({ productName, productId }));
        router.push("/login");
        return;
      }

      setOpen(true);
      setShowProjectForm(true);
      setProjectForm({
        project_name: `Request for ${productName}`,
        description: "",
        tech_stack: "",
        product_id: Number(productId)
      });
    };

    window.addEventListener("open-project-request", handleOpenRequest);
    return () => window.removeEventListener("open-project-request", handleOpenRequest);
  }, [user, router]);

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
    if (!paymentReceiptUrl || !paymentReferenceNo.trim()) {
      setErrorMsg("Please upload your 50% downpayment receipt and enter reference number.");
      return;
    }
    setSubmittingProject(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectForm,
          conversation_id: activeConv?.id,
          payment_receipt_url: paymentReceiptUrl,
          payment_reference_no: paymentReferenceNo.trim(),
        }),
      });
      if (res.ok) {
        setProjectSubmitted(true);
        if (activeInviteMsgId !== null) {
          setSubmittedInvites((prev) => new Set(prev).add(activeInviteMsgId));
        }
        setProjectForm({ project_name: "", description: "", tech_stack: "", product_id: "" });
        setPaymentReceiptUrl("");
        setPaymentReferenceNo("");
        setTimeout(() => { setShowProjectForm(false); setProjectSubmitted(false); setActiveInviteMsgId(null); }, 2000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Fake receipt flagged or invalid reference code. Please verify.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setErrorMsg("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setPaymentReceiptUrl(data.url);
      } else {
        setErrorMsg("Failed to upload screenshot. Make sure file size is under 4.5MB.");
      }
    } catch {
      setErrorMsg("An error occurred during file upload.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const sendMessage = async (fileToUpload?: any) => {
    const file = (fileToUpload instanceof File) ? fileToUpload : attachmentFile;
    if ((!input.trim() && !file) || !activeConv || sending) return;
    setSending(true);
    try {
      let attachmentUrl = "";
      let attachmentType = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          alert("Failed to upload file. Please ensure it is under 4.5MB.");
          setAttachmentFile(null);
          setAttachmentPreview(null);
          return;
        }
        const d = await uploadRes.json();
        attachmentUrl = d.url;
        attachmentType = file.type;
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
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to send message. Please ensure files are under 4.5MB.");
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
    sendMessage(file);
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
      ) : !user ? (
        <div className="glass-strong flex h-[420px] w-[340px] flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-2xl max-sm:h-[380px] max-sm:w-[calc(100vw-48px)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-semibold text-white">Get Started</h3>
            <button onClick={() => setOpen(false)} className="text-zinc-500 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
              <MessageSquare className="h-7 w-7 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Let&apos;s Collaborate!</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed px-2">
                Sign in or create an account to start a live conversation, submit project requests, and track progress in real-time.
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => { setOpen(false); router.push("/login"); }}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign In
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/login?tab=signup"); }}
              className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Create Account
            </button>
          </div>
        </div>
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
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
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-3 scrollbar-hide">
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
                    {sending ? (
                      <div className="glass flex-1 rounded-xl px-4 py-2.5 text-sm text-cyan-400 font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "300ms" }} />
                        Sending...
                      </div>
                    ) : (
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
                    )}
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
              <div className="glass-strong mx-4 w-full max-w-sm rounded-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {projectSubmitted ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-green-400 font-medium">Project request submitted!</p>
                    <p className="mt-1 text-xs text-zinc-500">The admin will review it shortly.</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-white mb-4 text-left">New Project Request</h4>
                    
                    {errorMsg && (
                      <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[10px] text-red-400 flex items-center gap-1.5 text-left">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={submitProjectRequest} className="space-y-3">
                      <div>
                        <select
                          value={projectForm.product_id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const prod = availableProducts.find(p => p.id === Number(val));
                            setProjectForm({
                              ...projectForm,
                              product_id: val ? Number(val) : "",
                              project_name: prod ? `Request for ${prod.package_tier}` : projectForm.project_name,
                            });
                          }}
                          className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
                        >
                          <option value="" className="text-zinc-500">Select Package Tier (optional)</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id} className="text-white bg-zinc-950">
                              {p.package_tier} ({formatPrice(p.project_baseline)})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={projectForm.project_name}
                        onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
                        required
                        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 text-left"
                      />
                      
                      <textarea
                        rows={2}
                        placeholder="Project Description"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        required
                        className="glass w-full resize-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 text-left"
                      />
                      
                      <input
                        type="text"
                        placeholder="Preferred Tech Stack (optional)"
                        value={projectForm.tech_stack}
                        onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
                        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 text-left"
                      />

                      {/* Payment Bank Details Instructions */}
                      <div className="my-2 rounded-xl border border-white/5 bg-zinc-950 p-3 text-[10px] text-zinc-400 space-y-2 text-left max-h-[110px] overflow-y-auto leading-relaxed">
                        <p className="font-bold text-white uppercase text-[9px] tracking-wider flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-cyan-400" />
                          🔑 Settle 50% Downpayment
                        </p>
                        <p>A 50% downpayment is required before request submission. Please transfer to any developer account below:</p>
                        <div className="space-y-2 mt-1">
                          {paymentMethods.length === 0 ? (
                            <p className="italic text-zinc-600">No payment accounts configured yet.</p>
                          ) : (
                            paymentMethods.map(m => (
                              <div key={m.id} className="border-t border-white/5 pt-1.5 space-y-0.5">
                                <p className="font-semibold text-zinc-300">{m.provider_name}</p>
                                <p className="text-white font-mono">{m.account_number} ({m.account_name})</p>
                                {m.qr_code_url && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setShowQRId(showQRId === m.id ? null : m.id)}
                                      className="text-cyan-400 hover:underline text-[9px]"
                                    >
                                      {showQRId === m.id ? "Hide QR" : "Show QR Code ↗"}
                                    </button>
                                    {showQRId === m.id && (
                                      <div className="relative h-20 w-20 border border-white/10 rounded-lg overflow-hidden bg-white mt-1">
                                        <img src={m.qr_code_url} alt="QR" className="h-full w-full object-contain" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Downpayment Inputs */}
                      <div className="space-y-2 text-left pt-1 border-t border-white/5">
                        <input
                          type="text"
                          placeholder="Transaction Reference Number"
                          value={paymentReferenceNo}
                          onChange={(e) => setPaymentReferenceNo(e.target.value)}
                          required
                          className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="downpayment-receipt-upload"
                            onChange={handleReceiptUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <label
                            htmlFor="downpayment-receipt-upload"
                            className="cursor-pointer rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white bg-zinc-950/40 inline-flex items-center gap-1.5"
                          >
                            <Upload className="h-3 w-3" />
                            {uploadingReceipt ? "Uploading..." : "Upload Receipt Screenshot"}
                          </label>
                          {paymentReceiptUrl && (
                            <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
                              <Check className="h-3 w-3" /> Added
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => { setShowProjectForm(false); setProjectSubmitted(false); setActiveInviteMsgId(null); setErrorMsg(""); }}
                          className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingProject || uploadingReceipt}
                          className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {submittingProject ? "Analyzing..." : "Submit Request"}
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


  </>
);
}
