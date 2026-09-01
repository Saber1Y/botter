"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="max-w-3xl"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">
              Powered by Persistent Memory
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-semibold tracking-tight text-zinc-100 leading-[1.05] mb-6"
          >
            Your money.
            <br />
            Your rules.
            <br />
            <span className="text-zinc-500">Remembered.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed"
          >
            Pact is an AI financial agent that learns your spending rules, goals,
            and preferences - then remembers them before it acts. Never repeat
            yourself to your money agent again.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Dashboard
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="ml-0.5"
              >
                <path
                  d="M1 7h12m0 0L8.5 2.5M13 7l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div className="text-xs text-zinc-600 flex items-center gap-2">
              <span>or connect your wallet</span>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6"
          >
            <ConnectButton chainStatus="icon" showBalance={false} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Teach Pact your rules",
      desc: "Tell Pact your spending limits, trusted merchants, and financial goals. It stores them as persistent memory.",
      example: '"You can spend up to $100 without asking me."',
    },
    {
      num: "02",
      title: "Pact remembers across sessions",
      desc: "Close the app. Come back tomorrow. Pact still knows your rules. No repetition required.",
      example: "Memory persists via Sibyl across every session.",
    },
    {
      num: "03",
      title: "Pact acts on your behalf",
      desc: "Request a payment. Pact checks your rules, makes a decision, and explains why.",
      example: '"Acme is trusted, but this exceeds your $100 limit."',
    },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight mb-4">
            The loop that changes everything
          </h2>
          <p className="text-zinc-500 max-w-lg">
            Memory feeds reasoning. Reasoning feeds policy. Policy feeds action.
            Action feeds memory back.
          </p>
        </motion.div>

        <div className="space-y-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid md:grid-cols-[80px_1fr_1fr] gap-6 md:gap-12 items-start"
            >
              <div className="text-4xl font-semibold text-zinc-800 tabular-nums">
                {step.num}
              </div>
              <div>
                <h3 className="text-xl font-medium text-zinc-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <code className="text-sm text-zinc-400 font-mono">
                  {step.example}
                </code>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "AI Financial Chat",
      desc: "Natural language interface. Ask Pact anything about your finances.",
      icon: "⬡",
    },
    {
      title: "Persistent Memory",
      desc: "Rules, goals, preferences, merchant history - all remembered across sessions.",
      icon: "◎",
    },
    {
      title: "Policy Engine",
      desc: "Every decision is validated against your memory before execution.",
      icon: "◈",
    },
    {
      title: "Autonomous Payments",
      desc: "Execute USDC payments on Base Sepolia within your defined limits.",
      icon: "◇",
    },
    {
      title: "Explainable Decisions",
      desc: "Every action shows exactly which memories influenced the decision.",
      icon: "⊙",
    },
    {
      title: "Financial Goals",
      desc: "Set savings targets. Pact considers them before approving spend.",
      icon: "△",
    },
  ];

  return (
    <section className="py-32 px-6 bg-zinc-900/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight mb-4">
            Built for control, not just convenience
          </h2>
          <p className="text-zinc-500 max-w-lg">
            Every feature reinforces one principle: the agent acts within your
            boundaries.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/50 rounded-2xl overflow-hidden">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-zinc-950 p-8 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="text-2xl mb-4 text-zinc-600">{feature.icon}</div>
              <h3 className="text-sm font-medium text-zinc-200 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight mb-4">
            See it in action
          </h2>
          <p className="text-zinc-500 max-w-lg">
            The same agent makes different decisions because it remembers what
            you told it before.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <div>
                <div className="text-sm text-zinc-200 font-medium">
                  Auto-approved
                </div>
                <div className="text-xs text-zinc-500">
                  Below $100 limit
                </div>
              </div>
              <div className="ml-auto text-sm text-zinc-300">$60</div>
            </div>
            <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm space-y-2">
              <div className="text-zinc-500">
                <span className="text-zinc-600">You:</span> Pay Acme $60
              </div>
              <div className="text-zinc-400">
                <span className="text-green-500/70">Pact:</span> Acme is a
                trusted merchant and $60 is below your $100 autonomous limit.
              </div>
              <div className="text-zinc-600 text-xs pt-2 border-t border-zinc-800">
                🧠 Used 2 memories: spending_limit, merchant_acme
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <span className="text-amber-400 text-sm">⚠</span>
              </div>
              <div>
                <div className="text-sm text-zinc-200 font-medium">
                  Approval required
                </div>
                <div className="text-xs text-zinc-500">
                  Above $100 limit
                </div>
              </div>
              <div className="ml-auto text-sm text-zinc-300">$150</div>
            </div>
            <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm space-y-2">
              <div className="text-zinc-500">
                <span className="text-zinc-600">You:</span> Pay Acme $150
              </div>
              <div className="text-zinc-400">
                <span className="text-amber-500/70">Pact:</span> Acme is
                trusted, but you previously told me not to automatically spend
                more than $100.
              </div>
              <div className="text-zinc-600 text-xs pt-2 border-t border-zinc-800">
                🧠 Used 2 memories: spending_limit, merchant_acme
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section className="py-24 px-6 border-t border-zinc-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-xl font-medium text-zinc-100 mb-2">
              Built on
            </h2>
            <p className="text-sm text-zinc-500">
              Persistent memory. Economic execution. Real payments.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500/50" />
              Sibyl Memory
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400/50" />
              Base Sepolia
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500/50" />
              OpenAI
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500/50" />
              USDC
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight mb-6">
            Ready to meet your agent?
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-10">
            Connect your wallet on Base Sepolia and teach Pact your first
            financial rule.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-8 py-3.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Pact
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="ml-0.5"
              >
                <path
                  d="M1 7h12m0 0L8.5 2.5M13 7l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-zinc-800/50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-400">Pact</span>
          <span className="text-xs text-zinc-600">
            Your money. Your rules. Remembered.
          </span>
        </div>
        <div className="text-xs text-zinc-600">
          An AI financial agent powered by persistent memory.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      <Hero />
      <HowItWorks />
      <Features />
      <Demo />
      <Stack />
      <CTA />
      <Footer />
    </div>
  );
}
