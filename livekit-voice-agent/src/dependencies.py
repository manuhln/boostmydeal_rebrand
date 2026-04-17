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
    
async def get_livekit_api() -> api.LiveKitAPI:
    """Initialize and return a LiveKit API client."""
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not all([livekit_url, api_key, api_secret]):
        raise HTTPException(
            status_code=500,
            detail="LiveKit configuration missing. Please check LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables."
        )

    return api.LiveKitAPI(url=livekit_url, api_key=api_key, api_secret=api_secret)