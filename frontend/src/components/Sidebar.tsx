"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navItems = [
  { href: "/", label: "Overview", icon: "◈" },
  { href: "/chat", label: "AI CFO", icon: "⬡" },
  { href: "/memory", label: "Memory", icon: "◎" },
  { href: "/goals", label: "Goals", icon: "◇" },
  { href: "/payments", label: "Payments", icon: "≡" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          Pact
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Your rules. Remembered.
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 mb-2">Wallet</div>
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus="address"
        />
      </div>
    </aside>
  );
}
