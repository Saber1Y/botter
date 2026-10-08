"""Botter backend configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM (OpenRouter - free models available)
    openai_api_key: str = ""
    openai_base_url: str = "https://openrouter.ai/api/v1"
    openai_model: str = "nvidia/nemotron-3-super-120b-a12b:free"

    # BOT Chain Mainnet
    bot_chain_rpc: str = "https://rpc.botchain.ai"
    bot_chain_id: int = 677
    vault_factory_address: str = "0xfebcdda771561bc92d290c993e07aa8552083a61"
    agent_private_key: str = ""
    token_contract_address: str = "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C"

    # Sibyl Memory
    sibyl_db_path: str = "~/.sibyl-memory/memory.db"

    # Frontend
    frontend_url: str = "https://botterr.vercel.app,http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
