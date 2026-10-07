"""Pydantic models for Botter API."""
from pydantic import BaseModel
from typing import Optional
from enum import Enum


class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    DENY = "DENY"


class ChatRequest(BaseModel):
    message: str


class ChatSessionCreate(BaseModel):
    name: Optional[str] = None


class ChatSessionResponse(BaseModel):
    id: str
    name: str
    created_at: float
    updated_at: float


class ChatHistoryEntry(BaseModel):
    id: str = ""
    role: str
    content: str
    ts: float
    intent: Optional[str] = None
    decision: Optional[str] = None
    payment: Optional[dict] = None
    session_id: str = "default"


class ChatResponse(BaseModel):
    response: str
    intent: str
    decision: Optional[DecisionType] = None
    payment: Optional[dict] = None
    memory_stored: list[str] = []


class PaymentRequest(BaseModel):
    recipient: str
    amount: str
    token: str = "USDT"


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
    memory_details: list[dict] = []
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
    owner: Optional[str] = None
    agent: Optional[str] = None


class VaultStatusResponse(BaseModel):
    has_vault: bool
    vault_address: Optional[str] = None
    balance: Optional[float] = None
    daily_remaining: Optional[float] = None
    max_per_transaction: Optional[float] = None
    daily_limit: Optional[float] = None
