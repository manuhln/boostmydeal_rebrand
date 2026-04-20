import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from routers import calls, sip_trunk
from dependencies import close_livekit_api

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    yield
    await close_livekit_api()


app = FastAPI(lifespan=lifespan)
app.include_router(calls.router)
app.include_router(sip_trunk.router)