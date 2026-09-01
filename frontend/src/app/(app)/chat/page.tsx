"use client";

import { useState, useRef, useEffect } from "react";
import { api, ChatMessage } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  data?: ChatMessage;
}

function DecisionCard({ data }: { data: ChatMessage }) {
  if (!data.payment) return null;

  const isApproved = data.decision === "APPROVE";
  const isPending = data.decision === "REQUIRE_APPROVAL";

  return (
    <div className="mt-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400">
          Payment Request
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isApproved
              ? "bg-green-500/10 text-green-400"
              : isPending
                ? "bg-amber-500/10 text-amber-400"
                : "bg-red-500/10 text-red-400"
          }`}
        >
          {data.decision}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-zinc-200">{data.payment.recipient}</div>
          <div className="text-xs text-zinc-500">{data.payment.token}</div>
        </div>
        <div className="text-lg font-semibold text-zinc-100">
          ${data.payment.amount}
        </div>
      </div>

      {data.payment.reason && (
        <div className="text-xs text-zinc-400 mb-3 p-2 bg-zinc-900/50 rounded">
          <span className="text-zinc-500">Why:</span> {data.payment.reason}
        </div>
      )}

      {data.payment.tx_hash && (
        <a
          href={`https://sepolia.basescan.org/tx/${data.payment.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          View on BaseScan →
        </a>
      )}

      {data.payment.memory_references &&
        data.payment.memory_references.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-zinc-500">🧠 Used</span>
            <span className="text-xs text-zinc-400">
              {data.payment.memory_references.length} memories
            </span>
          </div>
        )}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.chat(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response, data: response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-100">AI CFO</h1>
        <p className="text-xs text-zinc-500">
          Ask Pact anything about your finances
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4 opacity-20">⬡</div>
            <div className="text-zinc-400 mb-2">
              What can I help you with?
            </div>
            <div className="space-y-2">
              {[
                "Pay Acme $60",
                "Set my spending limit to $100",
                "I'm saving $2,000 for a MacBook",
                "What are my current rules?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-zinc-800 text-zinc-100"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-200"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.data && <DecisionCard data={msg.data} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="text-sm text-zinc-500 animate-pulse">
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pact anything..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
