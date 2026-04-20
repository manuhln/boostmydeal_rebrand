import os


from fastapi import Header, HTTPException
from typing import Annotated
from dotenv import load_dotenv
from livekit import api

load_dotenv(".env.local")

api_keys = os.getenv("API_KEYS", "").split(",")


async def verify_api_key(x_api_key: Annotated[str, Header(...)]):
    if x_api_key not in api_keys:
        raise HTTPException(status_code=401, detail="Invalid API Key")


def _livekit_credentials() -> tuple[str, str, str]:
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not all([livekit_url, api_key, api_secret]):
        raise HTTPException(
            status_code=500,
            detail="LiveKit configuration missing. Please check LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables."
        )

    return livekit_url, api_key, api_secret


async def create_livekit_api() -> api.LiveKitAPI:
    """Create a new LiveKit API client."""
    livekit_url, api_key, api_secret = _livekit_credentials()
    return api.LiveKitAPI(url=livekit_url, api_key=api_key, api_secret=api_secret)


async def get_livekit_api():
    """
    FastAPI dependency that provides a fresh LiveKit client per request.

    Reusing a previously closed aiohttp session causes downstream calls to fail
    with "Session is closed", so each HTTP request gets its own client.
    """
    lk_api = await create_livekit_api()
    try:
        yield lk_api
    finally:
        await lk_api.aclose()


async def close_livekit_api():
    """Compatibility shim for older lifespan hooks."""
    return None
