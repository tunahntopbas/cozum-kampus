from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import analyze

app = FastAPI(title="Çözüm Kampüs AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().allowed_origin],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(analyze.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
