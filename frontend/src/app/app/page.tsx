"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, VaultInfo, Goal, Payment } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Zap,
} from "lucide-react";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  progress,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  progress?: number;
}) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:shadow-black/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent ? "bg-accent/10" : "bg-muted"}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? "text-accent" : "text-muted-foreground"}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-400"
          />
        </div>
      )}
      {sub && <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";
  const Icon = isApproved ? CheckCircle2 : isPending ? AlertTriangle : XCircle;

  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center justify-between border-b border-border py-3.5 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isApproved
              ? "bg-emerald-50 text-emerald-600"
              : isPending
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">{payment.recipient}</p>
          <p className="text-[11px] text-muted-foreground">
            {isApproved ? "Auto-approved" : isPending ? "Approval required" : "Denied"}
          </p>
        </div>
      </div>
      <p className="text-[13px] font-medium text-muted-foreground shrink-0 ml-3">${payment.amount}</p>
    </motion.div>
  );
}

export default function OverviewPage() {
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl" role="status" aria-label="Loading dashboard">
        <div className="mb-8">
          <div className="h-7 w-40 rounded-lg bg-muted animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="h-5 w-32 rounded bg-muted animate-pulse mb-3" />
        <div className="rounded-2xl border border-border bg-card p-4">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
        <span className="sr-only">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-[13px] text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const goal = goals[0];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="p-4 sm:p-6 md:p-8 max-w-5xl"
    >
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          Good afternoon
        </h1>
        <p className="text-[13px] text-muted-foreground">Your financial command center</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Vault Balance"
          value={`$${vault?.balance?.toFixed(2) || "0.00"}`}
          sub="USDC on Base Sepolia"
          icon={Wallet}
          accent
        />
        <StatCard
          label="Autonomous Budget"
          value={`$${vault?.daily_remaining?.toFixed(2) || "0.00"}`}
          sub={`of $${vault?.daily_limit?.toFixed(0) || "0"} daily limit`}
          icon={TrendingUp}
          progress={vault ? (vault.daily_remaining / vault.daily_limit) * 100 : 0}
        />
        {goal && (
          <StatCard
            label={goal.name}
            value={`${goal.progress.toFixed(0)}%`}
            sub={`$${goal.current} / $${goal.target}`}
            icon={Target}
            progress={goal.progress}
          />
        )}
      </div>

      <motion.div variants={fadeUp} className="mb-8">
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Recent Activity
        </h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          {payments.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground">No payments yet.</p>
              <p className="mt-1 text-[12px] text-muted-foreground/60">Start by asking Pact to pay someone.</p>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible">
              {payments.slice(0, 5).map((p) => <PaymentRow key={p.id} payment={p} />)}
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Quick action
        </h2>
        <Link
          href="/app/chat"
          className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:shadow-accent/5 hover:border-accent/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
                &quot;Can I spend $200 this weekend?&quot;
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/60 group-hover:text-accent/70 transition-colors">
                <Zap className="h-3 w-3" />
                Open AI CFO
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
