"use client";

import { useEffect, useState } from "react";
import { api, Payment } from "@/lib/api";

function PaymentRow({ payment }: { payment: Payment }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";

  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800/50 last:border-0">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
            isApproved
              ? "bg-green-500/10 text-green-400"
              : isPending
                ? "bg-amber-500/10 text-amber-400"
                : "bg-red-500/10 text-red-400"
          }`}
        >
          {isApproved ? "✓" : isPending ? "⚠" : "✗"}
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-200">
            {payment.recipient}
          </div>
          <div className="text-xs text-zinc-500">
            {isApproved
              ? "Auto-approved"
              : isPending
                ? "Approved by you"
                : "Denied"}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-zinc-200">
          -${payment.amount}
        </div>
        <div className="text-xs text-zinc-500">{payment.token}</div>
      </div>
    </div>
  );
}

function PaymentDetail({ payment }: { payment: Payment }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-medium text-zinc-100">
          {payment.recipient}
        </div>
        <div className="text-2xl font-semibold text-zinc-100">
          ${payment.amount} {payment.token}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Decision</div>
          <div className="text-sm text-zinc-200">{payment.decision}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">Status</div>
          <div className="text-sm text-zinc-200">{payment.status}</div>
        </div>
      </div>

      {payment.reason && (
        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-1">Reason</div>
          <div className="text-sm text-zinc-400">{payment.reason}</div>
        </div>
      )}

      {payment.tx_hash && (
        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-1">Transaction</div>
          <a
            href={`https://sepolia.basescan.org/tx/${payment.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 font-mono"
          >
            {payment.tx_hash.slice(0, 10)}...{payment.tx_hash.slice(-8)}
          </a>
        </div>
      )}

      {payment.tx_hash && (
        <a
          href={`https://sepolia.basescan.org/tx/${payment.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-blue-400 hover:text-blue-300"
        >
          View on BaseScan →
        </a>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "denied">("all");
  const [selected, setSelected] = useState<Payment | null>(null);

  useEffect(() => {
    api
      .getPayments()
      .then(setPayments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    if (filter === "all") return true;
    if (filter === "approved") return p.decision === "APPROVE";
    if (filter === "pending") return p.decision === "REQUIRE_APPROVAL";
    if (filter === "denied") return p.decision === "DENY";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Payments</h1>
        <p className="text-zinc-500">
          All payments executed by Pact on Base Sepolia.
        </p>
      </div>

      {selected && <PaymentDetail payment={selected} />}

      <div className="flex gap-2 mb-6">
        {(["all", "approved", "pending", "denied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-20">≡</div>
            <div className="text-zinc-400 mb-2">No payments yet</div>
            <div className="text-sm text-zinc-600">
              Payments will appear here after Pact executes them.
            </div>
          </div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className="w-full text-left"
            >
              <PaymentRow payment={p} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
