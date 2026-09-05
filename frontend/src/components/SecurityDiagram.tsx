"use client";

import { User, Sparkles, ShieldCheck, Send, Lock } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Pact security-boundary diagram ───
 * Contrasts the sandboxed AI layer (left, red zone) with the deterministic
 * enforcement chain (right, indigo zone). The only thing that crosses the
 * boundary is validated intent JSON - never an unfettered contract call.
 * Hand-built on a fixed 1240x560 coordinate space that scales responsively.
 */

type NodeDef = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  tint: {
    iconWrap: string;
    border?: string;
  };
  order: number;
};

const W = 1240;
const H = 560;

const NODES: NodeDef[] = [
  {
    key: "intent",
    left: 150,
    top: 150,
    width: 215,
    height: 118,
    icon: <User className="h-5 w-5" strokeWidth={1.75} />,
    label: "Intent",
    sublabel: "pay 0xAlice 60 USDC",
    tint: {
      iconWrap: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    },
    order: 0,
  },
  {
    key: "model",
    left: 150,
    top: 330,
    width: 215,
    height: 118,
    icon: <Sparkles className="h-5 w-5" strokeWidth={1.75} />,
    label: "AI Model",
    sublabel: "reasons · no keys or calls",
    tint: {
      iconWrap: "bg-rose-50 text-rose-500 border border-rose-200",
      border: "ring-2 ring-rose-300/50 ring-offset-1",
    },
    order: 1,
  },
  {
    key: "policy",
    left: 730,
    top: 150,
    width: 215,
    height: 118,
    icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />,
    label: "Policy Engine",
    sublabel: "validates your rules",
    tint: {
      iconWrap: "bg-orange-50 text-orange-500 border border-orange-200",
    },
    order: 2,
  },
  {
    key: "vault",
    left: 730,
    top: 330,
    width: 215,
    height: 118,
    icon: <Send className="h-5 w-5" strokeWidth={1.75} />,
    label: "PactVault.pay()",
    sublabel: "typed call · Base onchain",
    tint: {
      iconWrap: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    },
    order: 3,
  },
];

const EDGES: {
  d: string;
  color: string;
  label?: { x: number; y: number; text: string };
  order: number;
}[] = [
  // intent -> model (within AI zone)
  {
    d: "M257,268 L257,330",
    color: "#10b981",
    order: 0,
  },
  // model (cross boundary) -> policy engine
  {
    d: "M365,389 C 525,389 545,209 730,209",
    color: "#f59e0b",
    label: { x: 605, y: 330, text: "intent JSON · validated" },
    order: 1,
  },
  // policy engine -> vault (within enforcement zone)
  {
    d: "M837,268 L837,330",
    color: "#10b981",
    label: { x: 837, y: 252, text: "valid" },
    order: 2,
  },
];

const PORTS: [number, number, string][] = [
  [257, 268, "#10b981"],
  [257, 330, "#10b981"],
  [365, 389, "#f59e0b"],
  [730, 209, "#f59e0b"],
  [837, 268, "#10b981"],
  [837, 330, "#10b981"],
];

export default function SecurityDiagram() {
  const viewport = { once: true, margin: "-80px" } as const;

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="relative mx-auto aspect-[1240/560] w-full min-w-[940px]">
        {/* SVG layer: panels, boundary, connectors */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="secArrowGreen"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker
              id="secArrowAmber"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>

          {/* AI sandbox panel (left, red dashed) */}
          <motion.rect
            x={24}
            y={60}
            width={536}
            height={440}
            rx={22}
            fill="rgba(244,63,94,0.035)"
            stroke="rgba(244,63,94,0.35)"
            strokeWidth={1.5}
            strokeDasharray="7 6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            transition={{ duration: 0.6 }}
          />
          {/* Enforcement panel (right, indigo dashed) */}
          <motion.rect
            x={600}
            y={60}
            width={616}
            height={440}
            rx={22}
            fill="rgba(99,102,241,0.04)"
            stroke="rgba(99,102,241,0.35)"
            strokeWidth={1.5}
            strokeDasharray="7 6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          {/* Security boundary (vertical dashed line + lock) */}
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <line
              x1={580}
              y1={60}
              x2={580}
              y2={500}
              stroke="rgba(244,63,94,0.65)"
              strokeWidth={2}
              strokeDasharray="3 6"
            />
          </motion.g>

          {/* boundary caption (top, centered on the line) */}
          <motion.text
            x={580}
            y={42}
            textAnchor="middle"
            fontSize="11"
            fontWeight={600}
            letterSpacing="0.05em"
            fill="#e11d48"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            MODEL IS SANDBOXED → ONLY VALIDATED INTENT CROSSES
          </motion.text>

          {/* connectors */}
          {EDGES.map((e) => (
            <motion.path
              key={e.d}
              d={e.d}
              stroke={e.color}
              strokeWidth={1.6}
              strokeDasharray="6 5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={viewport}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.25 + e.order * 0.18 }}
              markerEnd={
                e.color === "#10b981" ? "url(#secArrowGreen)" : "url(#secArrowAmber)"
              }
            />
          ))}
          {EDGES.flatMap((e) =>
            e.label
              ? [
                  <motion.text
                    key={`l${e.label.text}`}
                    x={e.label.x}
                    y={e.label.y}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight={600}
                    fill={e.color}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={viewport}
                    transition={{ delay: 0.7 + e.order * 0.18, duration: 0.4 }}
                  >
                    {e.label.text}
                  </motion.text>,
                ]
              : [],
          )}
        </svg>

        {/* connection ports */}
        {PORTS.map(([cx, cy, color], i) => (
          <span
            key={i}
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white"
            style={{
              left: `${(cx / W) * 100}%`,
              top: `${(cy / H) * 100}%`,
              background: color,
            }}
          />
        ))}

        {/* zone label chips */}
        <div
          className="pointer-events-none absolute flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold tracking-wide text-rose-500"
          style={{ left: `${(40 / W) * 100}%`, top: `${(76 / H) * 100}%` }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
          AI layer · sandboxed
        </div>
        <div
          className="pointer-events-none absolute flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-semibold tracking-wide text-indigo-500"
          style={{ left: `${(616 / W) * 100}%`, top: `${(76 / H) * 100}%` }}
        >
          <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
          Deterministic enforcement
        </div>

        {/* nodes */}
        {NODES.map((n) => (
          <motion.div
            key={n.key}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 + n.order * 0.16 }}
            className={`absolute flex h-[118px] w-[215px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${n.tint.border ?? ""}`}
            style={{
              left: `${(n.left / W) * 100}%`,
              top: `${(n.top / H) * 100}%`,
            }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${n.tint.iconWrap}`}>
              {n.icon}
            </div>
            <p className="text-[13px] font-semibold tracking-tight text-stone-800">
              {n.label}
            </p>
            <p className="text-[11px] text-stone-500">{n.sublabel}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
