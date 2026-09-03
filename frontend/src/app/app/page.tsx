"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { api, VaultInfo, VaultStatus, Goal, Payment } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    async function load() {
      try {
        const [v, vs, g, p] = await Promise.all([
          api.getVault(address!).catch(() => null),
          api.getVaultStatus(address!).catch(() => null),
          api.getGoals(address!).catch(() => []),
          api.getPayments(address!).catch(() => []),
        ]);
        setVault(v);
        setVaultStatus(vs);
        setGoals(g);
        setPayments(p);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const refreshVault = () => {
    if (!address) return;
    api.getVaultStatus(address).then(setVaultStatus).catch(() => {});
    api.getVault(address).then(setVault).catch(() => {});
  };

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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="p-4 sm:p-6 md:p-8 max-w-5xl"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          {getGreeting()}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Your financial command center
        </p>
      </motion.div>

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

      {/* Hero balance */}
      <motion.div
        variants={fadeUp}
        className="mb-8 rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          Vault balance
        </p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-[13px] text-muted-foreground">$</span>
          <span className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            {balance.toFixed(2)}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground">
          USDC on Base Sepolia
        </p>
      </motion.div>

      {/* Two-column: Budget + Goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {/* Daily budget */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Autonomous budget
          </p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-[13px] text-muted-foreground">$</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {dailyRemaining.toFixed(2)}
            </span>
            <span className="text-[12px] text-muted-foreground">
              / ${dailyLimit.toFixed(0)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPct, 100)}%` }}
              transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3,
              }}
              className="h-full rounded-full bg-accent"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Resets daily
          </p>
        </motion.div>

        {/* Goal */}
        {goal ? (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              {goal.name}
            </p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-[13px] text-muted-foreground">$</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {goal.current.toLocaleString()}
              </span>
              <span className="text-[12px] text-muted-foreground">
                / ${goal.target.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(goal.progress, 100)}%`,
                }}
                transition={{
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.4,
                }}
                className="h-full rounded-full bg-accent"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {goal.progress.toFixed(0)}% complete
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-dashed border-border bg-card p-5 flex flex-col items-center justify-center text-center"
          >
            <p className="text-[13px] text-muted-foreground mb-3">
              No goals set yet
            </p>
            <Link
              href="/app/goals"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Create a goal
            </Link>
          </motion.div>
        )}
      </div>

      {/* Activity */}
      <motion.div variants={fadeUp} className="mb-8">
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Recent activity
        </h2>
        <div className="rounded-2xl border border-border bg-card">
          {payments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-muted-foreground mb-1">
                No payments yet
              </p>
              <p className="text-[12px] text-muted-foreground/60">
                Start by asking Pact to pay someone
              </p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="divide-y divide-border"
            >
              {payments.slice(0, 5).map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div variants={fadeUp}>
        <Link
          href="/app/chat"
          className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:shadow-accent/5 hover:border-accent/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground mb-0.5">
                Talk to your AI CFO
              </p>
              <p className="text-[12px] text-muted-foreground">
                &quot;Can I spend $200 this weekend?&quot;
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background group-hover:bg-accent transition-colors">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      </motion.div>
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
      className="flex items-center justify-between px-5 py-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={`h-4 w-4 shrink-0 ${
            isApproved
              ? "text-emerald-500"
              : isPending
                ? "text-amber-500"
                : "text-red-500"
          }`}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">
            {payment.recipient}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isApproved
              ? "Auto-approved"
              : isPending
                ? "Approval required"
                : "Denied"}
          </p>
        </div>
      </div>
      <p className="text-[13px] font-medium text-muted-foreground shrink-0 ml-3">
        ${payment.amount}
      </p>
    </motion.div>
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
    <div className="rounded-2xl border border-accent/20 bg-accent/[0.03] p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Confirm..." : isConfirming ? "Deploying..." : "Deploy vault"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-red-500">
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
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onFunded}
            className="rounded-xl bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-all hover:opacity-90"
          >
            I've deposited
          </button>
        </div>
      </div>
    </div>
  );
}
