"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Brain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  Settings,
  CreditCard,
  Lock,
  Eye,
  ExternalLink,
  Sparkles,
  Globe,
  ShieldCheck,
  EyeOff,
  FileCheck,
  ChevronRight,
  Clock,
} from "lucide-react";

/* ─── Animation Variants ─── */
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

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
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
      <div className="absolute -inset-8 rounded-3xl bg-accent/[0.04] blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/[0.04]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-border" />
            <div className="h-2.5 w-2.5 rounded-full bg-border" />
            <div className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <span className="ml-2 text-[11px] font-medium tracking-wide text-muted-foreground">Pact AI CFO</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-emerald-600">Active</span>
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
            <div className="max-w-[75%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[13px] text-white">
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
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
              <Sparkles className="h-3 w-3 text-accent" />
            </div>
            <div className="max-w-[80%] space-y-3">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-[13px] leading-relaxed text-foreground/80">
                I remember your $100 automatic spending limit. This payment requires your approval.
              </div>

              <AnimatePresence>
                {step >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-foreground">Acme Software</p>
                          <p className="text-[11px] text-muted-foreground">Subscription renewal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-foreground">$150</p>
                          <p className="text-[11px] text-muted-foreground">USDC</p>
                        </div>
                      </div>

                      <div className="mb-3 rounded-lg bg-muted px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">
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
                              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent ring-1 ring-accent/20"
                            >
                              <span className="h-1 w-1 rounded-full bg-accent" />
                              $100 spending limit
                            </motion.span>
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent ring-1 ring-accent/20"
                            >
                              <span className="h-1 w-1 rounded-full bg-accent" />
                              Acme = trusted
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <button className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-[12px] font-medium text-muted-foreground transition-all hover:bg-border/50 hover:text-foreground">
                          Reject
                        </button>
                        <button className="flex-1 rounded-lg bg-accent px-3 py-2 text-[12px] font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-accent/20">
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
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                  <Sparkles className="h-3 w-3 text-accent" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/[0.04]">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Pact Dashboard</p>
              <p className="text-[11px] text-muted-foreground">Base Sepolia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-200">
              Synced
            </span>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_1px_1fr]">
          {/* Left: Stats */}
          <div className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Vault</p>
                </div>
                <p className="text-2xl font-bold tracking-tight text-foreground">$482.40</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">USDC on Base</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <Settings className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Budget left</p>
                </div>
                <p className="text-2xl font-bold tracking-tight text-foreground">$73</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full w-[36%] rounded-full bg-accent" />
                </div>
              </div>
            </div>

            {/* Goal */}
            <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Active goal</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-medium text-accent ring-1 ring-accent/20">
                  72%
                </span>
              </div>
              <p className="mb-3 text-sm font-medium text-foreground">MacBook Pro</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-accent to-indigo-400" />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>$1,440 saved</span>
                <span>$2,000 target</span>
              </div>
            </div>

            {/* Memory chips */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Active rules</p>
              {[
                { label: "$100 auto-approve limit", color: "bg-accent" },
                { label: "Acme = trusted", color: "bg-indigo-500" },
                { label: "Save 30% of income", color: "bg-blue-500" },
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${rule.color}`} />
                  <span className="text-[11px] text-muted-foreground">{rule.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden bg-border md:block" />

          {/* Right: Activity */}
          <div className="p-6">
            <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Recent activity</p>
            <div className="space-y-2">
              {[
                { name: "Acme Software", amount: "$42", status: "Auto-approved", time: "2m ago", color: "text-emerald-600", Icon: CheckCircle2 },
                { name: "Vercel", amount: "$20", status: "Auto-approved", time: "1h ago", color: "text-emerald-600", Icon: CheckCircle2 },
                { name: "Acme Software", amount: "$150", status: "Approval required", time: "3h ago", color: "text-amber-600", Icon: AlertTriangle },
                { name: "Linear", amount: "$8", status: "Auto-approved", time: "5h ago", color: "text-emerald-600", Icon: CheckCircle2 },
                { name: "Figma", amount: "$15", status: "Rejected", time: "1d ago", color: "text-red-600", Icon: XCircle },
              ].map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3.5 py-3 transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-border/50">
                      <span className="text-[11px] font-semibold text-muted-foreground">{tx.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{tx.name}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-[10px] font-medium ${tx.color}`}>
                      <tx.Icon className="h-3 w-3" />
                      {tx.status}
                    </span>
                    <span className="text-[12px] font-medium text-muted-foreground">{tx.amount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI insight */}
            <div className="mt-4 rounded-xl border border-accent/10 bg-accent/5 p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <Sparkles className="h-2.5 w-2.5 text-accent" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-accent">AI Insight</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
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
      className={`relative scroll-mt-24 px-6 py-20 md:py-24 ${className}`}
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
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground"
    >
      {children}
    </motion.div>
  );
}

