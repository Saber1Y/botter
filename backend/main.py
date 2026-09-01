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
    # Startup
    yield
    # Shutdown


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
async def chat(request: ChatRequest, user_id: str = "default"):
    """Process a chat message from the user."""
    result = await agent.process_message(user_id, request.message)
    return ChatResponse(**result)


# --- Memory Endpoints ---

@app.get("/memory", response_model=list[MemoryResponse])
async def get_memory(user_id: str = "default", category: str = None):
    """Retrieve user memories."""
    memories = await memory.retrieve(user_id, category)
    return [
        MemoryResponse(
            key=m["key"],
            category=m.get("category", "general"),
            value=m.get("value", {}),
        )
        for m in memories
    ]


@app.post("/memory")
async def store_memory(user_id: str = "default", key: str = "", value: dict = {}, category: str = "general"):
    """Store a memory entry."""
    result = await memory.store(user_id, key, value, category)
    return result


# --- Rules Endpoints ---

@app.post("/rules")
async def set_rule(request: RuleSetRequest, user_id: str = "default"):
    """Set a financial rule."""
    await memory.store(
        user_id,
        key=f"rule_{request.type}",
        value={"type": request.type, "value": request.value},
        category="rules",
    )
    return {"status": "ok", "rule": request.type}


@app.get("/rules")
async def get_rules(user_id: str = "default"):
    """Get all financial rules."""
    memories = await memory.retrieve(user_id, "rules")
    return [m["value"] for m in memories]


# --- Goals Endpoints ---

@app.post("/goals", response_model=GoalResponse)
async def create_goal(request: GoalCreate, user_id: str = "default"):
    """Create a financial goal."""
    goal_data = {
        "name": request.name,
        "target": request.target,
        "current": 0,
    }
    await memory.store(
        user_id,
        key=f"goal_{request.name}",
        value=goal_data,
        category="goals",
    )
    return GoalResponse(
        name=request.name,
        target=request.target,
        current=0,
        progress=0,
    )


@app.get("/goals", response_model=list[GoalResponse])
async def get_goals(user_id: str = "default"):
    """Get all financial goals."""
    memories = await memory.retrieve(user_id, "goals")
    goals = []
    for m in memories:
        v = m["value"]
        target = v.get("target", 1)
        current = v.get("current", 0)
        goals.append(GoalResponse(
            name=v.get("name", ""),
            target=target,
            current=current,
            progress=(current / target * 100) if target > 0 else 0,
        ))
    return goals


# --- Payments Endpoints ---

@app.get("/payments", response_model=list[PaymentResponse])
async def get_payments(user_id: str = "default"):
    """Get all payments."""
    memories = await memory.retrieve(user_id, "payments")
    decisions = await memory.retrieve(user_id, "decisions")

    payments = []
    for d in decisions:
        v = d.get("value", {})
        payments.append(PaymentResponse(
            id=d["key"],
            recipient=v.get("recipient", ""),
            amount=v.get("amount", "0"),
            token="USDC",
            decision=v.get("decision", "UNKNOWN"),
            reason=v.get("reason", ""),
            tx_hash=None,
            status=v.get("decision", "pending").lower(),
            memory_references=[],
            timestamp="",
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
