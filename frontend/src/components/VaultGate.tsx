"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { api, VaultStatus } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Loader2,
  ExternalLink,
  ArrowRight,
  Wallet,
  CheckCircle2,
} from "lucide-react";

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
        <div className="text-center">
          <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-[13px] text-muted-foreground">Connect your wallet to continue</p>
        </div>
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
    return <DeployVaultPrompt address={address as string} onDeployed={() => {
      setLoading(true);
      api.getVaultStatus(address as string).then(setVaultStatus).finally(() => setLoading(false));
    }} />;
  }

  if (vaultStatus.balance === 0) {
    return <FundVaultPrompt address={address as string} vaultAddress={vaultStatus.vault_address!} onFunded={() => {
      setLoading(true);
      api.getVaultStatus(address as string).then(setVaultStatus).finally(() => setLoading(false));
    }} />;
  }

  return <>{children}</>;
}

function DeployVaultPrompt({
  address,
  onDeployed,
}: {
  address: string;
  onDeployed: () => void;
}) {
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = () => {
    // Open BaseScan to the factory contract for manual interaction
    // In production, this would call writeContract via wagmi
    const factoryAddress = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";
    window.open(
      `https://sepolia.basescan.org/address/${factoryAddress}#writeContract`,
      "_blank"
    );
  };

  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Deploy Your Vault</h2>
          <p className="mb-6 text-[13px] text-muted-foreground leading-relaxed">
            Create your personal PactVault on Base Sepolia.
            This is where your USDC lives and where the AI executes payments.
          </p>

          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[13px] font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50"
          >
            {deploying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Deploy My Vault
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-[11px] text-red-500">{error}</p>
          )}

          <p className="mt-4 text-[10px] text-muted-foreground/60">
            Opens BaseScan - connect your wallet and call createVault()
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function FundVaultPrompt({
  address,
  vaultAddress,
  onFunded,
}: {
  address: string;
  vaultAddress: string;
  onFunded: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Vault Deployed</h2>
          <p className="mb-4 text-[13px] text-muted-foreground leading-relaxed">
            Your vault is live. Now deposit USDC to start making payments.
          </p>

          <div className="mb-6 rounded-xl bg-muted p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Your Vault</p>
            <p className="text-[11px] font-mono text-foreground break-all">{vaultAddress}</p>
          </div>

          <a
            href={`https://sepolia.basescan.org/address/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center justify-center gap-1.5 text-[12px] text-accent hover:text-accent/80 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View on BaseScan
          </a>

          <button
            onClick={onFunded}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[13px] font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-accent/20"
          >
            <Wallet className="h-4 w-4" />
            I've deposited USDC
            <ArrowRight className="h-3 w-3" />
          </button>

          <p className="mt-3 text-[10px] text-muted-foreground/60">
            Send USDC on Base Sepolia to the address above
          </p>
        </div>
      </motion.div>
    </div>
  );
}
