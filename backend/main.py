"""Pact Backend - AI Financial Agent with Persistent Memory."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from memory import memory
from agent import agent
from schemas import (
    ChatRequest,
    ChatResponse,
    PaymentResponse,
    GoalCreate,
    GoalResponse,
    MemoryResponse,
    RuleSetRequest,
    VaultInfoResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    yield


app = FastAPI(
    title="Pact API",
    description="AI Financial Agent with Persistent Memory",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Chat Endpoint ---

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, wallet: str = "0x0000000000000000000000000000000000000000"):
    """Process a chat message from the user."""
    result = await agent.process_message(wallet, request.message)
    return ChatResponse(**result)


# --- Memory Endpoints ---

@app.get("/memory", response_model=list[MemoryResponse])
async def get_memory(wallet: str = "0x0000000000000000000000000000000000000000", category: str = None):
    """Retrieve user memories."""
    if category == "rules":
        rules = memory.get_all_rules(wallet)
        return [
            MemoryResponse(key=r["key"], category="rules", value=r["value"])
            for r in rules
        ]
    elif category == "goals":
        goals = memory.get_goals(wallet)
        return [
            MemoryResponse(key=g.get("name", ""), category="goals", value=g)
            for g in goals
        ]
    elif category == "decisions":
        decisions = memory.get_decisions(wallet)
        return [
            MemoryResponse(key=f"decision_{i}", category="decisions", value=d)
            for i, d in enumerate(decisions)
        ]
    else:
        # Return all rules, goals, and recent decisions
        rules = memory.get_all_rules(wallet)
        goals = memory.get_goals(wallet)
        decisions = memory.get_decisions(wallet, limit=10)
        results = [
            MemoryResponse(key=r["key"], category="rules", value=r["value"])
            for r in rules
        ]
        results += [
            MemoryResponse(key=g.get("name", ""), category="goals", value=g)
            for g in goals
        ]
        results += [
            MemoryResponse(key=f"decision_{i}", category="decisions", value=d)
            for i, d in enumerate(decisions)
        ]
        return results


@app.post("/memory")
async def store_memory(wallet: str = "0x0000000000000000000000000000000000000000", key: str = "", value: dict = {}, category: str = "general"):
    """Store a memory entry."""
    if category == "rules":
        rule_type = value.get("type", key)
        memory.store_rule(wallet, rule_type=rule_type, value=value.get("value", ""), rule_id=rule_type)
    elif category == "goals":
        memory.store_goal(wallet, name=value.get("name", key), target=value.get("target", 0))
    return {"status": "ok"}


# --- Rules Endpoints ---

@app.post("/rules")
async def set_rule(request: RuleSetRequest, wallet: str = "0x0000000000000000000000000000000000000000"):
    """Set a financial rule."""
    memory.store_rule(
        wallet,
        rule_type=request.type,
        value=request.value,
        rule_id=request.type,  # stable ID: upserts
    )
    return {"status": "ok", "rule": request.type}


@app.get("/rules")
async def get_rules(wallet: str = "0x0000000000000000000000000000000000000000"):
    """Get all financial rules."""
    rules = memory.get_all_rules(wallet)
    return [r["value"] for r in rules]


# --- Goals Endpoints ---

@app.post("/goals", response_model=GoalResponse)
async def create_goal(request: GoalCreate, wallet: str = "0x0000000000000000000000000000000000000000"):
    """Create a financial goal."""
    memory.store_goal(wallet, name=request.name, target=request.target)
    return GoalResponse(
        name=request.name,
        target=request.target,
        current=0,
        progress=0,
    )


@app.get("/goals", response_model=list[GoalResponse])
async def get_goals(wallet: str = "0x0000000000000000000000000000000000000000"):
    """Get all financial goals."""
    goals = memory.get_goals(wallet)
    return [
        GoalResponse(
            name=g.get("name", ""),
            target=g.get("target", 0),
            current=g.get("current", 0),
            progress=(g.get("current", 0) / g.get("target", 1) * 100) if g.get("target") else 0,
        )
        for g in goals
    ]


# --- Payments Endpoints ---

@app.get("/payments", response_model=list[PaymentResponse])
async def get_payments(wallet: str = "0x0000000000000000000000000000000000000000"):
    """Get all payments from decisions (WARM) and journal (COLD)."""
    decisions = memory.get_decisions(wallet, limit=20)
    payments = []
    for d in decisions:
        payments.append(PaymentResponse(
            id=f"decision_{d.get('recipient', '')}_{d.get('amount', '')}",
            recipient=d.get("recipient", ""),
            amount=d.get("amount", "0"),
            token="USDC",
            decision=d.get("decision", "UNKNOWN").upper(),
            reason=d.get("reason", ""),
            tx_hash=None,
            status=d.get("decision", "pending").lower(),
            memory_references=[],
            timestamp=str(d.get("ts", "")),
        ))
    return payments


# --- Vault Endpoints ---

@app.get("/vault", response_model=VaultInfoResponse)
async def get_vault_info():
    """Get vault information."""
    try:
        from executor import get_executor
        executor = get_executor()
        info = executor.get_vault_info()
        return VaultInfoResponse(**info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Health Check ---

@app.get("/health")
async def health():
    return {"status": "ok", "service": "pact-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
