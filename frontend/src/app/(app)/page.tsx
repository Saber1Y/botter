"use client";

import { useEffect, useState } from "react";
import { api, VaultInfo, Goal, Payment } from "@/lib/api";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold ${accent ? "text-green-400" : "text-zinc-100"}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
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
          <div className="text-sm text-zinc-200">{payment.recipient}</div>
          <div className="text-xs text-zinc-500">
            {isApproved ? "Auto-approved" : isPending ? "Approval required" : "Denied"}
          </div>
        </div>
      </div>
      <div className="text-sm font-medium text-zinc-300">
        -${payment.amount}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [v, g, p] = await Promise.all([
          api.getVault().catch(() => null),
          api.getGoals().catch(() => []),
          api.getPayments().catch(() => []),
        ]);
        setVault(v);
        setGoals(g);
        setPayments(p);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">
          Good afternoon
        </h1>
        <p className="text-zinc-500">Your financial command center</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Vault Balance"
          value={`$${vault?.balance?.toFixed(2) || "0.00"}`}
          sub="USDC on Base Sepolia"
          accent
        />
        <StatCard
          label="Autonomous Budget"
          value={`$${vault?.daily_remaining?.toFixed(2) || "0.00"}`}
          sub={`of $${vault?.daily_limit?.toFixed(0) || "0"} daily limit`}
        />
        {goals.length > 0 && (
          <StatCard
            label={goals[0].name}
            value={`${goals[0].progress.toFixed(0)}%`}
            sub={`$${goals[0].current} / $${goals[0].target}`}
          />
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">
          Recent Activity
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          {payments.length === 0 ? (
            <div className="text-sm text-zinc-500 py-4 text-center">
              No payments yet. Start by asking Pact to pay someone.
            </div>
          ) : (
            payments.slice(0, 5).map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">
          Ask Pact anything
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <a
            href="/chat"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            "Can I spend $200 this weekend?" →
          </a>
        </div>
      </div>
    </div>
  );
}
