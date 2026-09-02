"""Payment executor for per-user Base Sepolia vaults."""
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

# VaultFactory ABI (for looking up user vaults)
FACTORY_ABI = [
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getVault",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "vaultCount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]


class PaymentExecutor:
    """Handles onchain payment execution on Base Sepolia per-user vaults."""

    def __init__(self):
        settings = get_settings()
        self.w3 = Web3(Web3.HTTPProvider(settings.base_sepolia_rpc))
        self.agent_account = Account.from_key(settings.agent_private_key)
        self.usdc_address = settings.usdc_contract_address

        # Factory contract (for vault lookup)
        factory_addr = Web3.to_checksum_address(settings.vault_factory_address)
        self.factory = self.w3.eth.contract(address=factory_addr, abi=FACTORY_ABI)

    def get_user_vault(self, wallet: str) -> str | None:
        """Look up a user's vault address from the factory."""
        try:
            vault_addr = self.factory.functions.getVault(
                Web3.to_checksum_address(wallet)
            ).call()
            if vault_addr == "0x0000000000000000000000000000000000000000":
                return None
            return vault_addr
        except Exception:
            return None

    def has_vault(self, wallet: str) -> bool:
        """Check if a user has a deployed vault."""
        return self.get_user_vault(wallet) is not None

    def get_vault_balance(self, vault_address: str) -> float:
        """Get a vault's USDC balance."""
        vault = self._get_vault_contract(vault_address)
        balance = vault.functions.getBalance().call()
        return balance / 1e6  # USDC has 6 decimals

    def get_daily_remaining(self, vault_address: str) -> float:
        """Get remaining daily budget for a vault."""
        vault = self._get_vault_contract(vault_address)
        remaining = vault.functions.getDailyRemaining().call()
        return remaining / 1e6

    def get_vault_info(self, vault_address: str) -> dict:
        """Get full vault info for a specific vault."""
        vault = self._get_vault_contract(vault_address)
        return {
            "balance": self.get_vault_balance(vault_address),
            "daily_remaining": self.get_daily_remaining(vault_address),
            "max_per_transaction": vault.functions.maxPerTransaction().call() / 1e6,
            "daily_limit": vault.functions.dailyLimit().call() / 1e6,
            "owner": vault.functions.owner().call(),
            "agent": vault.functions.agent().call(),
        }

    def execute_payment(
        self,
        vault_address: str,
        recipient: str,
        amount: float,
        payment_id: str,
    ) -> dict:
        """Execute a payment from a user's vault on Base Sepolia."""
        vault = self._get_vault_contract(vault_address)

        # Convert to USDC units (6 decimals)
        amount_wei = int(amount * 1e6)

        # Generate payment ID
        payment_id_bytes = Web3.to_bytes(text=payment_id)

        # Build transaction
        tx = vault.functions.pay(
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

    def _get_vault_contract(self, vault_address: str):
        """Get a Web3 contract instance for a specific vault."""
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(vault_address),
            abi=VAULT_ABI,
        )


# Singleton instance (lazy initialization)
_executor = None


def get_executor() -> PaymentExecutor:
    global _executor
    if _executor is None:
        _executor = PaymentExecutor()
    return _executor
