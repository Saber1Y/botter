"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api, ChatMessage } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
  Brain,
  Sparkles,
  ArrowRight,
  Trash2,
  ChevronDown,
  Plus,
  Mic,
  MicOff,
  Pencil,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts?: number;
  data?: ChatMessage;
}

function DecisionCard({ data }: { data: ChatMessage }) {
  const [showEvidence, setShowEvidence] = useState(false);
  if (!data.payment) return null;

  const isApproved = data.decision === "APPROVE";
  const isPending = data.decision === "REQUIRE_APPROVAL";
  const Icon = isApproved ? CheckCircle2 : isPending ? AlertTriangle : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="mt-3 overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            Payment Request
          </span>
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
              isApproved
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                : isPending
                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                  : "bg-red-50 text-red-600 ring-1 ring-red-200"
            }`}
          >
            <Icon className="h-3 w-3" />
            {data.decision}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-foreground">{data.payment.recipient}</div>
            <div className="text-[11px] text-muted-foreground">{data.payment.token}</div>
          </div>
          <div className="text-lg font-semibold text-foreground">
            ${data.payment.amount}
          </div>
        </div>

        {data.payment.reason && (
          <div className="mb-3 rounded-lg bg-muted px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{data.payment.reason}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          {data.payment.tx_hash && (
            <a
              href={`https://sepolia.basescan.org/tx/${data.payment.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View on BaseScan
            </a>
          )}
          {data.payment.memory_references && data.payment.memory_references.length > 0 && (
            <button
              type="button"
              onClick={() => setShowEvidence((visible) => !visible)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Brain className="h-3 w-3" />
              {data.payment.memory_references.length} memories used
              <ChevronDown className={`h-3 w-3 transition-transform ${showEvidence ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
        {showEvidence && data.payment.memory_details && data.payment.memory_details.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Sibyl evidence
            </p>
            {data.payment.memory_details.map((memory) => (
              <div key={memory.id} className="rounded-lg bg-muted/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-foreground">{memory.label}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{memory.id}</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {Object.entries(memory.value)
                    .filter(([key]) => key !== "updated_at" && key !== "ts")
                    .map(([key, value]) => `${key}: ${String(value)}`)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const suggestions = [
  "Pay Acme $60",
  "Set my spending limit to $100",
  "I'm saving $2,000 for a MacBook",
  "What are my current rules?",
];

export default function ChatPage() {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [input, setInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sibylAvailable, setSibylAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInput(transcript);
    setEditingMessageIndex(null);
  }, []);
  const speech = useSpeechRecognition(handleVoiceTranscript);

  // Load chat history on mount
  useEffect(() => {
    if (!address) {
      return;
    }

    Promise.all([api.getChatSessions(address), api.getMemoryStatus(address)])
      .then(([loadedSessions, status]) => {
        setSibylAvailable(status.available);
        const availableSessions = [
          { id: "default", name: "General" },
          ...loadedSessions.filter((session) => session.id !== "default"),
        ];
        setSessions(availableSessions);
        setActiveSessionId((current) => current ?? availableSessions[0].id);
      })
      .catch(() => setSibylAvailable(false))
      .finally(() => {
        if (!address) setHistoryLoading(false);
      });
  }, [address]);

  useEffect(() => {
    if (!address || !activeSessionId) return;
    api.getChatHistory(address, activeSessionId)
      .then((history) => {
        const loaded: Message[] = history.map((h) => ({
          role: h.role,
          content: h.content,
          ts: h.ts,
          data: h.payment ? {
            response: h.content,
            intent: h.intent || "CONVERSATION",
            decision: h.decision as ChatMessage["decision"],
            payment: h.payment,
            memory_stored: [],
          } : undefined,
        }));
        setMessages(loaded);
      })
      .catch(() => setSibylAvailable(false))
      .finally(() => setHistoryLoading(false));
  }, [activeSessionId, address]);

  useEffect(() => {
    if (input) setTimeout(() => inputRef.current?.focus(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !address) return;

    const userMessage = input.trim();
    const editIndex = editingMessageIndex;
    const editedMessage = editIndex === null ? null : messages[editIndex];
    setInput("");
    setError(null);
    setLoading(true);

    try {
      if (editIndex !== null) {
        if (!editedMessage?.ts) throw new Error("This message cannot be edited yet.");
        await api.truncateChatHistory(activeSessionId ?? "default", editedMessage.ts, address);
        setMessages((prev) => prev.slice(0, editIndex));
        setEditingMessageIndex(null);
      }
      setMessages((prev) => [...prev, { role: "user", content: userMessage, ts: Date.now() / 1000 }]);
      const response = await api.chat(userMessage, address, activeSessionId ?? undefined);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response, data: response },
      ]);
      if (response.memory_stored?.length > 0) {
        toast(`Stored ${response.memory_stored.length} item(s) to memory`, "success");
      }
    } catch {
      setError("Failed to get response. Please try again.");
      toast("Failed to get response", "error");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [activeSessionId, address, editingMessageIndex, input, loading, messages, toast]);

  const handleNewSession = useCallback(async () => {
    if (!address || !sibylAvailable) return;
    try {
      const session = await api.createChatSession("New conversation", address);
      setSessions((current) => [session, ...current]);
      setActiveSessionId(session.id);
      setMessages([]);
      setInput("");
    } catch {
      setError("Failed to create a new conversation.");
    }
  }, [address, sibylAvailable]);

  const handleDeleteSession = useCallback((session: { id: string; name: string }) => {
    if (!address || !sibylAvailable) return;
    setDeleteTarget(session);
  }, [address, sibylAvailable]);

  const confirmDeleteSession = useCallback(async () => {
    if (!address || !sibylAvailable || !deleteTarget) return;

    setDeletingSessionId(deleteTarget.id);
    try {
      await api.deleteChatSession(deleteTarget.id, address);
      if (deleteTarget.id === "default") {
        setMessages([]);
        setActiveSessionId("default");
      } else {
        setSessions((current) => current.filter((session) => session.id !== deleteTarget.id));
        if (activeSessionId === deleteTarget.id) {
          setHistoryLoading(true);
          setMessages([]);
          setActiveSessionId("default");
        }
      }
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete conversation.");
    } finally {
      setDeletingSessionId(null);
    }
  }, [activeSessionId, address, deleteTarget, sibylAvailable]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    toast("Chat cleared (memory preserved)", "info");
  }, [toast]);

  const handleEditMessage = useCallback((index: number) => {
    const message = messages[index];
    if (message.role !== "user" || !message.ts) return;
    setEditingMessageIndex(index);
    setInput(message.content);
    inputRef.current?.focus();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
            <Bot className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-foreground">AI CFO</h1>
            <p className="text-[11px] text-muted-foreground">Ask Pact anything about your finances</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5 text-[11px] text-accent/70">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking...
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!sibylAvailable && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800 sm:mx-6">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>Sibyl memory is unavailable. Pact has paused autonomous decisions until your financial context is restored.</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={handleNewSession}
          disabled={!address || !sibylAvailable}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          New chat
        </button>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group inline-flex shrink-0 items-center rounded-lg transition-colors ${
              activeSessionId === session.id ? "bg-accent/10 ring-1 ring-accent/20" : "hover:bg-muted"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setHistoryLoading(true);
                setMessages([]);
                setActiveSessionId(session.id);
              }}
              className={`rounded-l-lg px-3 py-1.5 text-[11px] transition-colors ${
                activeSessionId === session.id
                  ? "font-medium text-accent"
                  : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {session.name}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSession(session)}
              disabled={deletingSessionId === session.id}
              aria-label={`Delete ${session.name}`}
              title={`Delete ${session.name}`}
              className="mr-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {historyLoading && address ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-accent mb-3" />
            <span className="text-[13px] text-muted-foreground">Loading chat history...</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                  <Brain className="h-6 w-6 text-accent/60" />
                </div>
                <p className="mb-1 text-[15px] font-medium text-foreground/60">What can I help you with?</p>
                <p className="mb-6 text-[12px] text-muted-foreground">I remember your rules and goals across sessions</p>
                <div className="grid gap-2 sm:grid-cols-2 w-full max-w-md">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-[13px] text-muted-foreground transition-all hover:shadow-md hover:shadow-accent/5 hover:border-accent/20 hover:text-foreground"
                    >
                      <Sparkles className="h-3 w-3 text-accent/40 group-hover:text-accent/60 transition-colors" />
                      {suggestion}
                      <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                className={`group mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-muted ring-1 ring-border"
                        : "bg-accent/10 ring-1 ring-accent/20"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Bot className="h-3 w-3 text-accent" />
                    )}
                  </div>
                   <div
                     className={`relative rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "rounded-br-md bg-accent text-[13px] text-white"
                        : "rounded-bl-md bg-card border border-border text-[13px] text-foreground shadow-sm"
                     }`}
                   >
                     <div className="whitespace-pre-wrap">{msg.content}</div>
                     {msg.data && <DecisionCard data={msg.data} />}
                     {msg.role === "user" && msg.ts && (
                       <button
                         type="button"
                         onClick={() => handleEditMessage(i)}
                         aria-label="Edit message"
                         title="Edit message"
                         className="absolute -left-9 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                       >
                         <Pencil className="h-3 w-3" />
                       </button>
                     )}
                   </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex justify-start"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                    <Bot className="h-3 w-3 text-accent" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent/40 animate-bounce [animation-delay:0ms]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-accent/40 animate-bounce [animation-delay:150ms]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-accent/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deletingSessionId) setDeleteTarget(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-conversation-title"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-200">
                <Trash2 className="h-4 w-4" />
              </div>
              <h2 id="delete-conversation-title" className="text-[15px] font-semibold text-foreground">
                Delete conversation?
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                This will permanently remove <span className="font-medium text-foreground">{deleteTarget.name}</span> and its messages from your Sibyl memory.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingSessionId}
                  className="rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSession}
                  disabled={!!deletingSessionId}
                  className="rounded-lg bg-red-500 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingSessionId ? "Deleting..." : "Delete conversation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mx-4 sm:mx-6 mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600 ring-1 ring-red-200">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto" aria-label="Dismiss error">
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="border-t border-border px-4 sm:px-6 py-4">
        {editingMessageIndex !== null && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-accent/5 px-3 py-2 text-[11px] text-accent ring-1 ring-accent/15">
            <span>Editing message. Sending will replace it and the replies after it.</span>
            <button
              type="button"
              onClick={() => {
                setEditingMessageIndex(null);
                setInput("");
              }}
              className="font-medium hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
          aria-label="Chat input"
        >
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pact anything..."
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:border-accent/30 focus:ring-2 focus:ring-accent/10"
           disabled={loading || !address || !sibylAvailable}
           autoComplete="off"
          />
          <button
            type="button"
            onClick={speech.isListening ? speech.stopListening : speech.startListening}
            disabled={!speech.supported || speech.offline || loading || !address || !sibylAvailable}
            aria-label={speech.isListening ? "Stop voice input" : "Start voice input"}
            title={
              !speech.supported
                ? "Voice input is not supported in this browser"
                : speech.offline
                  ? "Voice input needs an internet connection"
                  : speech.isListening
                    ? "Stop voice input"
                    : "Use voice input"
            }
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all disabled:opacity-30 ${
              speech.isListening
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-border bg-card text-muted-foreground hover:border-accent/30 hover:text-accent"
            }`}
          >
            {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="submit"
            disabled={loading || !input.trim() || !address || !sibylAvailable}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-accent"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {speech.error && (
          <p className="mt-2 text-[11px] text-red-500">{speech.error}</p>
        )}
      </div>
    </div>
  );
}
