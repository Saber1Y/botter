"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { api, VaultInfo, VaultStatus, Goal, Payment, Memory } from "@/lib/api";
import { VAULT_FACTORY_ABI } from "@/lib/abis";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Plus,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Target,
  Brain,
  Sparkles,
  Landmark,
  TrendingUp,
  Clock,
  Fingerprint,
} from "lucide-react";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const { address } = useAccount();
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    async function load() {
      // Track whether the live status fetch genuinely failed vs. returned empty.
      // Note: a 404 from getVault is the legitimate "no vault yet" state, so only
      // getVaultStatus (always 200) drives the live-error banner.
      let statusFailed = false;
      try {
        const [v, vs, g, p, mem] = await Promise.all([
          api.getVault(address!).catch(() => null),
          api.getVaultStatus(address!).catch(() => {
            statusFailed = true;
            return null;
          }),
          api.getGoals(address!).catch(() => []),
          api.getPayments(address!).catch(() => []),
          api.getMemory(undefined, address!).catch(() => []),
        ]);
        if (cancelled) return;
        setVault(v);
        setVaultStatus(vs);
        setGoals(g);
        setPayments(p);
        setMemories(mem);
        // If we couldn't reach the live status, show a recoverable banner
        // instead of silently presenting $0 / "no vault" as fact.
        if (statusFailed) {
          setLiveError(
            "Couldn't reach Pact services. Showing cached/empty values - retry to load live data."
          );
        } else {
          setLiveError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const reloadLive = () => {
    if (!address) return;
    let statusFailed = false;
    Promise.all([
      api.getVault(address).catch(() => null),
      api.getVaultStatus(address).catch(() => {
        statusFailed = true;
        return null;
      }),
      api.getGoals(address).catch(() => []),
      api.getPayments(address).catch(() => []),
      api.getMemory(undefined, address).catch(() => []),
    ]).then(([v, vs, g, p, mem]) => {
      setVault(v);
      setVaultStatus(vs);
      setGoals(g);
      setPayments(p);
      setMemories(mem);
      setLiveError(statusFailed ? "Couldn't reach Pact services." : null);
    });
  };

  const refreshVault = () => {
    if (!address) return;
    Promise.all([
      api.getVaultStatus(address).catch(() => null),
      api.getVault(address).catch(() => null),
    ]).then(([vs, v]) => {
      if (vs) setVaultStatus(vs);
      if (v) setVault(v);
      if (vs || v) setLiveError(null);
    });
  };

  if (loading) {
    return (
      <div       className="p-6 md:p-10 max-w-7xl" role="status" aria-label="Loading dashboard">
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
          <button
            onClick={() => window.location.reload()}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const goal = goals[0];
  const balance = vault?.balance ?? 0;
  const dailyRemaining = vault?.daily_remaining ?? 0;
  const dailyLimit = vault?.daily_limit ?? 1;
  const budgetPct = vault ? (dailyRemaining / dailyLimit) * 100 : 0;
  const maxPerTx = vault?.max_per_transaction ?? 0;
  const rules = memories.filter((m) => m.category === "rules");
  const recentDecisions = memories.filter((m) => m.category === "decisions");

  const approvedPayments = payments.filter((p) => p.decision === "APPROVE");
  const pendingPayments = payments.filter((p) => p.decision === "REQUIRE_APPROVAL");
  const deniedPayments = payments.filter((p) => p.decision === "DENY");
  const totalSpent = approvedPayments.reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );
  const decidedCount = approvedPayments.length + deniedPayments.length;
  const approvalRate =
    decidedCount > 0
      ? Math.round((approvedPayments.length / decidedCount) * 100)
      : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="p-4 sm:p-6 md:p-10 max-w-7xl"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent/70" />
          Dashboard
        </p>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.03em] text-foreground font-display">
          {getGreeting()}
          <span className="text-muted-foreground/40">.</span>
        </h1>
      </motion.div>

      {/* Live-data warning: a failed backend fetch must not masquerade as $0 */}
      {liveError && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-[13px] font-medium text-amber-900">
                  Couldn&apos;t load live data
                </p>
                <p className="text-[12px] text-amber-800/80">
                  Values below may be cached or empty. Retry to fetch your real
                  on-chain balance.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={reloadLive}
                className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-colors hover:bg-accent"
              >
                Retry
              </button>
              <button
                onClick={() => setLiveError(null)}
                aria-label="Dismiss"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Vault status banner */}
      {vaultStatus && !vaultStatus.has_vault && (
        <motion.div variants={fadeUp} className="mb-6">
          <VaultDeployBanner address={address!} onDeployed={refreshVault} />
        </motion.div>
      )}
      {vaultStatus && vaultStatus.has_vault && vaultStatus.balance === 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <VaultFundBanner vaultAddress={vaultStatus.vault_address!} onFunded={refreshVault} />
        </motion.div>
      )}

      {/* Bento hero: balance (2 cols) + budget + goal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {/* Balance - spans 2 cols */}
        <motion.div
          variants={fadeUp}
          className="group relative sm:col-span-2 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          {/* Layered ambient background */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(255,255,255,0) 55%)",
              }}
            />
            <div
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent)",
              }}
            />
            <div
              className="absolute -bottom-28 -left-16 h-56 w-56 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(245,239,235,0.7), transparent)",
              }}
            />
          </div>
          {/* Top accent hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
          />
          <p className="relative text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
            Vault balance
          </p>
          <div className="relative flex items-baseline gap-2 mb-1">
            <span className="text-5xl sm:text-6xl font-medium tracking-[-0.03em] text-foreground font-display tabular-nums">
              {balance.toFixed(2)}
            </span>
            <span className="text-[13px] font-medium text-muted-foreground">
              USDC
            </span>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
              Base Sepolia
            </span>
            {maxPerTx > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 font-mono text-[10px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-accent" />
                Max {maxPerTx} USDC / tx
              </span>
            )}
          </div>
        </motion.div>

        {/* Daily budget */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 flex flex-col"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(99,102,241,0.07), transparent)",
            }}
          />
          <p className="relative text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Autonomous budget
          </p>
          <div className="relative flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-medium tracking-[-0.02em] text-foreground font-display tabular-nums">
              {dailyRemaining.toFixed(0)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              / {dailyLimit.toFixed(0)} left
            </span>
          </div>
          <div className="relative mt-auto h-1.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPct, 100)}%` }}
              transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3,
              }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-accent"
            />
          </div>
          <p className="relative mt-2.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            Resets daily
          </p>
        </motion.div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            Total spent
          </div>
          <p className="text-2xl font-medium tracking-[-0.02em] text-foreground font-display tabular-nums">
            ${totalSpent.toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {approvedPayments.length} approved
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            <Clock className="h-3.5 w-3.5 text-accent" />
            Pending approvals
          </div>
          <p className="text-2xl font-medium tracking-[-0.02em] text-foreground font-display tabular-nums">
            {pendingPayments.length}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {pendingPayments[0]
              ? `${String(pendingPayments[0].recipient).slice(0, 8)}…`
              : "Nothing queued"}
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            Approval rate
          </div>
          <p className="text-2xl font-medium tracking-[-0.02em] text-foreground font-display tabular-nums">
            {approvalRate === null ? "—" : `${approvalRate}%`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {deniedPayments.length} denied
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            <Fingerprint className="h-3.5 w-3.5 text-accent" />
            Vault
          </div>
          <p className="text-2xl font-medium tracking-[-0.02em] text-foreground font-display tabular-nums">
            {vaultStatus?.has_vault ? "Active" : "Not deployed"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {vault
              ? `Daily cap $${vault.daily_limit}`
              : "Deploy to begin"}
          </p>
        </motion.div>
      </div>

      {/* Goal + Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
        {/* Goal - 2 cols */}
        {goal ? (
          <motion.div
            variants={fadeUp}
            className="sm:col-span-2 relative overflow-hidden rounded-2xl border border-border bg-card p-5"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(245,239,235,0.7), transparent)",
              }}
            />
            <p className="relative text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Active goal
            </p>
            <h3 className="relative text-[15px] font-medium text-foreground mb-2 font-display">
              {goal.name}
            </h3>
            <div className="relative flex items-baseline gap-1.5 mb-3">
              <span className="text-2xl font-medium tracking-[-0.02em] text-foreground font-display tabular-nums">
                {goal.current.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">
                / ${goal.target.toLocaleString()}
              </span>
            </div>
            <div className="relative mt-auto h-1.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(goal.progress, 100)}%` }}
                transition={{
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.4,
                }}
                className="h-full rounded-full bg-gradient-to-r from-stone-400 to-stone-600"
              />
            </div>
            <Link href="/app/goals">
              <p className="relative mt-3 text-[11px] font-medium text-accent hover:text-accent/70 transition-colors">
                {goal.progress.toFixed(0)}% complete →
              </p>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="sm:col-span-2 rounded-2xl border border-dashed border-border bg-card p-5 flex flex-col items-start justify-center"
          >
            <p className="text-[13px] text-muted-foreground mb-2">
              No active goal
            </p>
            <Link
              href="/app/goals"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent/70 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Record a goal in memory
            </Link>
          </motion.div>
        )}

        {/* Activity - 3 cols */}
        <motion.div variants={fadeUp} className="sm:col-span-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Recent activity
          </p>
          <div className="group overflow-hidden rounded-2xl border border-border bg-card">
            {payments.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[13px] text-muted-foreground mb-1">
                  No payments yet
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Ask Pact to pay someone or set a rule
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {payments.slice(0, 4).map((p) => (
                  <PaymentRow key={p.id} payment={p} />
                ))}
              </div>
            )}
          </div>
          <Link
            href="/app/payments"
            className="inline-block mt-3 text-[11px] font-medium text-accent hover:text-accent/70 transition-colors"
          >
            View all payments →
          </Link>
        </motion.div>
      </div>

      {/* Spending rules + Pending approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h2 className="text-[13px] font-semibold text-foreground">
              Spending rules
            </h2>
            <Link
              href="/app/memory"
              className="ml-auto text-[11px] font-medium text-accent hover:text-accent/80"
            >
              Manage
            </Link>
          </div>
          {rules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-5">
              <p className="text-[13px] text-muted-foreground">
                No spending rules yet
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Tell Pact your limits in chat to guard your vault
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {rules.map((rule) => (
                <div
                  key={rule.key}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex h-2 w-2 shrink-0 rounded-full ${
                        rule.value.type === "blocked_merchant"
                          ? "bg-red-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[13px] font-medium text-foreground truncate">
                      {rule.value.type === "spending_limit"
                        ? "Spending limit"
                        : rule.value.type === "trusted_merchant"
                          ? "Trusted merchant"
                          : "Blocked merchant"}
                    </span>
                  </div>
                  <span className="shrink-0 ml-3 font-mono text-[12px] text-muted-foreground">
                    {rule.value.type === "spending_limit"
                      ? `$${rule.value.value} / tx`
                      : String(rule.value.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="text-[13px] font-semibold text-foreground">
              Pending approvals
            </h2>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                pendingPayments.length > 0
                  ? "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {pendingPayments.length}
            </span>
          </div>
          {pendingPayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-5">
              <p className="text-[13px] text-muted-foreground">
                No approvals queued
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Payments Pact can&apos;t auto-approve will wait here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {pendingPayments.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate font-mono">
                        {p.recipient}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {p.reason || "Awaiting approval"}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 ml-3 text-[13px] font-medium text-foreground font-display tabular-nums">
                    ${p.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/app/payments"
            className="inline-block mt-3 text-[11px] font-medium text-accent hover:text-accent/70 transition-colors"
          >
            Review queue →
          </Link>
        </motion.div>
      </div>

      {/* Pact remembers */}
      {memories.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-accent" />
            <h2 className="text-[13px] font-semibold text-foreground">
              Pact remembers
            </h2>
            <Link
              href="/app/memory"
              className="ml-auto text-[11px] font-medium text-accent hover:text-accent/80"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {goal && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
                  <Target className="h-3.5 w-3.5 text-accent" />
                  Goal
                </div>
                <p className="text-[13px] font-medium text-foreground">
                  {goal.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  ${goal.current?.toFixed(0) ?? 0} / ${goal.target?.toFixed(0) ?? 0}
                </p>
              </div>
            )}
            {rules.slice(0, 2).map((rule) => (
              <div
                key={rule.key}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Rule
                </div>
                <p className="text-[13px] font-medium text-foreground">
                  {rule.value.type === "spending_limit"
                    ? "Spending limit"
                    : rule.value.type === "trusted_merchant"
                      ? "Trusted merchant"
                      : "Blocked merchant"}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {rule.value.type === "spending_limit"
                    ? `$${rule.value.value} per tx`
                    : String(rule.value.value)}
                </p>
              </div>
            ))}
            {recentDecisions[0] && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Last call
                </div>
                <p className="text-[13px] font-medium text-foreground">
                  {recentDecisions[0].value.decision === "APPROVE" ||
                  recentDecisions[0].value.decision === "PAYMENT"
                    ? "Approved"
                    : "Blocked"}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {String(recentDecisions[0].value.recipient)} · $
                  {String(recentDecisions[0].value.amount)}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="h-4 w-4 text-accent" />
          <h2 className="text-[13px] font-semibold text-foreground">
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/app/chat?q=Can I spend $200 this weekend?"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:border-accent/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                Budget check
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Can I spend $200 this weekend?
              </p>
            </div>
          </Link>
          <Link
            href="/app/chat?q=Pay Acme $60"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:border-accent/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                Send a payment
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Pay Acme $60
              </p>
            </div>
          </Link>
          <Link
            href="/app/chat?q=What are my current rules?"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:border-accent/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                Review my rules
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                What are my current rules?
              </p>
            </div>
          </Link>
          <Link
            href="/app/chat?q=I%27m saving $2,000 for a MacBook"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:border-accent/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                Start a goal
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                I&apos;m saving $2,000 for a MacBook
              </p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";
  const Icon = isApproved ? CheckCircle2 : isPending ? AlertTriangle : XCircle;

  return (
    <div className="group flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
            isApproved
              ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
              : isPending
                ? "bg-amber-50 text-amber-600 ring-amber-200"
                : "bg-red-50 text-red-600 ring-red-200"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate font-mono">
            {payment.recipient}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            {isApproved
              ? "Auto-approved"
              : isPending
                ? "Approval required"
                : "Denied"}
          </p>
        </div>
      </div>
      <p className="text-[13px] font-medium text-foreground shrink-0 ml-3 font-display tabular-nums">
        ${payment.amount}
      </p>
    </div>
  );
}

function VaultDeployBanner({
  address,
  onDeployed,
}: {
  address: string;
  onDeployed: () => void;
}) {
  const factoryAddress = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}` | undefined;
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) onDeployed();
  }, [isConfirmed, onDeployed]);

  const handleDeploy = () => {
    if (!factoryAddress) return;
    writeContract({
      address: factoryAddress,
      abi: VAULT_FACTORY_ABI,
      functionName: "createVault",
    });
  };

  const deploying = isPending || isConfirming;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/[0.03] p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent)",
        }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-foreground mb-0.5">
            Deploy your vault to start
          </p>
          <p className="text-[12px] text-muted-foreground">
            Create a PactVault on Base Sepolia to hold USDC and execute payments.
          </p>
        </div>
        <button
          onClick={handleDeploy}
          disabled={deploying || !factoryAddress}
          className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-all hover:bg-accent hover:opacity-100 disabled:opacity-50"
        >
          {isPending ? "Confirm..." : isConfirming ? "Deploying..." : "Deploy vault"}
        </button>
      </div>
      {error && (
        <p className="relative mt-2 text-[11px] text-red-500">
          {error.message?.includes("User rejected") ? "Transaction rejected" : "Deployment failed"}
        </p>
      )}
    </div>
  );
}

function VaultFundBanner({
  vaultAddress,
  onFunded,
}: {
  vaultAddress: string;
  onFunded: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(245,239,235,0.8), transparent)",
        }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground mb-0.5">
            Fund your vault
          </p>
          <p className="text-[12px] text-muted-foreground truncate">
            Send USDC to{" "}
            <code className="font-mono text-[11px]">{vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}</code>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://sepolia.basescan.org/address/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View vault on BaseScan"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onFunded}
            className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-all hover:bg-accent"
          >
            I&apos;ve deposited
          </button>
        </div>
      </div>
    </div>
  );
}
