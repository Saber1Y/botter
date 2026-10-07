"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { api, Memory, Goal } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Database,
  Sparkles,
} from "lucide-react";
import { PageSkeleton } from "@/components/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = { visible: { transition: { staggerChildren: 0.05 } } };

function MemorySection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent/60" />
        <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MemoryCard({
  category,
  label,
  value,
  source,
}: {
  category: string;
  label: string;
  value: string;
  source?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:shadow-black/[0.03]"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[13px] font-medium text-foreground min-w-0 truncate">{label}</div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground shrink-0 ml-2">{category}</span>
      </div>
      <div className="text-[12px] text-muted-foreground truncate">{value}</div>
      {source && (
        <div className="mt-2 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-accent/50" />
          <span className="text-[10px] text-muted-foreground">Remembered by Botter</span>
        </div>
      )}
    </motion.div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const progress = (goal.current / goal.target) * 100;

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:shadow-black/[0.03]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <Target className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="text-[13px] font-medium text-foreground truncate">{goal.name}</div>
        </div>
        <div className="text-[12px] text-muted-foreground shrink-0 ml-2">
          ${goal.current} / ${goal.target}
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-400"
        />
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">{progress.toFixed(0)}% complete</div>
    </motion.div>
  );
}

export default function MemoryPage() {
  const { address } = useAccount();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    async function load() {
      try {
        const [m, g] = await Promise.all([
          api.getMemory(undefined, address!).catch(() => []),
          api.getGoals(address!).catch(() => []),
        ]);
        setMemories(m);
        setGoals(g);
      } catch (err) {
        setError("Failed to load memories.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  if (loading) return <PageSkeleton />;

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

  const rules = memories.filter((m) => m.category === "rules");
  const decisionMemories = memories.filter((m) => m.category === "decisions");
  const paymentMemories = memories.filter((m) => m.category === "payments");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="p-4 sm:p-8 max-w-4xl"
    >
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
            <Database className="h-4 w-4 text-accent" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Memory</h1>
        </div>
        <p className="text-[13px] text-muted-foreground sm:ml-11">
          Everything Botter remembers about how you manage money.
        </p>
      </motion.div>

      {goals.length > 0 && (
        <MemorySection title="Financial Goals" icon={Target}>
          {goals.map((goal) => (
            <GoalCard key={goal.name} goal={goal} />
          ))}
        </MemorySection>
      )}

      {rules.length > 0 && (
        <MemorySection title="Spending Rules" icon={ShieldCheck}>
          {rules.map((rule) => (
            <MemoryCard
              key={rule.key}
              category="Rule"
              label={
                rule.value.type === "spending_limit"
                  ? "Automatic spending limit"
                  : rule.value.type === "trusted_merchant"
                    ? "Trusted merchant"
                    : "Blocked merchant"
              }
              value={
                rule.value.type === "spending_limit"
                  ? `$${rule.value.value} per transaction`
                  : String(rule.value.value)
              }
              source="You"
            />
          ))}
        </MemorySection>
      )}

      {decisionMemories.length > 0 && (
        <MemorySection title="Previous Decisions" icon={Clock}>
          {decisionMemories.map((dec) => (
            <MemoryCard
              key={dec.key}
              category="Decision"
              label={`${dec.value.recipient} - $${dec.value.amount}`}
              value={`${dec.value.decision}: ${dec.value.reason}`}
            />
          ))}
        </MemorySection>
      )}

      {paymentMemories.length > 0 && (
        <MemorySection title="Payment History" icon={Sparkles}>
          {paymentMemories.map((pay) => (
            <MemoryCard
              key={pay.key}
              category="Payment"
              label={`${pay.value.recipient} - $${pay.value.amount}`}
              value={`Status: ${pay.value.status}${
                pay.value.tx_hash ? ` | Tx: ${String(pay.value.tx_hash).slice(0, 10)}...` : ""
              }`}
            />
          ))}
        </MemorySection>
      )}

      {memories.length === 0 && goals.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
            <Brain className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div className="text-[15px] font-medium text-foreground/40 mb-1">No memories yet</div>
          <div className="text-[13px] text-muted-foreground">
            Start by telling Botter about your financial rules and goals.
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
