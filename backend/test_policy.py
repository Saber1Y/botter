import unittest

from policy import Decision, MemoryContext, PaymentRequest, evaluate_payment


class PaymentPolicyTests(unittest.TestCase):
    def test_new_recipient_requires_approval(self):
        context = MemoryContext(spending_limit=100)

        result = evaluate_payment(
            PaymentRequest(recipient="0xnew", amount="20"),
            context,
            vault_balance=100,
        )

        self.assertEqual(result.decision, Decision.REQUIRE_APPROVAL)
        self.assertIn("new", result.reason)

    def test_known_recipient_can_be_auto_approved(self):
        context = MemoryContext(
            spending_limit=100,
            previous_payments=[{"recipient": "0xknown", "decision": "APPROVE"}],
            memory_records=[
                {
                    "id": "payments:event-1",
                    "category": "payments",
                    "label": "0xknown",
                    "value": {"recipient": "0xknown", "decision": "APPROVE"},
                }
            ],
        )

        result = evaluate_payment(
            PaymentRequest(recipient="0xknown", amount="20"),
            context,
            vault_balance=100,
        )

        self.assertEqual(result.decision, Decision.APPROVE)
        self.assertIn("payments:event-1", result.memory_references)

    def test_goal_protection_requires_approval(self):
        context = MemoryContext(
            spending_limit=100,
            goals=[{"name": "Emergency fund", "target": 1000, "current": 500}],
        )

        result = evaluate_payment(
            PaymentRequest(recipient="0xknown", amount="60"),
            context,
            vault_balance=100,
        )

        self.assertEqual(result.decision, Decision.REQUIRE_APPROVAL)
        self.assertIn("Emergency fund", result.reason)

    def test_blocked_recipient_is_denied(self):
        context = MemoryContext(blocked_merchants=["0xblocked"])

        result = evaluate_payment(
            PaymentRequest(recipient="0xblocked", amount="1"),
            context,
            vault_balance=100,
        )

        self.assertEqual(result.decision, Decision.DENY)

    def test_denied_history_does_not_make_recipient_trusted(self):
        context = MemoryContext(
            spending_limit=100,
            previous_payments=[{"recipient": "0xrejected", "decision": "DENY"}],
            policy_facts=[
                {
                    "recipient": "0xrejected",
                    "approved_count": 0,
                    "denied_count": 1,
                }
            ],
        )

        result = evaluate_payment(
            PaymentRequest(recipient="0xrejected", amount="20"),
            context,
            vault_balance=100,
        )

        self.assertEqual(result.decision, Decision.REQUIRE_APPROVAL)


if __name__ == "__main__":
    unittest.main()
