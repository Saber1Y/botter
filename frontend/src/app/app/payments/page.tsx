"use client";

import { useEffect, useState } from "react";
import { api, Payment } from "@/lib/api";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Clock,
  Filter,
  ArrowDownRight,
  Receipt,
} from "lucide-react";
import { PageSkeleton } from "@/components/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = { visible: { transition: { staggerChildren: 0.05 } } };

function PaymentRow({ payment, isSelected }: { payment: Payment; isSelected: boolean }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";
  const Icon = isApproved ? CheckCircle2 : isPending ? AlertTriangle : XCircle;

  return (
    <div
      className={`flex items-center justify-between border-b border-border py-4 last:border-0 transition-colors ${
        isSelected ? "bg-accent/5" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
            isApproved
              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
              : isPending
                ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                : "bg-red-50 text-red-600 ring-1 ring-red-200"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-foreground truncate">{payment.recipient}</div>
          <div className="text-[11px] text-muted-foreground">
            {isApproved ? "Auto-approved" : isPending ? "Approved by you" : "Denied"}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <div className="flex items-center gap-1">
          <ArrowDownRight className="h-3 w-3 text-red-400" />
          <div className="text-[14px] font-semibold text-foreground">${payment.amount}</div>
        </div>
        <div className="text-[10px] text-muted-foreground">{payment.token}</div>
      </div>
    </div>
  );
}

function PaymentDetail({ payment }: { payment: Payment }) {
  const isApproved = payment.decision === "APPROVE";
  const isPending = payment.decision === "REQUIRE_APPROVAL";
  const Icon = isApproved ? CheckCircle2 : isPending ? AlertTriangle : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
              isApproved
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                : isPending
                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                  : "bg-red-50 text-red-600 ring-1 ring-red-200"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-foreground truncate">{payment.recipient}</div>
            <div className="text-[11px] text-muted-foreground">{payment.decision}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-foreground">${payment.amount}</div>
          <div className="text-[11px] text-muted-foreground">{payment.token}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="rounded-xl bg-muted p-3">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Status</div>
          <div className="text-[13px] text-foreground">{payment.status}</div>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Decision</div>
          <div className="text-[13px] text-foreground">{payment.decision}</div>
        </div>
      </div>

      {payment.reason && (
        <div className="mb-4 rounded-xl bg-muted p-3">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Reason</div>
          <div className="text-[12px] text-muted-foreground">{payment.reason}</div>
        </div>
      )}

      {payment.tx_hash && (
        <a
          href={`https://sepolia.basescan.org/tx/${payment.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:text-accent/80 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View on BaseScan
        </a>
      )}
    </motion.div>
  );
}

const filters = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending" },
  { key: "denied", label: "Denied" },
] as const;

export default function PaymentsPage() {
  const { address } = useAccount();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "denied">("all");
  const [selected, setSelected] = useState<Payment | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }
    api
      .getPayments(address)
      .then(setPayments)
      .catch(() => setError("Failed to load payments."))
      .finally(() => setLoading(false));
  }, [address]);

  const filtered = payments.filter((p) => {
    if (filter === "all") return true;
    if (filter === "approved") return p.decision === "APPROVE";
    if (filter === "pending") return p.decision === "REQUIRE_APPROVAL";
    if (filter === "denied") return p.decision === "DENY";
    return true;
  });

  if (loading) return <PageSkeleton />;

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
            <Receipt className="h-4 w-4 text-accent" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Payments</h1>
        </div>
        <p className="text-[13px] text-muted-foreground sm:ml-11">
          All payments executed by Pact on Base Sepolia.
        </p>
      </motion.div>

      <AnimatePresence>
        {selected && <PaymentDetail payment={selected} />}
      </AnimatePresence>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600 ring-1 ring-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <motion.div variants={fadeUp} className="mb-4 flex flex-wrap items-center gap-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
              filter === f.key
                ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <div className="text-[15px] font-medium text-foreground/40 mb-1">No payments yet</div>
            <div className="text-[13px] text-muted-foreground">
              Payments will appear here after Pact executes them.
            </div>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}
                className="w-full text-left"
                aria-expanded={selected?.id === p.id}
                aria-label={`Payment to ${p.recipient} for $${p.amount}`}
              >
                <PaymentRow payment={p} isSelected={selected?.id === p.id} />
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
