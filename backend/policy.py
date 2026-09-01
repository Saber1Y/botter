"""Policy engine for Pact - validates agent decisions against memory and rules."""
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


class PaymentRequest(BaseModel):
    recipient: str
    amount: str
    token: str = "USDC"


class MemoryContext(BaseModel):
    spending_limit: Optional[float] = None
    trusted_merchants: list[str] = []
    blocked_merchants: list[str] = []
    goals: list[dict] = []
    previous_payments: list[dict] = []
    preferences: dict = {}


def evaluate_payment(
    request: PaymentRequest,
    context: MemoryContext,
    vault_balance: float = 0,
) -> PolicyDecision:
    """Evaluate a payment request against the user's memory and rules."""

    amount = float(request.amount)

    # Check if merchant is blocked
    if request.recipient.lower() in [m.lower() for m in context.blocked_merchants]:
        return PolicyDecision(
            decision=Decision.DENY,
            reason=f"Merchant {request.recipient} is blocked by your rules.",
            memory_references=["blocked_merchants"],
        )

    # Check if merchant is trusted and within limit
    is_trusted = request.recipient.lower() in [m.lower() for m in context.trusted_merchants]

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
                memory_references=["spending_limit", f"merchant_{request.recipient}"],
            )

    # Check vault balance
    if amount > vault_balance:
        return PolicyDecision(
            decision=Decision.DENY,
            reason=f"Insufficient vault balance. You have ${vault_balance:.2f} but need ${amount:.2f}.",
            memory_references=["vault_balance"],
        )

    # Within limit and has balance - auto-approve
    return PolicyDecision(
        decision=Decision.APPROVE,
        reason=(
            f"{request.recipient} is {'a trusted merchant' if is_trusted else 'within your spending limit'} "
            f"and ${amount:.2f} is below your ${context.spending_limit or 0:.0f} autonomous limit."
        ),
        memory_references=["spending_limit", f"merchant_{request.recipient}"],
    )
