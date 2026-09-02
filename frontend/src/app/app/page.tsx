"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, VaultInfo, Goal, Payment } from "@/lib/api";

function StatCard({
  label,
  value,
  sub,
  accent,
  progress,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/25">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${accent ? "text-emerald-400" : "text-white/90"}`}>
        {value}
      </p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {sub && <p className="mt-1.5 text-[11px] text-white/20">{sub}</p>}
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";

  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-medium ${
            isApproved
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : isPending
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
          }`}
        >
          {isApproved ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : isPending ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-[13px] font-medium text-white/70">{payment.recipient}</p>
          <p className="text-[11px] text-white/25">
            {isApproved ? "Auto-approved" : isPending ? "Approval required" : "Denied"}
          </p>
        </div>
      </div>
      <p className="text-[13px] font-medium text-white/50">${payment.amount}</p>
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
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-white/30">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-emerald-500" />
          <span className="text-[13px]">Loading...</span>
        </div>
      </div>
    );
  }

  const goal = goals[0];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-white/90 mb-1">
          Good afternoon
        </h1>
        <p className="text-[13px] text-white/30">Your financial command center</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2 lg:grid-cols-3">
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
          progress={vault ? (vault.daily_remaining / vault.daily_limit) * 100 : 0}
        />
        {goal && (
          <StatCard
            label={goal.name}
            value={`${goal.progress.toFixed(0)}%`}
            sub={`$${goal.current} / $${goal.target}`}
            progress={goal.progress}
          />
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-white/25">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          {payments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-white/20">No payments yet.</p>
              <p className="mt-1 text-[12px] text-white/10">Start by asking Pact to pay someone.</p>
            </div>
          ) : (
            payments.slice(0, 5).map((p) => <PaymentRow key={p.id} payment={p} />)
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-white/25">
          Quick action
        </h2>
        <Link
          href="/app/chat"
          className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
        >
          <p className="text-[13px] text-white/40">
            &quot;Can I spend $200 this weekend?&quot;
          </p>
          <p className="mt-1 text-[11px] text-white/15">Open AI CFO →</p>
        </Link>
      </div>
    </div>
  );
}
