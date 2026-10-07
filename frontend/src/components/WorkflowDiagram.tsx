"use client";

import { Webhook, GitBranch, Lock, Send, Brain, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Botter workflow diagram ───
 * Mirrors a workflow-builder graph: Intent → Policy → Vault → { Send USDT, Journal }
 * Hand-built SVG connectors + absolutely-positioned HTML nodes, in a fixed
 * logical 1240x460 space that scales responsively (overflow-x on small screens).
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
    box: string;
    iconWrap: string;
    icon: string;
    border: string;
  };
  completed?: boolean;
  order: number;
};

const W = 1240;
const H = 460;

const NODES: NodeDef[] = [
  {
    key: "intent",
    left: 24,
    top: 190,
    width: 215,
    height: 118,
    icon: <Webhook className="h-5 w-5" strokeWidth={1.75} />,
    label: "Intent",
    sublabel: "pay 0xAlice 60 USDT",
    tint: {
      box: "",
      iconWrap: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: true,
    order: 0,
  },
  {
    key: "policy",
    left: 390,
    top: 190,
    width: 215,
    height: 118,
    icon: <GitBranch className="h-5 w-5" strokeWidth={1.75} />,
    label: "Policy",
    sublabel: "Your rules decide",
    tint: {
      box: "",
      iconWrap: "bg-orange-50 text-orange-500 border border-orange-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: false,
    order: 1,
  },
  {
    key: "vault",
    left: 756,
    top: 190,
    width: 215,
    height: 118,
    icon: <Lock className="h-5 w-5" strokeWidth={1.75} />,
    label: "Vault",
    sublabel: "Onchain gate & spend",
    tint: {
      box: "",
      iconWrap: "bg-stone-100 text-stone-500 border border-stone-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: true,
    order: 2,
  },
  {
    key: "send",
    left: 1000,
    top: 60,
    width: 215,
    height: 118,
    icon: <Send className="h-5 w-5" strokeWidth={1.75} />,
    label: "Send USDT",
    sublabel: "Approved payment",
    tint: {
      box: "",
      iconWrap: "bg-blue-50 text-blue-600 border border-blue-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: false,
    order: 3,
  },
  {
    key: "journal",
    left: 1000,
    top: 330,
    width: 215,
    height: 118,
    icon: <Brain className="h-5 w-5" strokeWidth={1.75} />,
    label: "Journal",
    sublabel: "Memory + audit",
    tint: {
      box: "",
      iconWrap: "bg-violet-50 text-violet-600 border border-violet-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: false,
    order: 4,
  },
];

const STROKE = { width: 1.6, dashed: "6 5" };

type Port = [number, number, string];

const PORTS: Port[] = [
  [239, 249, "#a8a29e"],
  [390, 249, "#a8a29e"],
  [605, 230, "#10b981"],
  [605, 268, "#ef4444"],
  [756, 232, "#10b981"],
  [756, 266, "#ef4444"],
  [971, 222, "#3b82f6"],
  [971, 276, "#8b5cf6"],
  [1000, 144, "#3b82f6"],
  [1000, 360, "#8b5cf6"],
];

/* Animated connector definitions: color, path d, optional label */
const EDGES: {
  d: string;
  color: string;
  label?: { x: number; y: number; text: string };
}[] = [
  { d: "M239,249 L390,249", color: "#a8a29e" },
  { d: "M605,230 C 655,206 690,206 756,230", color: "#10b981", label: { x: 700, y: 188, text: "Yes" } },
  { d: "M605,268 C 655,292 690,292 756,266", color: "#ef4444", label: { x: 700, y: 304, text: "No" } },
  { d: "M971,222 C 985,244 985,144 1000,144", color: "#3b82f6" },
  { d: "M971,276 C 985,254 985,360 1000,360", color: "#8b5cf6" },
];

/* Edge draw-in staggering derived from node order indices */
const EDGE_ORDER = [0, 1, 2, 3, 4];

export default function WorkflowDiagram() {
  const viewport = { once: true, margin: "-80px" } as const;

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="relative mx-auto aspect-[1240/460] w-full min-w-[940px]">
        {/* Connector layer */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            {(
              [
                ["arrGray", "#a8a29e"],
                ["arrGreen", "#10b981"],
                ["arrRed", "#ef4444"],
                ["arrBlue", "#3b82f6"],
                ["arrPurple", "#8b5cf6"],
              ] as const
            ).map(([id, color]) => (
              <marker
                key={id}
                id={id}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            ))}
          </defs>

          {EDGES.map((e, i) => (
            <motion.path
              key={i}
              d={e.d}
              stroke={e.color}
              strokeWidth={STROKE.width}
              strokeDasharray={STROKE.dashed}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={viewport}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                delay: 0.15 + EDGE_ORDER[i] * 0.16,
              }}
              markerEnd={
                e.color === "#10b981"
                  ? "url(#arrGreen)"
                  : e.color === "#ef4444"
                    ? "url(#arrRed)"
                    : e.color === "#3b82f6"
                      ? "url(#arrBlue)"
                      : e.color === "#8b5cf6"
                        ? "url(#arrPurple)"
                        : "url(#arrGray)"
              }
            />
          ))}

          {EDGES.flatMap((e, i) =>
            e.label
              ? [
                  <motion.text
                    key={`l${i}`}
                    x={e.label.x}
                    y={e.label.y}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight={600}
                    fill={e.color}
                    fontFamily="inherit"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={viewport}
                    transition={{ delay: 0.5 + i * 0.16, duration: 0.4 }}
                  >
                    {e.label.text}
                  </motion.text>,
                ]
              : [],
          )}
        </svg>

        {/* Connection ports (handle dots) */}
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

        {/* Nodes */}
        {NODES.map((n) => (
          <motion.div
            key={n.key}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 + n.order * 0.16 }}
            className={`absolute flex h-[118px] w-[215px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white ${n.tint.border}`}
            style={{
              left: `${(n.left / W) * 100}%`,
              top: `${(n.top / H) * 100}%`,
            }}
          >
            <div className="relative">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${n.tint.iconWrap}`}
              >
                {n.icon}
              </div>
              {n.completed && (
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={viewport}
                  transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.6 + n.order * 0.12 }}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                </motion.span>
              )}
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
