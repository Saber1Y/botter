"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { BOTTER_VAULT_ABI, ERC20_ABI, TOKEN_ADDRESS } from "@/lib/abis";
import { Loader2, Wallet, ShieldCheck } from "lucide-react";

function toTokenUnits(amount: string, decimals = 6): bigint {
  const trimmed = amount.trim();
  if (!trimmed || isNaN(parseFloat(trimmed))) return BigInt("0");
  const [whole = "0", frac = ""] = trimmed.split(".");
  const padded = frac.padEnd(decimals, "0").slice(0, decimals);
  const multiplier = BigInt("10") ** BigInt(decimals);
  return BigInt(whole || "0") * multiplier + (padded ? BigInt(padded) : BigInt("0"));
}

type Step = "idle" | "approving" | "depositing" | "confirming";

export function VaultDeposit({
  vaultAddress,
  onDeposited,
}: {
  vaultAddress: string;
  onDeposited: () => void;
}) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const vault = vaultAddress as `0x${string}`;
  const token = TOKEN_ADDRESS as `0x${string}`;

  const { data: vaultBalance } = useReadContract({
    address: vault,
    abi: BOTTER_VAULT_ABI,
    functionName: "getBalance",
  });

  const { data: tokenBalance } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: allowance } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && vault ? [address, vault] : undefined,
  });

  const { writeContractAsync } = useWriteContract();

  const amountUnits = useMemo(() => toTokenUnits(amount), [amount]);
  const needsApproval = (allowance ?? BigInt("0")) < amountUnits;
  const insufficientBalance = amountUnits > (tokenBalance ?? BigInt("0"));

  const busy = step !== "idle";

  const handleSubmit = async () => {
    if (!isConnected || !address || amountUnits <= BigInt("0") || busy || insufficientBalance) return;
    setError(null);
    try {
      if (needsApproval) {
        setStep("approving");
        const approveHash = await writeContractAsync({
          address: token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [vault, amountUnits],
        });
        setStep("depositing");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      setStep("depositing");
      const depositHash = await writeContractAsync({
        address: vault,
        abi: BOTTER_VAULT_ABI,
        functionName: "deposit",
        args: [amountUnits],
      });
      setStep("confirming");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: depositHash });
      }

      onDeposited();
      setAmount("");
      setStep("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("rejected") || message.includes("User denied")
          ? "Transaction rejected in wallet"
          : "Transaction failed. Please retry."
      );
      setStep("idle");
    }
  };

  const stepLabel = () => {
    if (step === "approving") return "Approve USDT...";
    if (step === "depositing") return "Deposit in wallet...";
    if (step === "confirming") return "Confirming...";
    return needsApproval ? "Approve & deposit" : "Deposit USDT";
  };

  const disabled = busy || !isConnected || amountUnits <= BigInt("0") || insufficientBalance;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wallet className="h-3.5 w-3.5 text-accent" />
        <p className="text-[11px] font-medium text-foreground">Deposit USDT from your wallet</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          Your balance:{" "}
          <span className="font-mono text-foreground">
            {tokenBalance === undefined ? "…" : formatUnits(tokenBalance, 6)}
          </span>{" "}
          USDT
        </span>
        <span>
          In vault:{" "}
          <span className="font-mono text-foreground">
            {vaultBalance === undefined ? "…" : formatUnits(vaultBalance, 6)}
          </span>{" "}
          USDT
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(evt) => setAmount(evt.target.value)}
            placeholder="Amount"
            disabled={busy}
            aria-label="Deposit amount in USDT"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-14 text-[13px] text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:border-accent/30 focus:ring-2 focus:ring-accent/10 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() =>
              setAmount(tokenBalance === undefined ? "" : formatUnits(tokenBalance, 6))
            }
            disabled={busy || tokenBalance === undefined}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
          >
            MAX
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-[12px] font-medium text-background transition-all hover:opacity-90 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {stepLabel()}
        </button>
      </div>

      {insufficientBalance && amountUnits > BigInt("0") && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-red-500">
          Insufficient USDT balance in your wallet
        </p>
      )}
      {needsApproval && amountUnits > BigInt("0") && !busy && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-accent" />
          This will ask you to approve USDT, then deposit it into your vault (2 transactions)
        </p>
      )}
      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}