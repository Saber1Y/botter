"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { api, VaultStatus } from "@/lib/api";
import { motion } from "framer-motion";
import { Loader2, ExternalLink } from "lucide-react";

interface VaultGateProps {
  children: React.ReactNode;
}

export function VaultGate({ children }: VaultGateProps) {
  const { address, isConnected } = useAccount();
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }

    api
      .getVaultStatus(address as string)
      .then(setVaultStatus)
      .catch(() => setVaultStatus({ has_vault: false }))
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[13px] text-muted-foreground">Connect your wallet to continue</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!vaultStatus?.has_vault) {
    return (
      <DeployVaultPrompt
        onDeployed={() => {
          setLoading(true);
          api.getVaultStatus(address as string).then(setVaultStatus).finally(() => setLoading(false));
        }}
      />
    );
  }

  if (vaultStatus.balance === 0) {
    return (
      <FundVaultPrompt
        vaultAddress={vaultStatus.vault_address!}
        onFunded={() => {
          setLoading(true);
          api.getVaultStatus(address as string).then(setVaultStatus).finally(() => setLoading(false));
        }}
      />
    );
  }

  return <>{children}</>;
}

function DeployVaultPrompt({ onDeployed }: { onDeployed: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDeploy = () => {
    setLoading(true);
    const factoryAddress = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";
    window.open(
      `https://sepolia.basescan.org/address/${factoryAddress}#writeContract`,
      "_blank"
    );
    // Optimistically assume deploy succeeded after a delay
    setTimeout(() => {
      setLoading(false);
      onDeployed();
    }, 5000);
  };

  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-sm w-full mx-4"
      >
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          Deploy your vault
        </h1>
        <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
          Create a personal PactVault on Base Sepolia.
          This is where your USDC lives and where Pact executes payments.
        </p>

        <button
          onClick={handleDeploy}
          disabled={loading}
          className="w-full rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Waiting for confirmation...
            </span>
          ) : (
            "Deploy my vault"
          )}
        </button>

        <p className="mt-4 text-[11px] text-muted-foreground/60">
          Opens BaseScan - connect your wallet and call{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">createVault()</code>
        </p>
      </motion.div>
    </div>
  );
}

function FundVaultPrompt({
  vaultAddress,
  onFunded,
}: {
  vaultAddress: string;
  onFunded: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-sm w-full mx-4"
      >
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          Fund your vault
        </h1>
        <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
          Send USDC on Base Sepolia to your vault address, then click below.
        </p>

        <div className="mb-4 rounded-xl border border-border bg-muted/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
            Vault address
          </p>
          <p className="text-[12px] font-mono text-foreground break-all leading-relaxed">
            {vaultAddress}
          </p>
        </div>

        <a
          href={`https://sepolia.basescan.org/address/${vaultAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View on BaseScan
        </a>

        <button
          onClick={onFunded}
          className="w-full rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-all hover:opacity-90"
        >
          I've deposited USDC
        </button>
      </motion.div>
    </div>
  );
}
