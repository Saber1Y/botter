"use client";

import { Sidebar } from "@/components/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        {/* Ambient fading pattern */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #6366f1 0.6px, transparent 0.6px)",
              backgroundSize: "26px 26px",
              maskImage:
                "radial-gradient(ellipse 60% 50% at 50% 0%, black 0%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 50% at 50% 0%, black 0%, transparent 70%)",
            }}
          />
        </div>
        <div className="relative z-10 h-full">{children}</div>
      </main>
    </div>
  );
}
