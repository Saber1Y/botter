"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

/* ─── Animation Variants (typed for framer-motion 13) ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideRight = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ─── Hero Chat Mockup ─── */
function HeroChatMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => setStep(3), 2600),
      setTimeout(() => setStep(4), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div variants={slideLeft} initial="hidden" animate="visible" className="relative">
      <div className="absolute -inset-8 rounded-3xl bg-emerald-500/[0.03] blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c0c] shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <span className="ml-2 text-[11px] font-medium tracking-wide text-white/30">Pact AI CFO</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-emerald-500/70">Active</span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* User message */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex justify-end"
          >
            <div className="max-w-[75%] rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[13px] text-white/90">
              Pay Acme $150
            </div>
          </motion.div>

          {/* AI response */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex gap-2.5"
          >
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="max-w-[80%] space-y-3">
              <div className="rounded-2xl rounded-bl-md bg-white/[0.04] px-4 py-3 text-[13px] leading-relaxed text-white/70">
                I remember your $100 automatic spending limit. This payment requires your approval.
              </div>

              <AnimatePresence>
                {step >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-white/90">Acme Software</p>
                          <p className="text-[11px] text-white/30">Subscription renewal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-white/90">$150</p>
                          <p className="text-[11px] text-white/30">USDC</p>
                        </div>
                      </div>

                      <div className="mb-3 rounded-lg bg-white/[0.03] px-3 py-2">
                        <p className="text-[11px] text-white/40">
                          Above your $100 autonomous spending limit
                        </p>
                      </div>

                      <AnimatePresence>
                        {step >= 2 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3 }}
                            className="mb-3 flex flex-wrap gap-1.5"
                          >
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400/80 ring-1 ring-emerald-500/20"
                            >
                              <span className="h-1 w-1 rounded-full bg-emerald-400" />
                              $100 spending limit
                            </motion.span>
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-400/80 ring-1 ring-blue-500/20"
                            >
                              <span className="h-1 w-1 rounded-full bg-blue-400" />
                              Acme = trusted
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <button className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/70">
                          Reject
                        </button>
                        <button className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-[12px] font-medium text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
                          Approve
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Executed */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-emerald-500/[0.08] px-4 py-2.5 text-[13px] text-emerald-400 ring-1 ring-emerald-500/20">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Executed on Base
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <motion.div variants={fadeUp} className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c0c] shadow-2xl shadow-black/50">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <span className="text-xs font-bold text-emerald-400">P</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">Pact Dashboard</p>
              <p className="text-[11px] text-white/30">Base Sepolia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              Synced
            </span>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_1px_1fr]">
          {/* Left: Stats */}
          <div className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/25">Vault</p>
                <p className="text-2xl font-bold tracking-tight text-white/90">$482.40</p>
                <p className="mt-0.5 text-[10px] text-white/20">USDC on Base</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/25">Budget left</p>
                <p className="text-2xl font-bold tracking-tight text-white/90">$73</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[36%] rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>

            {/* Goal */}
            <div className="mb-6 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">Active goal</p>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400 ring-1 ring-blue-500/20">
                  72%
                </span>
              </div>
              <p className="mb-3 text-sm font-medium text-white/80">MacBook Pro</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-white/25">
                <span>$1,440 saved</span>
                <span>$2,000 target</span>
              </div>
            </div>

            {/* Memory chips */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">Active rules</p>
              {[
                { label: "$100 auto-approve limit", color: "emerald" },
                { label: "Acme = trusted", color: "blue" },
                { label: "Save 30% of income", color: "purple" },
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className={`h-1.5 w-1.5 rounded-full bg-${rule.color}-500`} />
                  <span className="text-[11px] text-white/40">{rule.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden bg-white/[0.04] md:block" />

          {/* Right: Activity */}
          <div className="p-6">
            <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-white/25">Recent activity</p>
            <div className="space-y-2">
              {[
                { name: "Acme Software", amount: "$42", status: "Auto-approved", time: "2m ago", color: "emerald" },
                { name: "Vercel", amount: "$20", status: "Auto-approved", time: "1h ago", color: "emerald" },
                { name: "Acme Software", amount: "$150", status: "Approval required", time: "3h ago", color: "amber" },
                { name: "Linear", amount: "$8", status: "Auto-approved", time: "5h ago", color: "emerald" },
                { name: "Figma", amount: "$15", status: "Rejected", time: "1d ago", color: "red" },
              ].map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] px-3.5 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                      <span className="text-[11px] font-semibold text-white/30">{tx.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-white/70">{tx.name}</p>
                      <p className="text-[10px] text-white/20">{tx.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium ${
                      tx.color === "emerald" ? "text-emerald-400/70" :
                      tx.color === "amber" ? "text-amber-400/70" :
                      "text-red-400/70"
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-[12px] font-medium text-white/60">{tx.amount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI insight */}
            <div className="mt-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <div className="h-1 w-1 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-emerald-400/80">AI Insight</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/30">
                    You&apos;re $73 under your weekly autonomous budget. Acme is within normal range.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Section Wrapper ─── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className={`relative px-6 py-24 md:py-32 ${className}`}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </motion.section>
  );
}

/* ─── Badge ─── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeIn}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium tracking-wide text-white/40"
    >
      {children}
    </motion.div>
  );
}

/* ─── Step Card ─── */
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div variants={fadeUp} className="relative group">
      <div className="mb-3 text-[11px] font-medium tracking-widest text-emerald-500/60">{number}</div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-white/90">{title}</h3>
      <p className="text-[13px] leading-relaxed text-white/35">{description}</p>
    </motion.div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
    >
      <div className="mb-3 text-[11px] font-medium tracking-widest text-emerald-500/60">{number}</div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-white/90">{title}</h3>
      <p className="text-[13px] leading-relaxed text-white/35">{description}</p>
    </motion.div>
  );
}

/* ─── Memory Card ─── */
function MemoryCard({ icon, label, example }: { icon: React.ReactNode; label: string; example: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
    >
      <div className="mb-3 text-white/20">{icon}</div>
      <p className="mb-1 text-[13px] font-medium text-white/70">{label}</p>
      <p className="text-[12px] text-white/25">{example}</p>
    </motion.div>
  );
}

/* ─── Architecture Step ─── */
function ArchStep({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-medium text-white/50">
        {label}
      </div>
      {sublabel && <p className="text-[10px] text-white/20">{sublabel}</p>}
    </div>
  );
}

function ArchArrow() {
  return (
    <div className="flex items-center px-1.5">
      <div className="h-px w-6 bg-white/[0.08] md:w-10" />
      <svg className="h-3 w-3 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -40]);

  return (
    <div className="relative min-h-screen">
      {/* Subtle grid */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="h-full w-full opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.04] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Pact" width={24} height={24} className="rounded-md" />
            <span className="text-[15px] font-bold tracking-tight text-white/90">Pact</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {["Product", "How it works", "Memory", "Security"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-[13px] text-white/35 transition-colors hover:text-white/70"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Saber1Y/Pact"
              target="_blank"
              rel="noreferrer"
              className="hidden text-[13px] text-white/35 transition-colors hover:text-white/70 md:block"
            >
              Docs
            </a>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* ─── Hero: Double Pivot Split ─── */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 flex min-h-screen items-center px-6 pt-14"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
              <span className="text-[11px] font-medium tracking-wide text-white/40">AI-native financial agent</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mb-5 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-white/95"
            >
              Your money.
              <br />
              Your rules.
              <br />
              <span className="text-emerald-400">Remembered.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mb-8 max-w-md text-[15px] leading-relaxed text-white/35"
            >
              Set the rules once. Pact remembers them across sessions, makes decisions using your
              financial context, and executes approved actions onchain.
            </motion.p>

            <motion.div variants={fadeUp} className="mb-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[13px] font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                Start with Pact
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/70"
              >
                See how it works
              </a>
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4 text-[11px] text-white/20">
              {["Sibyl Memory", "Base", "AI-native", "Non-custodial"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-white/15" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Interactive mockup */}
          <div className="hidden lg:block">
            <HeroChatMockup />
          </div>
        </div>
      </motion.section>

      {/* ─── The Problem ─── */}
      <Section id="product">
        <motion.div variants={fadeUp} className="mb-16 text-center">
          <Badge>The Problem</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            AI can act.
            <br />
            But can it remember?
          </h2>
          <p className="mx-auto max-w-md text-[15px] text-white/30">
            Without memory, every conversation starts from zero. The agent forgets your rules, your
            preferences, and your history.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
          >
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-medium text-red-400/80 ring-1 ring-red-500/20">
              Without memory
            </div>
            <div className="space-y-3">
              {[
                "User explains spending rule",
                "Session ends",
                "Agent forgets everything",
                "Unsafe or incorrect decision",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[10px] text-white/20">
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-white/30">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-7"
          >
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-400/80 ring-1 ring-emerald-500/20">
              With Pact
            </div>
            <div className="space-y-3">
              {[
                "User sets rule once",
                "Pact stores it permanently",
                "New session begins",
                "Agent retrieves context, makes correct decision",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] text-emerald-400/80">
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-white/50">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ─── Memory is the Product ─── */}
      <Section id="memory">
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <Badge>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Powered by Sibyl Memory
          </Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            Pact doesn&apos;t just remember your data.
            <br />
            It remembers your decisions.
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <MemoryCard
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            label="Financial goals"
            example="Save $2,000 for a MacBook"
          />
          <MemoryCard
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
            label="Spending rules"
            example="Auto-approve up to $100"
          />
          <MemoryCard
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Trusted merchants"
            example="Acme Software, Vercel"
          />
          <MemoryCard
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
            label="Preferences"
            example="Prioritize savings over spending"
          />
          <MemoryCard
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Past decisions"
            example="Rejected this subscription last month"
          />
          <MemoryCard
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            label="Blocked merchants"
            example="Never pay Untrusted Corp"
          />
        </motion.div>

        <motion.p variants={fadeUp} className="mx-auto max-w-md text-center text-[13px] leading-relaxed text-white/25">
          Persistent memory turns a generic agent into an agent that actually knows how you want your
          money handled.
        </motion.p>
      </Section>

      {/* ─── How it Works ─── */}
      <Section id="how-it-works">
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <Badge>How it works</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            Remember. Decide. Act.
          </h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mb-14 flex flex-wrap items-center justify-center gap-2 md:gap-0"
        >
          <ArchStep label="You" sublabel="Set rules" />
          <ArchArrow />
          <ArchStep label="Pact" sublabel="Remember" />
          <ArchArrow />
          <ArchStep label="Policy" sublabel="Decide" />
          <ArchArrow />
          <ArchStep label="Base" sublabel="Execute" />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StepCard number="01" title="Remember" description="Pact stores your financial goals, rules, preferences, and history." />
          <StepCard number="02" title="Understand" description="When you request an action, Pact retrieves the context that matters." />
          <StepCard number="03" title="Decide" description="Pact determines whether to approve, ask, or deny based on your rules." />
          <StepCard number="04" title="Act" description="Approved actions execute securely onchain via smart contracts." />
        </motion.div>
      </Section>

      {/* ─── Product Showcase ─── */}
      <Section id="product-showcase">
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <Badge>Product</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            Your AI CFO, with context.
          </h2>
          <p className="mx-auto max-w-md text-[15px] text-white/30">
            A complete financial interface powered by persistent memory and onchain execution.
          </p>
        </motion.div>

        <DashboardMockup />
      </Section>

      {/* ─── Why Pact is Different ─── */}
      <Section>
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <Badge>Why Pact</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            Not a wallet.
            <br />
            Not a chatbot.
            <br />
            An agent with memory.
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 md:grid-cols-3"
        >
          <FeatureCard
            number="01"
            title="Persistent memory"
            description="Your financial rules survive the session. Pact remembers across every interaction."
          />
          <FeatureCard
            number="02"
            title="Policy-aware autonomy"
            description="Pact knows when it can act and when it should ask. You define the boundaries."
          />
          <FeatureCard
            number="03"
            title="Onchain execution"
            description="Approved financial actions execute on Base. Transparent, verifiable, auditable."
          />
        </motion.div>
      </Section>

      {/* ─── Base / Onchain ─── */}
      <Section>
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <Badge>Onchain</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            When Pact acts, it acts onchain.
          </h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mx-auto mb-10 flex max-w-xl flex-wrap items-center justify-center gap-2 md:gap-0"
        >
          <ArchStep label="Pact" />
          <ArchArrow />
          <ArchStep label="Policy" />
          <ArchArrow />
          <ArchStep label="Vault" />
          <ArchArrow />
          <ArchStep label="Base" />
          <ArchArrow />
          <ArchStep label="USDC" />
        </motion.div>

        <motion.p variants={fadeUp} className="mx-auto max-w-md text-center text-[13px] leading-relaxed text-white/25">
          Pact combines persistent financial memory with programmable onchain execution. Every action
          is verifiable. Every rule is enforced by smart contracts.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 text-center">
          <a
            href="https://github.com/Saber1Y/Pact"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/70"
          >
            Explore the architecture
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </motion.div>
      </Section>

      {/* ─── Security ─── */}
      <Section id="security">
        <motion.div variants={fadeUp} className="mb-14 text-center">
          <Badge>Security</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-white/90">
            Autonomous doesn&apos;t mean uncontrolled.
          </h2>
          <p className="mx-auto max-w-md text-[15px] text-white/30">
            AI handles context and reasoning. Smart contracts enforce the boundaries.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mx-auto mb-14 flex max-w-3xl flex-wrap items-center justify-center gap-2 md:gap-0"
        >
          <ArchStep label="User" sublabel="Define" />
          <ArchArrow />
          <ArchStep label="Memory" sublabel="Context" />
          <ArchArrow />
          <ArchStep label="Policy" sublabel="Reason" />
          <ArchArrow />
          <ArchStep label="Contract" sublabel="Enforce" />
          <ArchArrow />
          <ArchStep label="Base" sublabel="Execute" />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            { title: "User-defined limits", desc: "You set spending thresholds and budgets" },
            { title: "Approval thresholds", desc: "Payments above your limit require confirmation" },
            { title: "Trusted recipients", desc: "Only pre-approved addresses receive funds" },
            { title: "Contract-enforced controls", desc: "Smart contracts prevent unauthorized actions" },
            { title: "No arbitrary AI calls", desc: "The LLM never calls contracts directly" },
            { title: "Full audit trail", desc: "Every decision is logged and verifiable" },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[13px] font-medium text-white/70">{item.title}</p>
              </div>
              <p className="text-[12px] text-white/25">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── Final CTA ─── */}
      <Section>
        <div className="relative">
          {/* Floating memory cards */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[5%] top-[15%] rounded-lg border border-white/[0.06] bg-[#0c0c0c] px-3 py-1.5 text-[10px] text-white/20"
            >
              $100 auto limit
            </motion.div>
            <motion.div
              animate={{ y: [5, -5, 5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[8%] top-[25%] rounded-lg border border-white/[0.06] bg-[#0c0c0c] px-3 py-1.5 text-[10px] text-white/20"
            >
              MacBook: $2,000
            </motion.div>
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[25%] left-[15%] rounded-lg border border-white/[0.06] bg-[#0c0c0c] px-3 py-1.5 text-[10px] text-white/20"
            >
              Acme: trusted
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="relative text-center">
            <h2 className="mb-4 text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tight text-white/90">
              Give your money an agent
              <br />
              that remembers.
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-[15px] text-white/30">
              Set the rules once. Pact remembers them every time.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[13px] font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                Get started
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="https://github.com/Saber1Y/Pact"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/70"
              >
                View documentation
              </a>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Pact" width={20} height={20} className="rounded-md" />
            <span className="text-[13px] font-semibold text-white/30">Pact</span>
          </div>

          <div className="flex gap-5 text-[12px] text-white/20">
            {["Product", "Memory", "Security", "GitHub"].map((item) => (
              <a
                key={item}
                href={item === "GitHub" ? "https://github.com/Saber1Y/Pact" : `#${item.toLowerCase()}`}
                target={item === "GitHub" ? "_blank" : undefined}
                rel={item === "GitHub" ? "noreferrer" : undefined}
                className="transition-colors hover:text-white/40"
              >
                {item}
              </a>
            ))}
          </div>

          <p className="text-[11px] text-white/15">
            AI financial autonomy with persistent memory.
          </p>
        </div>
      </footer>
    </div>
  );
}
