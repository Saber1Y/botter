"use client";

import { Webhook, GitBranch, Lock, Send, Brain, CheckCircle2 } from "lucide-react";

/* ─── Pact workflow diagram ───
 * Mirrors a workflow-builder graph: Intent → Policy → Vault → { Send USDC, Journal }
 * Hand-built SVG connectors + absolutely-positioned HTML nodes, in a fixed
 * logical 1040x400 space that scales responsively (overflow-x on small screens).
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
};

const NODES: NodeDef[] = [
  {
    key: "intent",
    left: 20,
    top: 160,
    width: 176,
    height: 98,
    icon: <Webhook className="h-5 w-5" strokeWidth={1.75} />,
    label: "Intent",
    sublabel: "pay 0xAlice 60 USDC",
    tint: {
      box: "",
      iconWrap: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: true,
  },
  {
    key: "policy",
    left: 330,
    top: 160,
    width: 176,
    height: 98,
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
  },
  {
    key: "vault",
    left: 640,
    top: 160,
    width: 176,
    height: 98,
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
  },
  {
    key: "send",
    left: 850,
    top: 50,
    width: 176,
    height: 98,
    icon: <Send className="h-5 w-5" strokeWidth={1.75} />,
    label: "Send USDC",
    sublabel: "Approved payment",
    tint: {
      box: "",
      iconWrap: "bg-blue-50 text-blue-600 border border-blue-200",
      icon: "",
      border: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    },
    completed: false,
  },
  {
    key: "journal",
    left: 850,
    top: 300,
    width: 176,
    height: 98,
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
  },
];

const STROKE = { width: 1.6, dashed: "6 5" };

type Port = [number, number, string];

const PORTS: Port[] = [
  [196, 209, "#a8a29e"],
  [330, 209, "#a8a29e"],
  [506, 192, "#10b981"],
  [506, 226, "#ef4444"],
  [640, 194, "#10b981"],
  [640, 224, "#ef4444"],
  [816, 186, "#3b82f6"],
  [816, 232, "#8b5cf6"],
  [850, 122, "#3b82f6"],
  [850, 300, "#8b5cf6"],
];

const MARKERS = {
  gray: "url(#arrGray)",
  green: "url(#arrGreen)",
  red: "url(#arrRed)",
  blue: "url(#arrBlue)",
  purple: "url(#arrPurple)",
};

export default function WorkflowDiagram() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-4">
      <div className="relative mx-auto aspect-[1040/400] w-full min-w-[840px]">
        <svg
          viewBox="0 0 1040 400"
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

          {/* 1 · Intent → Policy */}
          <path
            d="M196,209 L330,209"
            stroke="#a8a29e"
            strokeWidth={STROKE.width}
            strokeDasharray={STROKE.dashed}
            markerEnd={MARKERS.gray}
          />

          {/* 2 · Policy → Yes → Vault (upper) */}
          <path
            d="M506,192 C 552,168 590,168 640,194"
            stroke="#10b981"
            strokeWidth={STROKE.width}
            strokeDasharray={STROKE.dashed}
            markerEnd={MARKERS.green}
          />
          <text
            x="572"
            y="162"
            textAnchor="middle"
            fontSize="13"
            fontWeight={600}
            fill="#10b981"
            fontFamily="inherit"
          >
            Yes
          </text>

          {/* 3 · Policy → No → Vault (lower) */}
          <path
            d="M506,226 C 552,250 590,250 640,224"
            stroke="#ef4444"
            strokeWidth={STROKE.width}
            strokeDasharray={STROKE.dashed}
            markerEnd={MARKERS.red}
          />
          <text
            x="572"
            y="262"
            textAnchor="middle"
            fontSize="13"
            fontWeight={600}
            fill="#ef4444"
            fontFamily="inherit"
          >
            No
          </text>

          {/* 4 · Vault → Send USDC (upper) */}
          <path
            d="M816,186 C 830,204 830,126 850,122"
            stroke="#3b82f6"
            strokeWidth={STROKE.width}
            strokeDasharray={STROKE.dashed}
            markerEnd={MARKERS.blue}
          />

          {/* 5 · Vault → Journal (lower) */}
          <path
            d="M816,232 C 830,214 830,296 850,300"
            stroke="#8b5cf6"
            strokeWidth={STROKE.width}
            strokeDasharray={STROKE.dashed}
            markerEnd={MARKERS.purple}
          />
        </svg>

        {/* Connection ports (handle dots) */}
        {PORTS.map(([cx, cy, color], i) => (
          <span
            key={i}
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white"
            style={{
              left: `${(cx / 1040) * 100}%`,
              top: `${(cy / 400) * 100}%`,
              background: color as string,
            }}
          />
        ))}

        {/* Nodes */}
        {NODES.map((n) => (
          <div
            key={n.key}
            className={`absolute flex h-[98px] w-[176px] flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-white ${n.tint.border}`}
            style={{
              left: `${(n.left / 1040) * 100}%`,
              top: `${(n.top / 400) * 100}%`,
            }}
          >
            <div className="relative">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${n.tint.iconWrap}`}
              >
                {n.icon}
              </div>
              {n.completed && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              )}
            </div>
            <p className="text-[13px] font-semibold tracking-tight text-stone-800">
              {n.label}
            </p>
            <p className="text-[11px] text-stone-500">{n.sublabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
