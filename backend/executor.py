"""Payment executor for Base Sepolia transactions."""
from web3 import Web3
from eth_account import Account
from config import get_settings


# PactVault ABI (subset for payment execution)
VAULT_ABI = [
    {
        "inputs": [
            {"name": "recipient", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "paymentId", "type": "bytes32"},
        ],
        "name": "pay",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "amount", "type": "uint256"}],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getDailyRemaining",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "agent",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "maxPerTransaction",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "dailyLimit",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]


class PaymentExecutor:
    """Handles onchain payment execution on Base Sepolia."""

    def __init__(self):
        settings = get_settings()
        self.w3 = Web3(Web3.HTTPProvider(settings.base_sepolia_rpc))
        self.vault_address = Web3.to_checksum_address(settings.vault_contract_address)
        self.agent_account = Account.from_key(settings.agent_private_key)
        self.vault = self.w3.eth.contract(
            address=self.vault_address,
            abi=VAULT_ABI,
        )

    def get_vault_balance(self) -> float:
        """Get the vault's USDC balance."""
        balance = self.vault.functions.getBalance().call()
        return balance / 1e6  # USDC has 6 decimals

    def get_daily_remaining(self) -> float:
        """Get remaining daily budget."""
        remaining = self.vault.functions.getDailyRemaining().call()
        return remaining / 1e6

    def get_vault_info(self) -> dict:
        """Get full vault info."""
        return {
            "balance": self.get_vault_balance(),
            "daily_remaining": self.get_daily_remaining(),
            "max_per_transaction": self.vault.functions.maxPerTransaction().call() / 1e6,
            "daily_limit": self.vault.functions.dailyLimit().call() / 1e6,
            "owner": self.vault.functions.owner().call(),
            "agent": self.vault.functions.agent().call(),
        }

    def execute_payment(
        self,
        recipient: str,
        amount: float,
        payment_id: str,
    ) -> dict:
        """Execute a payment on Base Sepolia."""

        # Convert to USDC units (6 decimals)
        amount_wei = int(amount * 1e6)

        # Generate payment ID
        payment_id_bytes = Web3.to_bytes(text=payment_id)

        # Build transaction
        tx = self.vault.functions.pay(
            Web3.to_checksum_address(recipient),
            amount_wei,
            payment_id_bytes,
        ).build_transaction({
            "from": self.agent_account.address,
            "nonce": self.w3.eth.get_transaction_count(self.agent_account.address),
            "gas": 200000,
            "gasPrice": self.w3.eth.gas_price,
            "chainId": 84532,  # Base Sepolia
        })

        # Sign and send
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.agent_account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        # Wait for receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "status": "success" if receipt.status == 1 else "failed",
            "gas_used": receipt.gasUsed,
            "recipient": recipient,
            "amount": amount,
        }


# Singleton instance (lazy initialization)
_executor = None


def get_executor() -> PaymentExecutor:
    global _executor
    if _executor is None:
        _executor = PaymentExecutor()
    return _executor
