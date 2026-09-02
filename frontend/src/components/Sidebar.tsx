"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  LayoutDashboard,
  Brain,
  Target,
  CreditCard,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/chat", label: "AI CFO", icon: MessageSquare },
  { href: "/app/memory", label: "Memory", icon: Brain },
  { href: "/app/goals", label: "Goals", icon: Target },
  { href: "/app/payments", label: "Payments", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
            <Image src="/logo.svg" alt="Pact" width={16} height={16} />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold tracking-tight text-foreground">Pact</h1>
            <p className="text-[9px] text-muted-foreground">Your rules. Remembered.</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent/10 ring-1 ring-accent/20"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <Sparkles className="h-3 w-3 text-accent/50" />
          <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">Wallet</p>
        </div>
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus="address"
        />
      </div>
    </aside>
  );
}