/* ─── Step Card ─── */
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div variants={fadeUp} className="relative group">
      <div className="mb-3 text-[11px] font-medium tracking-widest text-accent">{number}</div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-border bg-card p-7 transition-all hover:shadow-lg hover:shadow-black/[0.04]"
    >
      <div className="mb-3 text-[11px] font-medium tracking-widest text-accent">{number}</div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}

/* ─── Memory Card ─── */
function MemoryCard({ icon, label, example }: { icon: React.ReactNode; label: string; example: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:shadow-black/[0.03]"
    >
      <div className="mb-3 text-accent/60">{icon}</div>
      <p className="mb-1 text-[13px] font-medium text-foreground">{label}</p>
      <p className="text-[12px] text-muted-foreground">{example}</p>
    </motion.div>
  );
}

/* ─── Architecture Step ─── */
function ArchStep({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
        {label}
      </div>
      {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

function ArchArrow() {
  return (
    <div className="flex items-center px-1.5">
      <div className="h-px w-6 bg-border md:w-10" />
      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -40]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Warm radial gradient from top */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% -5%, rgba(99,102,241,0.08) 0%, transparent 60%)",
          }}
        />
        {/* Fading dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #6366f1 0.7px, transparent 0.7px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 18%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 18%, black 30%, transparent 75%)",
          }}
        />
        {/* Floating gradient orbs */}
        <div
          className="animate-drift absolute left-[5%] top-[22%] h-[28rem] w-[28rem] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Pact" width={26} height={26} className="rounded-lg" />
            <span className="text-[16px] font-semibold tracking-tight text-foreground font-display">Pact</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {["Product", "How it works", "Memory", "Security"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
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
              className="hidden text-[13px] text-muted-foreground transition-colors hover:text-foreground md:block"
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
            <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">AI-native financial agent</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mb-5 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-foreground"
            >
              Your money.
              <br />
              Your rules.
              <br />
              <span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">
                Remembered.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mb-8 max-w-md text-[15px] leading-relaxed text-muted-foreground"
            >
              Set the rules once. Pact remembers them across sessions, makes decisions using your
              financial context, and executes approved actions onchain.
            </motion.p>

            <motion.div variants={fadeUp} className="mb-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-[13px] font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-accent/20"
              >
                Start with Pact
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                See how it works
              </a>
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              {["Sibyl Memory", "Base", "AI-native", "Non-custodial"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-accent/50" />
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
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>The Problem</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
            AI can act.
            <br />
            But can it remember?
          </h2>
          <p className="mx-auto max-w-md text-[15px] text-muted-foreground">
            Without memory, every conversation starts from zero. The agent forgets your rules, your
            preferences, and your history.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[10px] font-medium text-red-600 ring-1 ring-red-200">
              <EyeOff className="h-3 w-3" />
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
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-accent/20 bg-accent/5 p-7"
          >
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-medium text-accent ring-1 ring-accent/20">
              <Eye className="h-3 w-3" />
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
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] text-accent">
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-foreground/80">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ─── Memory is the Product ─── */}
      <Section id="memory">
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Powered by Sibyl Memory
          </Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
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
            icon={<Target className="h-5 w-5" />}
            label="Financial goals"
            example="Save $2,000 for a MacBook"
          />
          <MemoryCard
            icon={<Settings className="h-5 w-5" />}
            label="Spending rules"
            example="Auto-approve up to $100"
          />
          <MemoryCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Trusted merchants"
            example="Acme Software, Vercel"
          />
          <MemoryCard
            icon={<Globe className="h-5 w-5" />}
            label="Preferences"
            example="Prioritize savings over spending"
          />
          <MemoryCard
            icon={<Clock className="h-5 w-5" />}
            label="Past decisions"
            example="Rejected this subscription last month"
          />
          <MemoryCard
            icon={<Lock className="h-5 w-5" />}
            label="Blocked merchants"
            example="Never pay Untrusted Corp"
          />
        </motion.div>

        <motion.p variants={fadeUp} className="mx-auto max-w-md text-center text-[13px] leading-relaxed text-muted-foreground">
          Persistent memory turns a generic agent into an agent that actually knows how you want your
          money handled.
        </motion.p>
      </Section>

      {/* ─── How it Works ─── */}
      <Section id="how-it-works">
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>How it works</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
            Remember. Decide. Act.
          </h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mb-10 flex flex-wrap items-center justify-center gap-2 md:gap-0"
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
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>Product</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
            Your AI CFO, with context.
          </h2>
          <p className="mx-auto max-w-md text-[15px] text-muted-foreground">
            A complete financial interface powered by persistent memory and onchain execution.
          </p>
        </motion.div>

        <DashboardMockup />
      </Section>

      {/* ─── Why Pact is Different ─── */}
      <Section>
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>Why Pact</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
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
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>Onchain</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
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

        <motion.p variants={fadeUp} className="mx-auto max-w-md text-center text-[13px] leading-relaxed text-muted-foreground">
          Pact combines persistent financial memory with programmable onchain execution. Every action
          is verifiable. Every rule is enforced by smart contracts.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 text-center">
          <a
            href="https://github.com/Saber1Y/Pact"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            Explore the architecture
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      </Section>

      {/* ─── Security ─── */}
      <Section id="security">
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <Badge>Security</Badge>
          <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,3rem)] font-bold tracking-tight text-foreground">
            Autonomous doesn&apos;t mean uncontrolled.
          </h2>
          <p className="mx-auto max-w-md text-[15px] text-muted-foreground">
            AI handles context and reasoning. Smart contracts enforce the boundaries.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mx-auto mb-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 md:gap-0"
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
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                <p className="text-[13px] font-medium text-foreground">{item.title}</p>
              </div>
              <p className="text-[12px] text-muted-foreground">{item.desc}</p>
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
              className="absolute left-[5%] top-[15%] rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm"
            >
              $100 auto limit
            </motion.div>
            <motion.div
              animate={{ y: [5, -5, 5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[8%] top-[25%] rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm"
            >
              MacBook: $2,000
            </motion.div>
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[25%] left-[15%] rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm"
            >
              Acme: trusted
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="relative text-center">
            <h2 className="mb-4 text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tight text-foreground">
              Give your money an agent
              <br />
              that remembers.
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-[15px] text-muted-foreground">
              Set the rules once. Pact remembers them every time.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-[13px] font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-accent/20"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="https://github.com/Saber1Y/Pact"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                View documentation
              </a>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Pact" width={22} height={22} className="rounded-md" />
            <span className="text-[13px] font-semibold text-muted-foreground">Pact</span>
          </div>

          <div className="flex gap-5 text-[12px] text-muted-foreground">
            {["Product", "Memory", "Security", "GitHub"].map((item) => (
              <a
                key={item}
                href={item === "GitHub" ? "https://github.com/Saber1Y/Pact" : `#${item.toLowerCase()}`}
                target={item === "GitHub" ? "_blank" : undefined}
                rel={item === "GitHub" ? "noreferrer" : undefined}
                className="transition-colors hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            AI financial autonomy with persistent memory.
          </p>
        </div>
      </footer>
    </div>
  );
}
