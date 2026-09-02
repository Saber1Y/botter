"""Pydantic models for Pact API."""
from pydantic import BaseModel
from typing import Optional
from enum import Enum


class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    DENY = "DENY"


class ChatRequest(BaseModel):
    message: str


class ChatHistoryEntry(BaseModel):
    role: str
    content: str
    ts: float
    intent: Optional[str] = None
    decision: Optional[str] = None
    payment: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    decision: Optional[DecisionType] = None
    payment: Optional[dict] = None
    memory_stored: list[str] = []


class PaymentRequest(BaseModel):
    recipient: str
    amount: str
    token: str = "USDC"


class PaymentResponse(BaseModel):
    id: str
    recipient: str
    amount: str
    token: str
    decision: DecisionType
    reason: str
    tx_hash: Optional[str] = None
    status: str
    memory_references: list[str] = []
    timestamp: str


class ApprovePaymentResponse(BaseModel):
    id: str
    status: str
    tx_hash: Optional[str] = None


class GoalCreate(BaseModel):
    name: str
    target: float


class GoalResponse(BaseModel):
    name: str
    target: float
    current: float
    progress: float


class MemoryResponse(BaseModel):
    key: str
    category: str
    value: dict


class RuleSetRequest(BaseModel):
    type: str  # spending_limit, trusted_merchant, blocked_merchant
    value: str


class VaultInfoResponse(BaseModel):
    balance: float
    daily_remaining: float
    max_per_transaction: float
    daily_limit: float
