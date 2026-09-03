const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  response: string;
  intent: string;
  decision?: "APPROVE" | "REQUIRE_APPROVAL" | "DENY";
  payment?: {
    recipient: string;
    amount: string;
    token: string;
    reason: string;
    memory_references: string[];
    tx_hash?: string;
    status?: string;
  };
  memory_stored: string[];
}

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
  ts: number;
  intent?: string;
  decision?: string;
  payment?: {
    recipient: string;
    amount: string;
    token: string;
    reason: string;
    memory_references: string[];
    tx_hash?: string;
    status?: string;
  };
}

export interface Memory {
  key: string;
  category: string;
  value: Record<string, unknown>;
}

export interface Goal {
  name: string;
  target: number;
  current: number;
  progress: number;
}

export interface Payment {
  id: string;
  recipient: string;
  amount: string;
  token: string;
  decision: string;
  reason: string;
  tx_hash?: string;
  status: string;
  memory_references: string[];
  timestamp: string;
}

export interface VaultInfo {
  balance: number;
  daily_remaining: number;
  max_per_transaction: number;
  daily_limit: number;
  owner?: string;
  agent?: string;
}

export interface VaultStatus {
  has_vault: boolean;
  vault_address?: string;
  balance?: number;
  daily_remaining?: number;
  max_per_transaction?: number;
  daily_limit?: number;
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${res.status} - ${error}`);
  }

  return res.json();
}

export const api = {
  // Chat
  chat: (message: string, wallet?: string) =>
    fetchAPI<ChatMessage>(`/chat${wallet ? `?wallet=${wallet}` : ""}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getChatHistory: (wallet?: string) =>
    fetchAPI<ChatHistoryEntry[]>(`/chat/history${wallet ? `?wallet=${wallet}` : ""}`),

  // Memory
  getMemory: (category?: string, wallet?: string) =>
    fetchAPI<Memory[]>(`/memory${category ? `?category=${category}` : ""}${wallet ? `&wallet=${wallet}` : ""}`),

  // Rules
  getRules: (wallet?: string) =>
    fetchAPI<Record<string, unknown>[]>(`/rules${wallet ? `?wallet=${wallet}` : ""}`),
  setRule: (type: string, value: string, wallet?: string) =>
    fetchAPI(`/rules${wallet ? `?wallet=${wallet}` : ""}`, {
      method: "POST",
      body: JSON.stringify({ type, value }),
    }),

  // Goals
  getGoals: (wallet?: string) =>
    fetchAPI<Goal[]>(`/goals${wallet ? `?wallet=${wallet}` : ""}`),
  createGoal: (name: string, target: number, wallet?: string) =>
    fetchAPI<Goal>(`/goals${wallet ? `?wallet=${wallet}` : ""}`, {
      method: "POST",
      body: JSON.stringify({ name, target }),
    }),

  // Payments
  getPayments: (wallet?: string) =>
    fetchAPI<Payment[]>(`/payments${wallet ? `?wallet=${wallet}` : ""}`),

  // Vault
  getVaultStatus: (wallet: string) =>
    fetchAPI<VaultStatus>(`/vault/status?wallet=${wallet}`),
  getVault: (wallet: string) =>
    fetchAPI<VaultInfo>(`/vault?wallet=${wallet}`),
};
