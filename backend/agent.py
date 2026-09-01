"""LLM Agent for Pact - orchestrates the memory -> reasoning -> policy loop."""
import json
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
    "token": "USDC"
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
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    async def process_message(self, user_id: str, message: str) -> dict:
        """Process a user message and return the agent's response."""

        # Retrieve user's memory context
        memories = await memory.retrieve(user_id)
        context = self._build_memory_context(memories)

        # Get vault info
        try:
            executor = get_executor()
            vault_balance = executor.get_vault_balance()
        except Exception:
            vault_balance = 0

        # Build conversation context
        memory_summary = self._format_memory_for_llm(memories)

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
        result = await self._handle_intent(user_id, agent_response, context, vault_balance)

        return result

    async def _handle_intent(
        self,
        user_id: str,
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

        # Store any new rules
        if intent == "SET_RULE" and agent_response.get("rule"):
            rule = agent_response["rule"]
            await memory.store(
                user_id,
                key=f"rule_{rule['type']}",
                value=rule,
                category="rules",
            )
            result["memory_stored"].append(f"rule_{rule['type']}")

            # Update memory context
            if rule["type"] == "spending_limit":
                context.spending_limit = float(rule["value"])
            elif rule["type"] == "trusted_merchant":
                context.trusted_merchants.append(rule["value"])
            elif rule["type"] == "blocked_merchant":
                context.blocked_merchants.append(rule["value"])

        # Store goals
        if intent == "SET_GOAL" and agent_response.get("goal"):
            goal = agent_response["goal"]
            await memory.store(
                user_id,
                key=f"goal_{goal['name']}",
                value={**goal, "current": 0},
                category="goals",
            )
            result["memory_stored"].append(f"goal_{goal['name']}")

        # Handle payments
        if intent == "PAYMENT" and agent_response.get("payment"):
            payment_data = agent_response["payment"]
            request = PaymentRequest(**payment_data)

            # Evaluate against policy
            policy_decision = evaluate_payment(request, context, vault_balance)

            result["decision"] = policy_decision.decision.value
            result["payment"] = {
                "recipient": request.recipient,
                "amount": request.amount,
                "token": request.token,
                "reason": policy_decision.reason,
                "memory_references": policy_decision.memory_references,
            }

            # Store the decision in memory
            await memory.store(
                user_id,
                key=f"decision_{request.recipient}_{request.amount}",
                value={
                    "recipient": request.recipient,
                    "amount": request.amount,
                    "decision": policy_decision.decision.value,
                    "reason": policy_decision.reason,
                },
                category="decisions",
            )

            # Execute if approved
            if policy_decision.decision == Decision.APPROVE:
                try:
                    executor = get_executor()
                    import hashlib
                    payment_id = hashlib.sha256(
                        f"{user_id}_{request.recipient}_{request.amount}".encode()
                    ).hexdigest()[:32]

                    tx_result = executor.execute_payment(
                        recipient=request.recipient,
                        amount=float(request.amount),
                        payment_id=payment_id,
                    )

                    result["payment"]["tx_hash"] = tx_result["tx_hash"]
                    result["payment"]["status"] = tx_result["status"]

                    # Store transaction in memory
                    await memory.store(
                        user_id,
                        key=f"payment_{payment_id}",
                        value={
                            **tx_result,
                            "token": request.token,
                        },
                        category="payments",
                    )
                except Exception as e:
                    result["payment"]["status"] = "error"
                    result["payment"]["error"] = str(e)

        return result

    def _build_memory_context(self, memories: list[dict]) -> MemoryContext:
        """Build a MemoryContext from stored memories."""
        context = MemoryContext()

        for mem in memories:
            category = mem.get("category", "")
            value = mem.get("value", {})

            if category == "rules":
                if value.get("type") == "spending_limit":
                    context.spending_limit = float(value.get("value", 0))
                elif value.get("type") == "trusted_merchant":
                    context.trusted_merchants.append(value.get("value", ""))
                elif value.get("type") == "blocked_merchant":
                    context.blocked_merchants.append(value.get("value", ""))
            elif category == "goals":
                context.goals.append(value)
            elif category == "payments":
                context.previous_payments.append(value)

        return context

    def _format_memory_for_llm(self, memories: list[dict]) -> str:
        """Format memories into a readable string for the LLM."""
        if not memories:
            return "No memories stored yet."

        lines = []
        for mem in memories:
            category = mem.get("category", "general")
            key = mem.get("key", "")
            value = mem.get("value", {})
            lines.append(f"- [{category}] {key}: {json.dumps(value)}")

        return "\n".join(lines)


# Singleton instance
agent = PactAgent()
