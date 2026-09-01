"use client";

import { useEffect, useState } from "react";
import { api, Memory, Goal } from "@/lib/api";

function MemorySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-zinc-200">{label}</div>
        <span className="text-xs text-zinc-600">{category}</span>
      </div>
      <div className="text-sm text-zinc-400">{value}</div>
      {source && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-green-500/70">✓</span>
          <span className="text-xs text-zinc-600">Remembered by Pact</span>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const progress = (goal.current / goal.target) * 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-zinc-200">{goal.name}</div>
        <div className="text-xs text-zinc-500">
          ${goal.current} / ${goal.target}
        </div>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="text-xs text-zinc-500">{progress.toFixed(0)}% complete</div>
    </div>
  );
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, g] = await Promise.all([
          api.getMemory().catch(() => []),
          api.getGoals().catch(() => []),
        ]);
        setMemories(m);
        setGoals(g);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Loading memories...</div>
      </div>
    );
  }

  const rules = memories.filter((m) => m.category === "rules");
  const decisionMemories = memories.filter((m) => m.category === "decisions");
  const paymentMemories = memories.filter((m) => m.category === "payments");

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Memory</h1>
        <p className="text-zinc-500">
          Everything Pact remembers about how you manage money.
        </p>
      </div>

      {goals.length > 0 && (
        <MemorySection title="Financial Goals">
          {goals.map((goal) => (
            <GoalCard key={goal.name} goal={goal} />
          ))}
        </MemorySection>
      )}

      {rules.length > 0 && (
        <MemorySection title="Spending Rules">
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
                  : rule.value.value
              }
              source="You"
            />
          ))}
        </MemorySection>
      )}

      {decisionMemories.length > 0 && (
        <MemorySection title="Previous Decisions">
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
        <MemorySection title="Payment History">
          {paymentMemories.map((pay) => (
            <MemoryCard
              key={pay.key}
              category="Payment"
              label={`${pay.value.recipient} - $${pay.value.amount}`}
              value={`Status: ${pay.value.status}${
                pay.value.tx_hash ? ` | Tx: ${pay.value.tx_hash.slice(0, 10)}...` : ""
              }`}
            />
          ))}
        </MemorySection>
      )}

      {memories.length === 0 && goals.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4 opacity-20">◎</div>
          <div className="text-zinc-400 mb-2">No memories yet</div>
          <div className="text-sm text-zinc-600">
            Start by telling Pact about your financial rules and goals.
          </div>
        </div>
      )}
    </div>
  );
}
