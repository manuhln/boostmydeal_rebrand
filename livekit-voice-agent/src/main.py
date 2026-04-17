from fastapi import FastAPI
from src.routers import calls

app = FastAPI()
app.include_router(calls.router)