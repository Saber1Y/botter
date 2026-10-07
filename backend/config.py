"""Botter backend configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM (OpenRouter - free models available)
    openai_api_key: str = ""
    openai_base_url: str = "https://openrouter.ai/api/v1"
    openai_model: str = "nvidia/nemotron-3-super-120b-a12b:free"

    # BOT Chain Testnet
    bot_chain_rpc: str = "https://rpc.bohr.life"
    bot_chain_id: int = 968
    vault_factory_address: str = "0x0000000000000000000000000000000000000000"
    agent_private_key: str = ""
    token_contract_address: str = "0x75edC9335175Fc0552D51D48439F229c10420fe3"

    # Sibyl Memory
    sibyl_db_path: str = "~/.sibyl-memory/memory.db"

    # Frontend
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
