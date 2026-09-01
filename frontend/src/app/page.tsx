"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
      <div className="text-center max-w-lg px-6">
        <div className="text-6xl mb-6 opacity-80">⬡</div>
        <h1 className="text-4xl font-semibold text-zinc-100 mb-3">Pact</h1>
        <p className="text-lg text-zinc-400 mb-2">
          Your money. Your rules. Remembered.
        </p>
        <p className="text-sm text-zinc-600 mb-8">
          An AI financial agent powered by persistent memory.
        </p>

        <div className="mb-8">
          <ConnectButton />
        </div>

        <Link
          href="/"
          className="inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          Enter Dashboard
        </Link>
      </div>
    </div>
  );
}
