"""LLM Agent for Pact - orchestrates the memory -> reasoning -> policy loop."""
import json
import hashlib
from openai import AsyncOpenAI
from config import get_settings
from memory import memory
from policy import Decision, PaymentRequest, MemoryContext, PolicyDecision, evaluate_payment
from executor import get_executor


SYSTEM_PROMPT = """You are Pact, an AI financial agent powered by persistent memory.

Your role is to help users manage their finances by:
1. Understanding their financial rules, goals, and preferences
2. Storing this information as persistent memory
3. Making payment decisions based on remembered context
4. Explaining your decisions clearly

When a user gives you a financial instruction, you MUST:
- Extract the intent (payment, rule setting, goal creation, query)
- Output a structured JSON response with the following format:

{
  "intent": "PAYMENT" | "SET_RULE" | "SET_GOAL" | "QUERY" | "CONVERSATION",
  "response": "Your natural language response to the user",
  "payment": {
    "recipient": "0x...",
    "amount": "100",
    "token": "USDC",
    "merchant": "Acme"
  } | null,
  "rule": {
    "type": "spending_limit" | "trusted_merchant" | "blocked_merchant",
    "value": "100" | "0x..." | "0x..."
  } | null,
  "goal": {
    "name": "MacBook",
    "target": 2000
  } | null,
  "memory_references": ["key1", "key2"]
}

Important rules:
- When setting spending limits, extract the dollar amount as a number
- When setting merchant rules, extract the merchant name or address
- Always explain what you're doing and why
- Reference the user's existing memory in your responses
- Be concise but helpful"""


class PactAgent:
    """LLM-powered agent for Pact."""

    def __init__(self):
        settings = get_settings()
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
        self.model = settings.openai_model

    async def process_message(self, wallet: str, message: str) -> dict:
        """Process a user message and return the agent's response."""

        # Retrieve user's memory context from Sibyl
        memory_ctx = memory.get_memory_context(wallet)
        context = self._build_memory_context(memory_ctx)

        # Get vault info
        try:
            executor = get_executor()
            vault_balance = executor.get_vault_balance()
        except Exception:
            vault_balance = 0

        # Build conversation context
        memory_summary = memory.format_for_llm(wallet)

        user_prompt = f"""Current memory context:
{memory_summary}

Vault balance: ${vault_balance:.2f}

User message: {message}

Respond with a JSON object containing your intent, response, and any actions to take."""

        # Call LLM
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        # Parse response
        agent_response = json.loads(response.choices[0].message.content)

        # Process intent
        result = await self._handle_intent(wallet, agent_response, context, vault_balance)

        return result

    async def _handle_intent(
        self,
        wallet: str,
        agent_response: dict,
        context: MemoryContext,
        vault_balance: float,
    ) -> dict:
        """Handle the agent's intent and execute actions."""

        intent = agent_response.get("intent", "CONVERSATION")
        result = {
            "response": agent_response.get("response", ""),
            "intent": intent,
            "decision": None,
            "payment": None,
            "memory_stored": [],
        }

        # Store rules → WARM entities (upsert)
        if intent == "SET_RULE" and agent_response.get("rule"):
            rule = agent_response["rule"]
            rule_type = rule["type"]
            memory.store_rule(
                wallet,
                rule_type=rule_type,
                value=rule["value"],
                rule_id=rule_type,  # stable ID: overwrites previous rule of same type
            )
            result["memory_stored"].append(f"rule:{rule_type}")

            # Update memory context
            if rule_type == "spending_limit":
                context.spending_limit = float(rule["value"])
            elif rule_type == "trusted_merchant":
                context.trusted_merchants.append(rule["value"])
            elif rule_type == "blocked_merchant":
                context.blocked_merchants.append(rule["value"])

        # Store goals → WARM entities (upsert)
        if intent == "SET_GOAL" and agent_response.get("goal"):
            goal = agent_response["goal"]
            memory.store_goal(
                wallet,
                name=goal["name"],
                target=goal["target"],
            )
            result["memory_stored"].append(f"goal:{goal['name']}")

        # Handle payments
        if intent == "PAYMENT" and agent_response.get("payment"):
            payment_data = agent_response["payment"]
            merchant = payment_data.get("merchant", "")
            request = PaymentRequest(**payment_data)

            # Evaluate against policy
            policy_decision = evaluate_payment(request, context, vault_balance)

            result["decision"] = policy_decision.decision.value
            result["payment"] = {
                "recipient": request.recipient,
                "amount": request.amount,
                "token": request.token,
                "merchant": merchant,
                "reason": policy_decision.reason,
                "memory_references": policy_decision.memory_references,
            }

            # Store decision as WARM fact (for future policy reasoning)
            decision_id = hashlib.sha256(
                f"{wallet}_{request.recipient}_{request.amount}".encode()
            ).hexdigest()[:16]
            memory.store_decision(
                wallet,
                decision_id=decision_id,
                recipient=request.recipient,
                amount=request.amount,
                decision=policy_decision.decision.value,
                reason=policy_decision.reason,
                merchant=merchant,
            )

            # Execute if approved
            if policy_decision.decision == Decision.APPROVE:
                try:
                    executor = get_executor()
                    payment_id = hashlib.sha256(
                        f"{wallet}_{request.recipient}_{request.amount}".encode()
                    ).hexdigest()[:32]

                    tx_result = executor.execute_payment(
                        recipient=request.recipient,
                        amount=float(request.amount),
                        payment_id=payment_id,
                    )

                    result["payment"]["tx_hash"] = tx_result["tx_hash"]
                    result["payment"]["status"] = tx_result["status"]

                    # Record in COLD journal
                    memory.record_payment(
                        wallet,
                        recipient=request.recipient,
                        amount=request.amount,
                        token=request.token,
                        decision="approved",
                        tx_hash=tx_result["tx_hash"],
                        merchant=merchant,
                    )
                except Exception as e:
                    result["payment"]["status"] = "error"
                    result["payment"]["error"] = str(e)

            # Record rejected/required decision in COLD journal too
            if policy_decision.decision != Decision.APPROVE:
                memory.record_payment(
                    wallet,
                    recipient=request.recipient,
                    amount=request.amount,
                    token=request.token,
                    decision=policy_decision.decision.value,
                    merchant=merchant,
                    reason=policy_decision.reason,
                )

        return result

    def _build_memory_context(self, memory_ctx: dict) -> MemoryContext:
        """Build a MemoryContext from the structured memory dict."""
        context = MemoryContext()

        if memory_ctx.get("spending_limit") is not None:
            context.spending_limit = memory_ctx["spending_limit"]

        context.trusted_merchants = memory_ctx.get("trusted_merchants", [])
        context.blocked_merchants = memory_ctx.get("blocked_merchants", [])
        context.goals = memory_ctx.get("goals", [])
        context.previous_payments = memory_ctx.get("recent_payments", [])

        return context


# Singleton instance
agent = PactAgent()
