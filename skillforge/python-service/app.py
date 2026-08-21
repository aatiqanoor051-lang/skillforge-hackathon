"""
app.py

FastAPI entrypoint for the SkillForge Python analysis microservice.
Exposes:
  - POST /api/analyze  -> runs SkillAnalyzer against a submitted payload
  - GET  /health        -> liveness/readiness probe
"""

import logging
import os
import time
from typing import List, Optional

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from analyzer import SkillAnalysisError, SkillAnalyzer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | skillforge-python | %(message)s",
)
logger = logging.getLogger("skillforge.python")

PY_PORT = int(os.getenv("PY_PORT", "5001"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "PY_CORS_ORIGINS", "http://localhost:5000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="SkillForge Analysis Service",
    description="Deterministic skill-gap and readiness analysis for SkillForge.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------- #
# Typed request / response schemas
# --------------------------------------------------------------------- #

class CurrentSkillIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    proficiency: float = Field(default=0, ge=-1000, le=1000)


class QuizScoreIn(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    correct: int = Field(default=0)
    total: int = Field(default=0)


class BenchmarkSkillIn(BaseModel):
    skill: str = Field(..., min_length=1, max_length=100)
    minProficiency: float = Field(default=50, ge=-1000, le=1000)


class AnalyzeRequest(BaseModel):
    current_skills: List[CurrentSkillIn] = Field(default_factory=list)
    target_role: Optional[str] = Field(default="", max_length=200)
    quiz_scores: List[QuizScoreIn] = Field(default_factory=list)
    benchmark_skills: List[BenchmarkSkillIn] = Field(default_factory=list)

    @field_validator("current_skills", "quiz_scores", "benchmark_skills", mode="before")
    @classmethod
    def default_empty_list(cls, v):
        return v if v is not None else []


class ErrorResponse(BaseModel):
    success: bool = False
    error: str


# --------------------------------------------------------------------- #
# Middleware: request logging without sensitive data
# --------------------------------------------------------------------- #

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, duration_ms)
    return response


# --------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------- #

@app.get("/health")
def health():
    return {"success": True, "data": {"status": "ok", "service": "python-analysis"}}


@app.post("/api/analyze")
def analyze(payload: AnalyzeRequest):
    try:
        analyzer = SkillAnalyzer()
        result = analyzer.analyze(
            {
                "current_skills": [s.model_dump() for s in payload.current_skills],
                "target_role": payload.target_role,
                "quiz_scores": [q.model_dump() for q in payload.quiz_scores],
                "benchmark_skills": [b.model_dump() for b in payload.benchmark_skills],
            }
        )
        return {"success": True, "data": result.to_dict()}
    except SkillAnalysisError as exc:
        logger.warning("Analysis validation error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "error": str(exc)},
        )
    except Exception as exc:  # noqa: BLE001 - top-level safety net, logged and reported generically
        logger.exception("Unexpected analysis failure")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": "Internal analysis error."},
        )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "Internal server error."},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=PY_PORT, reload=False)
