"use client";

import { useEffect, useState } from "react";
import { api, Goal } from "@/lib/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "" });

  useEffect(() => {
    api
      .getGoals()
      .then(setGoals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newGoal.name || !newGoal.target) return;

    try {
      const goal = await api.createGoal(newGoal.name, parseFloat(newGoal.target));
      setGoals((prev) => [...prev, goal]);
      setNewGoal({ name: "", target: "" });
      setShowCreate(false);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Goals</h1>
          <p className="text-zinc-500">
            Track your financial goals. Pact considers these when making
            decisions.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + New goal
        </button>
      </div>

      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-zinc-200 mb-3">
            Create a new goal
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newGoal.name}
              onChange={(e) =>
                setNewGoal((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Goal name (e.g., MacBook)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <input
              type="number"
              value={newGoal.target}
              onChange={(e) =>
                setNewGoal((prev) => ({ ...prev, target: e.target.value }))
              }
              placeholder="Target amount"
              className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={handleCreate}
              disabled={!newGoal.name || !newGoal.target}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          return (
            <div
              key={goal.name}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-medium text-zinc-100">
                  {goal.name}
                </div>
                <div className="text-sm text-zinc-400">
                  ${goal.current.toLocaleString()} / $
                  {goal.target.toLocaleString()}
                </div>
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{progress.toFixed(0)}% complete</span>
                <span>
                  ${(goal.target - goal.current).toLocaleString()} remaining
                </span>
              </div>

              <div className="mt-3 text-xs text-zinc-600">
                Pact is prioritizing this goal.
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !showCreate && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-20">◇</div>
            <div className="text-zinc-400 mb-2">No goals yet</div>
            <div className="text-sm text-zinc-600 mb-4">
              Create a goal to help Pact understand your financial priorities.
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              + Create your first goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
