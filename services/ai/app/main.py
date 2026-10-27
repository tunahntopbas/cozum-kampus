from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import analyze, draft, reports, verify

app = FastAPI(title="Çözüm Kampüs AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().allowed_origin],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(analyze.router)
app.include_router(reports.router)
app.include_router(verify.router)
app.include_router(draft.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
