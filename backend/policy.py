"""Policy engine for Botter - validates agent decisions against memory and rules."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class Decision(str, Enum):
    APPROVE = "APPROVE"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    DENY = "DENY"


class PolicyDecision(BaseModel):
    decision: Decision
    reason: str
    memory_references: list[str] = []
    memory_details: list[dict] = []


class PaymentRequest(BaseModel):
    recipient: str
    amount: str
    token: str = "USDT"
    merchant: str = ""


class MemoryContext(BaseModel):
    spending_limit: Optional[float] = None
    trusted_merchants: list[str] = []
    blocked_merchants: list[str] = []
    goals: list[dict] = []
    previous_payments: list[dict] = []
    policy_facts: list[dict] = []
    memory_records: list[dict] = []
    preferences: dict = {}


def evaluate_payment(
    request: PaymentRequest,
    context: MemoryContext,
    vault_balance: float = 0,
) -> PolicyDecision:
    """Evaluate a payment request against the user's memory and rules."""

    amount = float(request.amount)

    recipient = request.recipient.lower()
    merchant = request.merchant.lower()
    blocked = [m.lower() for m in context.blocked_merchants]
    trusted = [m.lower() for m in context.trusted_merchants]
    matching_records = [
        record
        for record in context.memory_records
        if record.get("category") in {"rules", "decisions", "payments", "policy_facts"}
        and (
            (
                record.get("category") == "rules"
                and record.get("value", {}).get("type") == "spending_limit"
            )
            or recipient in str(record.get("value", {}).get("recipient", "")).lower()
            or recipient in str(record.get("value", {}).get("value", "")).lower()
            or (
                merchant
                and merchant in str(record.get("value", {}).get("merchant", "")).lower()
            )
        )
    ]
    references = [str(record["id"]) for record in matching_records if record.get("id")]

    # Check if merchant or recipient is blocked.
    if recipient in blocked or (merchant and merchant in blocked):
        return PolicyDecision(
            decision=Decision.DENY,
            reason=f"Merchant {request.merchant or request.recipient} is blocked by your rules.",
            memory_references=references or ["rules:blocked_merchant"],
            memory_details=matching_records,
        )

    # Check if merchant is trusted and within limit
    is_trusted = recipient in trusted or (merchant and merchant in trusted)

    prior_payments = [
        payment
        for payment in context.previous_payments
        if recipient == str(payment.get("recipient", "")).lower()
        or (merchant and merchant == str(payment.get("merchant", "")).lower())
    ]
    merchant_fact = next(
        (
            fact
            for fact in context.policy_facts
            if recipient == str(fact.get("recipient", "")).lower()
            or (merchant and merchant == str(fact.get("merchant", "")).lower())
        ),
        None,
    )
    has_approved_history = any(
        payment.get("decision", "").upper() in {"APPROVE", "APPROVED"}
        for payment in prior_payments
    )
    has_approved_fact = bool(merchant_fact and merchant_fact.get("approved_count", 0) > 0)
    is_known = has_approved_history or has_approved_fact

    # Check spending limit
    if context.spending_limit is not None:
        if amount > context.spending_limit:
            # Above limit - require approval regardless of trust status
            return PolicyDecision(
                decision=Decision.REQUIRE_APPROVAL,
                reason=(
                    f"{request.recipient} is {'a trusted merchant' if is_trusted else 'not a trusted merchant'}, "
                    f"but this exceeds your ${context.spending_limit:.0f} autonomous spending limit "
                    f"by ${amount - context.spending_limit:.0f}."
                ),
                memory_references=references or ["rules:spending_limit"],
                memory_details=matching_records,
            )

    # Check vault balance
    if amount > vault_balance:
        return PolicyDecision(
            decision=Decision.DENY,
            reason=f"Insufficient vault balance. You have ${vault_balance:.2f} but need ${amount:.2f}.",
            memory_references=["vault_balance"],
            memory_details=matching_records,
        )

    # Protect an unfinished goal from large discretionary payments.
    active_goal = next(
        (
            goal
            for goal in context.goals
            if float(goal.get("target", 0) or 0) > float(goal.get("current", 0) or 0)
        ),
        None,
    )
    if active_goal:
        remaining = float(active_goal.get("target", 0)) - float(active_goal.get("current", 0))
        goal_threshold = max(remaining * 0.10, 25.0)
        if amount > goal_threshold:
            goal_id = f"goals:{active_goal.get('name', 'active')}"
            return PolicyDecision(
                decision=Decision.REQUIRE_APPROVAL,
                reason=(
                    f"This ${amount:.2f} payment would use more than 10% of the "
                    f"${remaining:.0f} remaining for your {active_goal.get('name', 'active')} goal."
                ),
                memory_references=[*references, goal_id] or [goal_id],
                memory_details=matching_records + [{
                    "id": goal_id,
                    "category": "goals",
                    "label": active_goal.get("name", "goal"),
                    "value": active_goal,
                }],
            )

    # A new recipient is never auto-approved solely because it is below the limit.
    if not is_trusted and not is_known:
        return PolicyDecision(
            decision=Decision.REQUIRE_APPROVAL,
            reason=f"{request.merchant or request.recipient} is new to your payment history and needs approval.",
            memory_references=references,
            memory_details=matching_records,
        )

    # Within limit and has balance - auto-approve
    return PolicyDecision(
        decision=Decision.APPROVE,
        reason=(
            f"{request.merchant or request.recipient} is {'a trusted merchant' if is_trusted else 'known from your payment history'} "
            f"and ${amount:.2f} is below your ${context.spending_limit or 0:.0f} autonomous limit."
        ),
        memory_references=references or ["rules:spending_limit"],
        memory_details=matching_records,
    )
