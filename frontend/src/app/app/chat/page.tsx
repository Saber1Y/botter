"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api, ChatMessage, ChatHistoryEntry } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  data?: ChatMessage;
}

function DecisionCard({ data }: { data: ChatMessage }) {
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
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Brain className="h-3 w-3" />
              {data.payment.memory_references.length} memories used
            </span>
          )}
        </div>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    api.getChatHistory()
      .then((history) => {
        const loaded: Message[] = history.map((h) => ({
          role: h.role,
          content: h.content,
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
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (input) setTimeout(() => inputRef.current?.focus(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.chat(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response, data: response },
      ]);
      if (response.memory_stored?.length > 0) {
        toast(`Stored ${response.memory_stored.length} item(s) to memory`, "success");
      }
    } catch (err) {
      setError("Failed to get response. Please try again.");
      toast("Failed to get response", "error");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, toast]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    toast("Chat cleared (memory preserved)", "info");
  }, [toast]);

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

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {historyLoading ? (
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
                className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "rounded-br-md bg-accent text-[13px] text-white"
                        : "rounded-bl-md bg-card border border-border text-[13px] text-foreground shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.data && <DecisionCard data={msg.data} />}
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
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-accent"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
