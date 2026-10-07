"use client";

import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { api, VaultStatus } from "@/lib/api";
import { VAULT_FACTORY_ABI } from "@/lib/abis";
import { VaultDeposit } from "@/components/VaultDeposit";
import { motion } from "framer-motion";
import { Loader2, ExternalLink } from "lucide-react";

interface VaultGateProps {
  children: React.ReactNode;
}

export function VaultGate({ children }: VaultGateProps) {
  const { address, isConnected } = useAccount();
  const [vaultStatus, setVaultStatus] = useState<{ owner: string; status: VaultStatus } | null>(null);

  const refresh = () => {
    if (!address) return;
    const owner = address;
    api.getVaultStatus(owner)
      .then((status) => setVaultStatus({ owner, status }))
      .catch(() => setVaultStatus({ owner, status: { has_vault: false } }));
  };

  useEffect(() => {
    if (!isConnected || !address) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const status = vaultStatus && vaultStatus.owner === address ? vaultStatus.status : null;
  const loading = isConnected && !!address && status === null;

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

  if (!status?.has_vault) {
    return <DeployVaultPrompt onDeployed={refresh} />;
  }

  if (status.balance === 0) {
    return <FundVaultPrompt vaultAddress={status.vault_address!} onFunded={refresh} />;
  }

  return <>{children}</>;
}

function DeployVaultPrompt({ onDeployed }: { onDeployed: () => void }) {
  const factoryAddress = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}` | undefined;

  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConfirmed) {
      onDeployed();
    }
  }, [isConfirmed, onDeployed]);

  const handleDeploy = () => {
    if (!factoryAddress) return;
    writeContract({
      address: factoryAddress,
      abi: VAULT_FACTORY_ABI,
      functionName: "createVault",
    });
  };

  const deploying = isPending || isConfirming;

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
          Create a personal BotterVault on BOT Chain Testnet.
          This is where your USDT lives and where Botter executes payments.
        </p>

        <button
          onClick={handleDeploy}
          disabled={deploying || !factoryAddress}
          className="w-full rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Confirm in wallet...
            </span>
          ) : isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Deploying...
            </span>
          ) : (
            "Deploy my vault"
          )}
        </button>

        {error && (
          <p className="mt-3 text-[11px] text-red-500">
            {error.message?.includes("User rejected") ? "Transaction rejected" : "Deployment failed"}
          </p>
        )}

        {!factoryAddress && (
          <p className="mt-3 text-[11px] text-amber-600">
            Factory address not configured
          </p>
        )}
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
        className="max-w-md w-full mx-4"
      >
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          Fund your vault
        </h1>
        <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
          Deposit USDT into your vault so Botter can execute approved payments up to your limits.
        </p>

        <div className="mb-4 rounded-xl border border-border bg-muted/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
            Vault address
          </p>
          <p className="text-[12px] font-mono text-foreground break-all leading-relaxed">
            {vaultAddress}
          </p>
        </div>

        <div className="mb-3">
          <VaultDeposit vaultAddress={vaultAddress} onDeposited={onFunded} />
        </div>

        <div className="flex items-center justify-between">
          <a
            href={`https://scan.bohr.life/address/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View on BOTScan
          </a>
          <button
            onClick={onFunded}
            className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            I&apos;ve deposited elsewhere - refresh
          </button>
        </div>
      </motion.div>
    </div>
  );
}
