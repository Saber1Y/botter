"""Botter Backend - AI Financial Agent with Persistent Memory."""
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from memory import MemoryUnavailable, memory
from agent import agent
from schemas import (
    ChatHistoryEntry,
    ChatRequest,
    ChatSessionCreate,
    ChatSessionResponse,
    ApprovePaymentResponse,
    ChatResponse,
    PaymentResponse,
    GoalCreate,
    GoalResponse,
    MemoryResponse,
    RuleSetRequest,
    VaultInfoResponse,
    VaultStatusResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    yield


app = FastAPI(
    title="Botter API",
    description="AI Financial Agent with Persistent Memory",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Chat Endpoint ---

@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    wallet: str = "0x0000000000000000000000000000000000000000",
    session_id: str = "default",
):
    """Process a chat message from the user."""
    try:
        # Store user message in Sibyl before any reasoning occurs.
        client = memory._client(wallet)
        ts = time.time()
        try:
            client.set_entity("chat_history", f"msg_{ts}_user", {
                "role": "user",
                "content": request.message,
                "session_id": session_id,
                "ts": ts,
            })
        except Exception as exc:
            raise MemoryUnavailable("Sibyl memory is unavailable") from exc

        result = await agent.process_message(wallet, request.message)
        memory.touch_chat_session(wallet, session_id)

        # Store assistant response in the same Sibyl tenant.
        ts2 = time.time()
        try:
            client.set_entity("chat_history", f"msg_{ts2}_assistant", {
                "role": "assistant",
                "content": result.get("response", ""),
                "intent": result.get("intent", ""),
                "decision": result.get("decision"),
            "payment": result.get("payment"),
            "session_id": session_id,
            "ts": ts2,
            })
        except Exception as exc:
            raise MemoryUnavailable("Sibyl memory is unavailable") from exc
        return ChatResponse(**result)
    except MemoryUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "SIBYL_UNAVAILABLE", "message": str(exc)},
        ) from exc


@app.get("/chat/history", response_model=list[ChatHistoryEntry])
async def get_chat_history(
    wallet: str = "0x0000000000000000000000000000000000000000",
    session_id: str = "default",
):
    """Get chat history for a wallet."""
    client = memory._client(wallet)
    entities = client.list_entities("chat_history")
    messages = []
    for e in entities:
        body = e.get("body", {})
        if body.get("role") and body.get("session_id", "default") == session_id:
            messages.append(ChatHistoryEntry(
                role=body["role"],
                id=e.get("name", ""),
                content=body.get("content", ""),
                ts=body.get("ts", 0),
                intent=body.get("intent"),
                decision=body.get("decision"),
                payment=body.get("payment"),
                session_id=body.get("session_id", "default"),
            ))
    messages.sort(key=lambda m: m.ts)
    return messages[-50:]  # last 50 messages


@app.get("/chat/sessions", response_model=list[ChatSessionResponse])
async def get_chat_sessions(
    wallet: str = "0x0000000000000000000000000000000000000000",
):
    """List the wallet's Sibyl-backed chat sessions."""
    return [ChatSessionResponse(**session) for session in memory.get_chat_sessions(wallet)]


@app.post("/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    request: ChatSessionCreate,
    wallet: str = "0x0000000000000000000000000000000000000000",
):
    """Create a new wallet-scoped chat session."""
    return ChatSessionResponse(**memory.create_chat_session(wallet, request.name))


@app.delete("/chat/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    wallet: str = "0x0000000000000000000000000000000000000000",
):
    """Delete a chat session and its wallet-scoped messages."""
    try:
        memory.delete_chat_session(wallet, session_id)
        return {"status": "ok", "deleted": session_id}
    except MemoryUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "SIBYL_UNAVAILABLE", "message": str(exc)},
        ) from exc


@app.delete("/chat/sessions/{session_id}/messages")
async def truncate_chat_history(
    session_id: str,
    from_ts: float,
    wallet: str = "0x0000000000000000000000000000000000000000",
):
    """Delete one message and later messages for an edit-and-resubmit flow."""
    try:
        memory.truncate_chat_history(wallet, session_id, from_ts)
        return {"status": "ok", "session_id": session_id, "from_ts": from_ts}
    except MemoryUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "SIBYL_UNAVAILABLE", "message": str(exc)},
        ) from exc


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
    elif category == "payments":
        payments = memory.get_payment_events(wallet)
        return [
            MemoryResponse(
                key=p.get("memory_id", f"payment_{i}"),
                category="payments",
                value=p,
            )
            for i, p in enumerate(payments)
        ]
    else:
        # Return all user-facing Sibyl memory tiers.
        rules = memory.get_all_rules(wallet)
        goals = memory.get_goals(wallet)
        decisions = memory.get_decisions(wallet, limit=10)
        payments = memory.get_payment_events(wallet, limit=20)
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
        results += [
            MemoryResponse(
                key=p.get("memory_id", f"payment_{i}"),
                category="payments",
                value=p,
            )
            for i, p in enumerate(payments)
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


@app.delete("/goals/{name}")
async def delete_goal(name: str, wallet: str = "0x0000000000000000000000000000000000000000"):
    """Delete a financial goal."""
    success = memory.delete_goal(wallet, name)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"status": "ok", "deleted": name}


