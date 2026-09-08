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
from uuid import uuid4
from typing import Any, Optional

from sibyl_memory_client import MemoryClient


class MemoryUnavailable(RuntimeError):
    """Raised when Sibyl cannot be reached for a required operation."""


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
            try:
                self._clients[tenant] = MemoryClient.local(
                    self._db_path,
                    tenant_id=tenant,
                )
            except Exception as exc:
                raise MemoryUnavailable("Sibyl memory is unavailable") from exc
        return self._clients[tenant]

    @staticmethod
    def _required(operation):
        """Translate SDK failures into a stable outage signal."""
        try:
            return operation()
        except MemoryUnavailable:
            raise
        except Exception as exc:
            raise MemoryUnavailable("Sibyl memory is unavailable") from exc

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
        return self._required(
            lambda: client.set_entity(
                "rules",
                name,
                {
                    "type": rule_type,
                    "value": value,
                    "updated_at": time.time(),
                },
            )
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
                "memory_id": f"rules:{e.get('name', '')}",
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
        return self._required(
            lambda: client.set_entity(
                "goals",
                name,
                {
                    "name": name,
                    "target": target,
                    "current": current,
                    "updated_at": time.time(),
                },
            )
        )

    def get_goals(self, wallet: str) -> list[dict]:
        """Get all goals for a user."""
        client = self._client(wallet)
        entities = client.list_entities("goals")
        return [
            {
                **e.get("body", {}),
                "memory_id": f"goals:{e.get('name', '')}",
            }
            for e in entities
            if e.get("status") != "archived"
        ]

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
        return self._required(
            lambda: client.set_entity(
                "policy_facts",
                fact_id,
                {**fact, "updated_at": time.time()},
            )
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
        memory_references: list[str] | None = None,
    ) -> dict:
        """Store a payment decision as a searchable WARM fact.

        This lets the agent reason about past decisions later,
        e.g. "user rejected Acme twice last month".
        """
        client = self._client(wallet)
        return self._required(
            lambda: client.set_entity(
                "decisions",
                decision_id,
                {
                    "recipient": recipient,
                    "amount": amount,
                    "decision": decision,
                    "reason": reason,
                    "merchant": merchant,
                    "memory_references": memory_references or [],
                    "decision_id": decision_id,
                    "ts": time.time(),
                },
            )
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
        return [
            {
                **r.get("body", {}),
                "memory_id": f"decisions:{r.get('name', '')}",
            }
            for r in results
        ]

    def get_decision(self, wallet: str, decision_id: str) -> Optional[dict]:
        """Get one decision by its stable audit ID."""
        client = self._client(wallet)
        entity = client.get_entity("decisions", decision_id)
        if not entity or entity.get("status") == "archived":
            return None
        return {
            **entity.get("body", {}),
            "memory_id": f"decisions:{decision_id}",
        }

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
        decision_id: str = "",
        memory_references: list[str] | None = None,
        memory_details: list[dict] | None = None,
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
            "decision_id": decision_id,
            "memory_references": memory_references or [],
            "memory_details": memory_details or [],
            "ts": time.time(),
        }
        return self._required(
            lambda: client.write_event(
                acted=[f"Payment {decision}: {amount} {token} to {recipient}"],
                extra=event,
            )
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
                payments.append({
                    **extra,
                    "memory_id": f"payments:{ev.get('id', ev.get('event_id', ''))}",
                })
        return payments

    def get_all_policy_facts(self, wallet: str) -> list[dict]:
        """Get merchant and policy facts stored in Sibyl WARM memory."""
        client = self._client(wallet)
        entities = client.list_entities("policy_facts")
        return [
            {
                **e.get("body", {}),
                "memory_id": f"policy_facts:{e.get('name', '')}",
            }
            for e in entities
            if e.get("status") != "archived"
        ]

    # ─── HOT: Session state ─────────────────────────────────────

    def create_chat_session(self, wallet: str, name: str | None = None) -> dict:
        """Create a named chat session in the wallet's Sibyl tenant."""
        now = time.time()
        session_id = uuid4().hex
        body = {
            "name": name or "New conversation",
            "created_at": now,
            "updated_at": now,
        }
        client = self._client(wallet)
        self._required(lambda: client.set_entity("chat_sessions", session_id, body))
        return {"id": session_id, **body}

    def get_chat_sessions(self, wallet: str) -> list[dict]:
        """List chat sessions ordered by most recently updated."""
        client = self._client(wallet)
        entities = client.list_entities("chat_sessions")
        sessions = [
            {
                "id": e.get("name", ""),
                **e.get("body", {}),
            }
            for e in entities
            if e.get("status") != "archived"
        ]
        return sorted(sessions, key=lambda session: session.get("updated_at", 0), reverse=True)

    def touch_chat_session(self, wallet: str, session_id: str) -> None:
        """Update the last-used timestamp for a chat session."""
        client = self._client(wallet)
        entity = client.get_entity("chat_sessions", session_id)
        if entity:
            body = {**entity.get("body", {}), "updated_at": time.time()}
            self._required(lambda: client.set_entity("chat_sessions", session_id, body))

    def delete_chat_session(self, wallet: str, session_id: str) -> None:
        """Delete a session and all chat messages assigned to it."""
        client = self._client(wallet)
        entities = client.list_entities("chat_history")
        for entity in entities:
            body = entity.get("body", {})
            if body.get("session_id", "default") == session_id:
                self._required(lambda entity=entity: client.delete_entity("chat_history", entity.get("name", "")))
        if session_id != "default":
            self._required(lambda: client.delete_entity("chat_sessions", session_id))

    def truncate_chat_history(self, wallet: str, session_id: str, from_ts: float) -> None:
        """Remove a message and everything after it in one chat session."""
        client = self._client(wallet)
        entities = client.list_entities("chat_history")
        for entity in entities:
            body = entity.get("body", {})
            if (
                body.get("session_id", "default") == session_id
                and float(body.get("ts", 0)) >= from_ts
            ):
                self._required(lambda entity=entity: client.delete_entity("chat_history", entity.get("name", "")))

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
        policy_facts = self.get_all_policy_facts(wallet)

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
            "policy_facts": policy_facts,
            "memory_records": [
                *[
                    {
                        "id": rule.get("memory_id", f"rules:{rule.get('key', '')}"),
                        "category": "rules",
                        "label": rule.get("key", "rule"),
                        "value": rule.get("value", {}),
                    }
                    for rule in rules
                ],
                *[
                    {
                        "id": goal.get("memory_id", f"goals:{goal.get('name', '')}"),
                        "category": "goals",
                        "label": goal.get("name", "goal"),
                        "value": goal,
                    }
                    for goal in goals
                ],
                *[
                    {
                        "id": decision.get("memory_id", f"decisions:{decision.get('decision_id', '')}"),
                        "category": "decisions",
                        "label": decision.get("recipient", "decision"),
                        "value": decision,
                    }
                    for decision in decisions
                ],
                *[
                    {
                        "id": payment.get("memory_id", f"payments:{i}"),
                        "category": "payments",
                        "label": payment.get("recipient", "payment"),
                        "value": payment,
                    }
                    for i, payment in enumerate(recent_payments)
                ],
                *[
                    {
                        "id": fact.get("memory_id", f"policy_facts:{i}"),
                        "category": "policy_facts",
                        "label": fact.get("merchant", fact.get("recipient", "merchant")),
                        "value": fact,
                    }
                    for i, fact in enumerate(policy_facts)
                ],
            ],
        }

    def format_for_llm(self, wallet: str, context: dict | None = None) -> str:
        """Format memory context into a readable string for the LLM."""
        ctx = context or self.get_memory_context(wallet)
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
        for fact in ctx.get("policy_facts", [])[:10]:
            merchant = fact.get("merchant", fact.get("recipient", "unknown"))
            lines.append(
                f"- Merchant history: {merchant} - "
                f"{fact.get('approved_count', 0)} approved, "
                f"{fact.get('denied_count', 0)} denied"
            )

        return "\n".join(lines) if lines else "No memories stored yet."


# Singleton
memory = PactMemory()
