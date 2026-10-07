"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { api, Goal } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Rocket,
  Trash2,
} from "lucide-react";
import { PageSkeleton } from "@/components/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = { visible: { transition: { staggerChildren: 0.05 } } };

export default function GoalsPage() {
  const { address } = useAccount();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "" });
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; target?: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!address) return;
    api
      .getGoals(address)
      .then(setGoals)
      .catch(() => setError("Failed to load goals."))
      .finally(() => setLoading(false));
  }, [address]);

  const validate = () => {
    const errors: { name?: string; target?: string } = {};
    if (!newGoal.name.trim()) errors.name = "Goal name is required";
    if (!newGoal.target) errors.target = "Target amount is required";
    else if (isNaN(parseFloat(newGoal.target)) || parseFloat(newGoal.target) <= 0) errors.target = "Must be a positive number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    setError(null);

    try {
      const goal = await api.createGoal(newGoal.name.trim(), parseFloat(newGoal.target), address);
      setGoals((prev) => [...prev, goal]);
      setNewGoal({ name: "", target: "" });
      setFormErrors({});
      setShowCreate(false);
      toast(`Goal "${goal.name}" created`, "success");
    } catch (err) {
      setError("Failed to create goal. Please try again.");
      toast("Failed to create goal", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await api.deleteGoal(name, address);
      setGoals((prev) => prev.filter((g) => g.name !== name));
      toast(`Goal "${name}" deleted`, "success");
    } catch (err) {
      toast("Failed to delete goal", "error");
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="p-4 sm:p-8 max-w-4xl"
    >
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Goals</h1>
          </div>
          <p className="text-[13px] text-muted-foreground sm:ml-11">
            Track your financial goals. Botter considers these when making decisions.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setFormErrors({}); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-accent/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New goal
        </button>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-medium text-foreground">Create a new goal</h3>
                <button onClick={() => { setShowCreate(false); setFormErrors({}); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="goal-name" className="sr-only">Goal name</label>
                  <input
                    id="goal-name"
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => { setNewGoal((prev) => ({ ...prev, name: e.target.value })); setFormErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder="Goal name (e.g., MacBook)"
                    className={`w-full rounded-xl border bg-card px-4 py-2.5 text-[13px] text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/10 ${
                      formErrors.name ? "border-red-300 focus:border-red-400" : "border-border focus:border-accent/30"
                    }`}
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? "goal-name-error" : undefined}
                  />
                  {formErrors.name && <p id="goal-name-error" className="mt-1 text-[11px] text-red-500">{formErrors.name}</p>}
                </div>
                <div className="sm:w-36">
                  <label htmlFor="goal-target" className="sr-only">Target amount</label>
                  <input
                    id="goal-target"
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => { setNewGoal((prev) => ({ ...prev, target: e.target.value })); setFormErrors((p) => ({ ...p, target: undefined })); }}
                    placeholder="Target amount"
                    className={`w-full rounded-xl border bg-card px-4 py-2.5 text-[13px] text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/10 ${
                      formErrors.target ? "border-red-300 focus:border-red-400" : "border-border focus:border-accent/30"
                    }`}
                    aria-invalid={!!formErrors.target}
                    aria-describedby={formErrors.target ? "goal-target-error" : undefined}
                  />
                  {formErrors.target && <p id="goal-target-error" className="mt-1 text-[11px] text-red-500">{formErrors.target}</p>}
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-30"
                >
                  {creating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600 ring-1 ring-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <motion.div variants={stagger} className="space-y-3">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          return (
            <motion.div
              key={goal.name}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all hover:shadow-md hover:shadow-black/[0.03]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <Target className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-foreground truncate">{goal.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{progress.toFixed(0)}%</div>
                    <div className="text-[10px] text-muted-foreground">
                      ${(goal.target - goal.current).toLocaleString()} left
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.name)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-400"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.name} progress`}
                />
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-accent/40" />
                Botter is prioritizing this goal
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && !showCreate && (
          <motion.div variants={fadeUp} className="text-center py-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
              <Rocket className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div className="text-[15px] font-medium text-foreground/40 mb-1">No goals yet</div>
            <div className="text-[13px] text-muted-foreground mb-4">
              Create a goal to help Botter understand your financial priorities.
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 mx-auto text-[13px] text-accent/60 hover:text-accent transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first goal
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
