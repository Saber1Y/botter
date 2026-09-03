"""PactMemory - persistent agent memory backed by Sibyl Memory SDK.

Architecture:
  WARM entities → rules, goals, trusted/blocked merchants, policy facts
  HOT state     → current session context
  COLD journal  → approvals, payments, transaction history

Tenant isolation:
  Each wallet gets its own memory namespace: pact_<lowercase_address>
"""

from __future__ import annotations

import hashlib
import time
from typing import Any, Optional

from sibyl_memory_client import MemoryClient


def _normalize_wallet(wallet: str) -> str:
    """Normalize a wallet address to a stable tenant ID.

    0xAbCd... → pact_0xabcd...
    """
    clean = wallet.strip().lower()
    if clean.startswith("0x"):
        clean = clean[2:]
    return f"pact_{clean}"


class PactMemory:
    """Persistent financial memory for Pact, built on Sibyl Memory SDK.

    Maps Pact's domain onto Sibyl's five-tier model:
      WARM  → rules, goals, trusted/blocked merchants, policy facts
      HOT   → current session state
      COLD  → payment events, approvals, transaction history
    """

    def __init__(self, db_path: str = "~/.sibyl-memory/memory.db"):
        self._db_path = db_path
        self._clients: dict[str, MemoryClient] = {}

    def _client(self, wallet: str) -> MemoryClient:
        """Get or create a MemoryClient for a wallet's tenant."""
        tenant = _normalize_wallet(wallet)
        if tenant not in self._clients:
            self._clients[tenant] = MemoryClient.local(
                self._db_path,
                tenant_id=tenant,
            )
        return self._clients[tenant]

    # ─── WARM: Rules ────────────────────────────────────────────

    def store_rule(
        self,
        wallet: str,
        rule_type: str,
        value: Any,
        *,
        rule_id: str | None = None,
    ) -> dict:
        """Store a financial rule (upsert).

        Uses a stable rule_id so updating $100 → $150 overwrites the
        same entity instead of creating a duplicate.

        Args:
            wallet: User's wallet address.
            rule_type: e.g. "spending_limit", "trusted_merchant", "blocked_merchant".
            value: The rule value (amount, address, etc.).
            rule_id: Stable identifier. Defaults to rule_type.
        """
        client = self._client(wallet)
        name = rule_id or rule_type
        return client.set_entity(
            "rules",
            name,
            {
                "type": rule_type,
                "value": value,
                "updated_at": time.time(),
            },
        )

    def get_rule(self, wallet: str, rule_type: str) -> Optional[dict]:
        """Get a specific rule by type."""
        client = self._client(wallet)
        entity = client.get_entity("rules", rule_type)
        return entity.get("body") if entity else None

    def get_all_rules(self, wallet: str) -> list[dict]:
        """Get all active rules for a user."""
        client = self._client(wallet)
        entities = client.list_entities("rules")
        return [
            {
                "key": e.get("name", ""),
                "value": e.get("body", {}),
            }
            for e in entities
            if e.get("status") != "archived"
        ]

    # ─── WARM: Goals ────────────────────────────────────────────

    def store_goal(
        self,
        wallet: str,
        name: str,
        target: float,
        current: float = 0,
    ) -> dict:
        """Store or update a financial goal (upsert)."""
        client = self._client(wallet)
        return client.set_entity(
            "goals",
            name,
            {
                "name": name,
                "target": target,
                "current": current,
                "updated_at": time.time(),
            },
        )

    def get_goals(self, wallet: str) -> list[dict]:
        """Get all goals for a user."""
        client = self._client(wallet)
        entities = client.list_entities("goals")
        return [e.get("body", {}) for e in entities if e.get("status") != "archived"]

    def delete_goal(self, wallet: str, name: str) -> bool:
        """Delete a goal by name."""
        client = self._client(wallet)
        try:
            client.delete_entity("goals", name)
            return True
        except Exception:
            return False

    # ─── WARM: Policy facts ─────────────────────────────────────

    def store_policy_fact(
        self,
        wallet: str,
        fact_id: str,
        fact: dict,
    ) -> dict:
        """Store a searchable policy-relevant fact.

        Examples:
          "acme_trusted" → {"merchant": "Acme", "trusted": True}
          "acme_rejected_count" → {"merchant": "Acme", "rejections": 2}
        """
        client = self._client(wallet)
        return client.set_entity(
            "policy_facts",
            fact_id,
            {**fact, "updated_at": time.time()},
        )

    def get_policy_fact(self, wallet: str, fact_id: str) -> Optional[dict]:
        """Get a specific policy fact."""
        client = self._client(wallet)
        entity = client.get_entity("policy_facts", fact_id)
        return entity.get("body") if entity else None

    def search_policy_facts(self, wallet: str, query: str) -> list[dict]:
        """Search policy facts by content."""
        client = self._client(wallet)
        results = client.search_entities(query, category="policy_facts")
        return [r.get("body", {}) for r in results]

    # ─── WARM: Decisions (for policy reasoning) ─────────────────

    def store_decision(
        self,
        wallet: str,
        decision_id: str,
        recipient: str,
        amount: str,
        decision: str,
        reason: str,
        merchant: str = "",
    ) -> dict:
        """Store a payment decision as a searchable WARM fact.

        This lets the agent reason about past decisions later,
        e.g. "user rejected Acme twice last month".
        """
        client = self._client(wallet)
        return client.set_entity(
            "decisions",
            decision_id,
            {
                "recipient": recipient,
                "amount": amount,
                "decision": decision,
                "reason": reason,
                "merchant": merchant,
                "ts": time.time(),
            },
        )

    def get_decisions(
        self,
        wallet: str,
        *,
        limit: int = 20,
    ) -> list[dict]:
        """Get recent decisions."""
        client = self._client(wallet)
        results = client.search_entities("decision", category="decisions", limit=limit)
        return [r.get("body", {}) for r in results]

    # ─── COLD: Payment events ───────────────────────────────────

    def record_payment(
        self,
        wallet: str,
        *,
        recipient: str,
        amount: str,
        token: str,
        decision: str,
        tx_hash: str = "",
        merchant: str = "",
        reason: str = "",
    ) -> str:
        """Record a payment event in the COLD journal.

        Structured event for later retrieval and audit.
        """
        client = self._client(wallet)
        event = {
            "type": "payment",
            "amount": amount,
            "token": token,
            "recipient": recipient,
            "merchant": merchant,
            "decision": decision,
            "tx_hash": tx_hash,
            "reason": reason,
        }
        return client.write_event(
            acted=[f"Payment {decision}: {amount} {token} to {recipient}"],
            extra=event,
        )

    def get_payment_events(
        self,
        wallet: str,
        *,
        limit: int = 50,
    ) -> list[dict]:
        """Get recent payment events from the COLD journal."""
        client = self._client(wallet)
        events = client.read_events(limit=limit)
        payments = []
        for ev in events:
            extra = ev.get("extra")
            if isinstance(extra, dict) and extra.get("type") == "payment":
                payments.append(extra)
        return payments

    # ─── HOT: Session state ─────────────────────────────────────

    def set_session_state(self, wallet: str, key: str, value: dict) -> None:
        """Set current session state (HOT tier)."""
        client = self._client(wallet)
        client.set_state(key, value)

    def get_session_state(self, wallet: str, key: str) -> Optional[dict]:
        """Get current session state."""
        client = self._client(wallet)
        return client.get_state(key)

    # ─── Search ─────────────────────────────────────────────────

    def search(self, wallet: str, query: str, *, limit: int = 20) -> list[dict]:
        """Full-text search across all tiers."""
        client = self._client(wallet)
        return client.search(query, limit=limit)

    # ─── Memory context for agent ───────────────────────────────

    def get_memory_context(self, wallet: str) -> dict:
        """Build a complete memory context for the agent.

        Returns a dict with all the information the agent needs
        to make policy decisions.
        """
        rules = self.get_all_rules(wallet)
        goals = self.get_goals(wallet)
        decisions = self.get_decisions(wallet, limit=10)
        recent_payments = self.get_payment_events(wallet, limit=10)

        # Build structured context
        spending_limit = None
        trusted_merchants: list[str] = []
        blocked_merchants: list[str] = []

        for rule in rules:
            body = rule.get("value", {})
            rule_type = body.get("type", "")
            rule_value = body.get("value", "")
            if rule_type == "spending_limit":
                spending_limit = float(rule_value) if rule_value else None
            elif rule_type == "trusted_merchant":
                trusted_merchants.append(str(rule_value))
            elif rule_type == "blocked_merchant":
                blocked_merchants.append(str(rule_value))

        return {
            "spending_limit": spending_limit,
            "trusted_merchants": trusted_merchants,
            "blocked_merchants": blocked_merchants,
            "goals": goals,
            "recent_decisions": decisions,
            "recent_payments": recent_payments,
        }

    def format_for_llm(self, wallet: str) -> str:
        """Format memory context into a readable string for the LLM."""
        ctx = self.get_memory_context(wallet)
        lines = []

        if ctx["spending_limit"] is not None:
            lines.append(f"- Spending limit: ${ctx['spending_limit']:.2f}")
        if ctx["trusted_merchants"]:
            lines.append(f"- Trusted merchants: {', '.join(ctx['trusted_merchants'])}")
        if ctx["blocked_merchants"]:
            lines.append(f"- Blocked merchants: {', '.join(ctx['blocked_merchants'])}")
        for goal in ctx["goals"]:
            name = goal.get("name", "unknown")
            target = goal.get("target", 0)
            current = goal.get("current", 0)
            pct = (current / target * 100) if target else 0
            lines.append(f"- Goal: {name} - ${current:.0f} / ${target:.0f} ({pct:.0f}%)")
        for d in ctx["recent_decisions"][:5]:
            merchant = d.get("merchant", d.get("recipient", "unknown"))
            decision = d.get("decision", "unknown")
            amount = d.get("amount", "?")
            lines.append(f"- Past decision: {decision} ${amount} to {merchant}")

        return "\n".join(lines) if lines else "No memories stored yet."


# Singleton
memory = PactMemory()
