"""Sibyl Memory client for persistent agent memory."""
from typing import Optional
import httpx
from config import get_settings


class SibylMemory:
    """Client for Sibyl persistent memory API."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.sibyl_api_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def store(self, user_id: str, key: str, value: dict, category: str = "general") -> dict:
        """Store a memory entry."""
        response = await self.client.post(
            "/memory/store",
            json={
                "user_id": user_id,
                "key": key,
                "value": value,
                "category": category,
            },
        )
        response.raise_for_status()
        return response.json()

    async def retrieve(self, user_id: str, category: Optional[str] = None) -> list[dict]:
        """Retrieve all memories for a user, optionally filtered by category."""
        params = {"user_id": user_id}
        if category:
            params["category"] = category
        response = await self.client.get("/memory/retrieve", params=params)
        response.raise_for_status()
        return response.json()

    async def retrieve_one(self, user_id: str, key: str) -> Optional[dict]:
        """Retrieve a specific memory by key."""
        response = await self.client.get(
            f"/memory/retrieve/{key}",
            params={"user_id": user_id},
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    async def update(self, user_id: str, key: str, value: dict) -> dict:
        """Update an existing memory."""
        response = await self.client.put(
            f"/memory/update/{key}",
            json={"user_id": user_id, "value": value},
        )
        response.raise_for_status()
        return response.json()

    async def delete(self, user_id: str, key: str) -> bool:
        """Delete a memory entry."""
        response = await self.client.delete(
            f"/memory/delete/{key}",
            params={"user_id": user_id},
        )
        return response.status_code == 200

    async def search(self, user_id: str, query: str) -> list[dict]:
        """Search memories by content."""
        response = await self.client.post(
            "/memory/search",
            json={"user_id": user_id, "query": query},
        )
        response.raise_for_status()
        return response.json()


# Singleton instance
memory = SibylMemory()
