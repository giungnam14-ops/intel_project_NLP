import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.analyzer import analyze_document
from backend.document_qa import answer_question
from backend.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalyzeCard,
    AskRequest,
    AskResponse,
    EvidenceItem,
    KeyFacts,
)
from guardrails import apply_guardrails

app = FastAPI(title="5초 문서체크 API", version="1.0.0")

# Allowed CORS origins are read from the BACKEND_ALLOWED_ORIGINS env variable
# (comma-separated). When unset, fall back to the local dev frontend origins so
# local development keeps working without any configuration.
_DEFAULT_ORIGINS = "http://127.0.0.1:5173,http://localhost:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("BACKEND_ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Simple health-check endpoint for the FastAPI server."""
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a document using the NLP analysis engine."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    result = apply_guardrails(request.text, analyze_document)

    return AnalyzeResponse(
        document_type=result["document_type"],
        document_type_label=result["document_type_label"],
        risk_level=result["risk_level"],
        summary=result["summary"],
        cards=[AnalyzeCard(**card) for card in result.get("cards", [])],
        checklist=result.get("checklist", []),
        warnings=result.get("warnings", []),
        guardrail_applied=result.get("guardrail_applied", True),
        blocked=result.get("blocked", False),
        blocked_reason=result.get("blocked_reason", None),
        highlights=result.get("highlights", []),
        key_facts=result.get("key_facts", None) or KeyFacts(),
    )


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    """Answer a question grounded in the provided document text (no external LLM)."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    result = answer_question(request.text, request.question)

    return AskResponse(
        answer=result.get("answer", ""),
        confidence=result.get("confidence", "low"),
        evidence=[EvidenceItem(**item) for item in result.get("evidence", [])],
        suggested_followups=result.get("suggested_followups", []),
    )