# --- Payments Endpoints ---

@app.get("/payments", response_model=list[PaymentResponse])
async def get_payments(wallet: str = "0x0000000000000000000000000000000000000000"):
    """Get the linked decision and payment audit trail from Sibyl."""
    def normalize_decision(value: str) -> str:
        return {
            "APPROVED": "APPROVE",
            "APPROVE": "APPROVE",
            "REQUIRE_APPROVAL": "REQUIRE_APPROVAL",
            "DENIED": "DENY",
            "DENY": "DENY",
        }.get(value.upper(), "DENY")

    events = memory.get_payment_events(wallet, limit=50)
    if events:
        latest_events = {}
        for event in events:
            event_id = event.get("decision_id") or event.get("memory_id")
            previous = latest_events.get(event_id)
            if not previous or event.get("ts", 0) >= previous.get("ts", 0):
                latest_events[event_id] = event
        return [
            PaymentResponse(
                id=p.get("decision_id") or p.get("memory_id", f"payment_{i}"),
                recipient=p.get("recipient", ""),
                amount=p.get("amount", "0"),
                token=p.get("token", "USDT"),
                decision=normalize_decision(p.get("decision", "UNKNOWN")),
                reason=p.get("reason", ""),
                tx_hash=p.get("tx_hash") or None,
                status=("completed" if p.get("tx_hash") else p.get("decision", "pending").lower()),
                memory_references=p.get("memory_references", []),
                memory_details=p.get("memory_details", []),
                timestamp=str(p.get("ts", "")),
            )
            for i, p in enumerate(latest_events.values())
        ]

    # Legacy records created before decision_id was added remain readable.
    decisions = memory.get_decisions(wallet, limit=20)
    payments = []
    for d in decisions:
        payments.append(PaymentResponse(
            id=f"decision_{d.get('recipient', '')}_{d.get('amount', '')}",
            recipient=d.get("recipient", ""),
            amount=d.get("amount", "0"),
            token="USDT",
            decision=normalize_decision(d.get("decision", "UNKNOWN")),
            reason=d.get("reason", ""),
            tx_hash=None,
            status=d.get("decision", "pending").lower(),
            memory_references=[],
            timestamp=str(d.get("ts", "")),
        ))
    return payments


@app.post("/payments/{decision_id}/approve", response_model=ApprovePaymentResponse)
async def approve_payment(
    decision_id: str,
    wallet: str = "0x0000000000000000000000000000000000000000",
):
    """Approve and execute one pending payment after rechecking hard safety limits."""
    try:
        return ApprovePaymentResponse(**await agent.approve_payment(wallet, decision_id))
    except MemoryUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "SIBYL_UNAVAILABLE", "message": str(exc)},
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/memory/status")
async def get_memory_status(wallet: str = "0x0000000000000000000000000000000000000000"):
    """Report whether this wallet's Sibyl tenant is available."""
    try:
        memory.get_memory_context(wallet)
        return {"available": True, "provider": "sibyl", "tenant": "wallet-scoped"}
    except Exception:
        return {"available": False, "provider": "sibyl", "tenant": "wallet-scoped"}


# --- Vault Endpoints ---

@app.get("/vault/status", response_model=VaultStatusResponse)
async def get_vault_status(wallet: str):
    """Check if a user has a deployed vault and get its status."""
    try:
        from executor import get_executor
        executor = get_executor()
        vault_addr = executor.get_user_vault(wallet)

        if not vault_addr:
            return VaultStatusResponse(has_vault=False)

        info = executor.get_vault_info(vault_addr)
        return VaultStatusResponse(
            has_vault=True,
            vault_address=vault_addr,
            balance=info["balance"],
            daily_remaining=info["daily_remaining"],
            max_per_transaction=info["max_per_transaction"],
            daily_limit=info["daily_limit"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vault", response_model=VaultInfoResponse)
async def get_vault_info(wallet: str):
    """Get vault information for a specific user."""
    try:
        from executor import get_executor
        executor = get_executor()
        vault_addr = executor.get_user_vault(wallet)

        if not vault_addr:
            raise HTTPException(status_code=404, detail="No vault found. Deploy a vault first.")

        info = executor.get_vault_info(vault_addr)
        return VaultInfoResponse(**info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Health Check ---

@app.get("/health")
async def health():
    return {"status": "ok", "service": "botter-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
