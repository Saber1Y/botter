"""Pact backend configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # Base Sepolia
    base_sepolia_rpc: str = "https://sepolia.base.org"
    vault_contract_address: str = "0x0000000000000000000000000000000000000000"
    agent_private_key: str = ""
    usdc_contract_address: str = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

    # Sibyl Memory
    sibyl_db_path: str = "~/.sibyl-memory/memory.db"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
